'use client'

import { useState, useRef, useEffect, useReducer } from 'react';
import Script from 'next/script';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { icons } from '@/public/icons';
import { Component, Quaternion, Stage, Structure } from 'ngl';
import VectorBuffer from 'ngl/dist/declarations/buffer/vector-buffer';
import { userAgent } from 'next/server';

// 定义导航项
const navItems = [
  { id: 1, title: "分子结构", icon: icons.target },
  { id: 2, title: "分子视图", icon: icons.molecule },
  { id: 3, title: "分子配色", icon: icons.microscope },
  { id: 4, title: "分子位置", icon: icons.flask },
  { id: 5, title: "分子选择与分离", icon: icons.route },
  { id: 6, title: "多配体对比视图", icon: icons.antibody },

];

// 声明全局3Dmol类型
declare global {
  interface window {
    NGL: any;
  }
}

interface MoleculeFile {
  id: string;
  file: File;
  color: string;
  visible: boolean;
  molComponent: Component;
}
type ElementMassMap = {
  [key: string]: number; // 允许字符串索引
};

const elementMassMap: ElementMassMap = {
  H: 1.008,
  HE: 4.0026,
  LI: 6.94,
  BE: 9.0122,
  B: 10.81,
  C: 12.011,
  N: 14.007,
  O: 15.999,
  F: 18.998,
  NE: 20.180,
  NA: 22.990,
  MG: 24.305,
  AL: 26.982,
  SI: 28.085,
  P: 30.974,
  S: 32.065,
  CL: 35.453,
  AR: 39.948,
  K: 39.098,
  CA: 40.078,
  FE: 55.845,
  ZN: 65.38,
  CU: 63.546,
  MN: 54.938,
  CO: 58.933
};

const DEFAULT_COLORS = ['#FF4B4B', '#4CAF50', '#2196F3', '#9C27B0', '#FF9800'];

export default function MultiLigandComparisonPage() {
  const router = useRouter();
  const [selectedMFiles, setSelectedMFiles] = useState<MoleculeFile[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [viewStyle, setViewStyle] = useState<'cartoon' | 'ball+stick' | 'line'>('ball+stick');
  const stageRef = useRef<any>(null);
  const [lockedComponents , setLockedComponents] = useState<Component[]>([])
  const lockedComponentRef = useRef<MoleculeFile | null>(null)
  const numRef = useRef<any>(1)

  function invertQuaternion(q: Quaternion): Quaternion {
    return {x: -q.x ,y: -q.y, z: -q.z, w: q.w}
  }
  function multiplyQuaternions(a: Quaternion, b: Quaternion): Quaternion {
    const ax = a.x, ay = a.y, az = a.z, aw = a.w;
    const bx = b.x, by = b.y, bz = b.z, bw = b.w;
    
    // 四元数乘法公式
    return {
      x:aw * bx + ax * bw + ay * bz - az * by,  // x
      y:aw * by - ax * bz + ay * bw + az * bx,  // y
      z:aw * bz + ax * by - ay * bx + az * bw,  // z
      w:aw * bw - ax * bx - ay * by - az * bz   // w
    };
  }
  async function  onCameraChanged ()  {
    lockedComponentRef.current=selectedMFiles[0];
    if (!lockedComponentRef.current) return;
    console.log('handle changed')
    // 获取舞台当前的旋转矩阵（相机视角旋转）


    let newRotationQuaternion : Quaternion;
    const currentQuaternion = stageRef.current.viewerControls.rotation;
    const baseQuaternion :Quaternion = {x: 0, y: 0, z: 0, w: 1}
    newRotationQuaternion = await multiplyQuaternions(invertQuaternion(baseQuaternion),invertQuaternion(currentQuaternion));
    lockedComponentRef.current.molComponent.setRotation(newRotationQuaternion)
    console.log(stageRef.current.viewerControls.rotation)
    console.log(lockedComponentRef.current.molComponent.quaternion)

  };

  const getAtomCentroid = (fileContent:string[])=>{
    let massX:number = 0;
    let massY:number = 0;
    let massZ:number = 0;
    let m:number = 0;
    
    fileContent.forEach(line=>{
      const elementSymbol = line.substring(75, 78).trim().toUpperCase();
      if((line.startsWith('ATOM') || line.startsWith('HETATM')) && line.length >= 27){
          if (elementSymbol in elementMassMap) {
          const mass = elementMassMap[elementSymbol]; // 此时无类型错误
          m += mass;
          massX += parseFloat(line.substring(30,38).trim()) * mass;
          massY += parseFloat(line.substring(38,46).trim()) * mass;
          massZ += parseFloat(line.substring(46,54).trim()) * mass;
        } else {
          console.warn(`未知元素符号: ${elementSymbol}，跳过该原子`);
        }
      }
    });


    return [massX / m , massY / m , massZ / m ];

  }
  const transformPosition = async (MComponent2:MoleculeFile)=> {
    
    const centroid2=getAtomCentroid((await (MComponent2.file.text())).split('\n'))
    MComponent2.molComponent.setPosition([-centroid2[0],-centroid2[1],-centroid2[2]])
    MComponent2.molComponent.autoView();
    return ;
  }
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !file.name.endsWith('.pdb')) {
      alert('请上传.pdb格式的文件');
      return;
    }

    try {
      if(!stageRef.current)initViewer();

      const newColor = DEFAULT_COLORS[selectedMFiles.length % DEFAULT_COLORS.length];
      await stageRef.current!.loadFile(file).then(function (o:Component){
        o.addRepresentation(viewStyle,{visible:true,color:newColor,
          roughness: 0.3, metalness: 0.3, diffuse: "#ff9999"
        });
        setSelectedMFiles(prev => [...prev, {
          id: Date.now().toString(),
          file,
          color: newColor,
          visible: true,
          molComponent: o
        }]);
        o.autoView();
        transformPosition({
          id: Date.now().toString(),
          file,
          color: newColor,
          visible: true,
          molComponent: o
        })
        
      })
      
    } catch (error) {
      console.log("stage 信号:", Object.keys(stageRef.current.viewer.signals));
      console.error('Error loading PDB file:', error);
      alert('加载PDB文件时出错');
    } finally {
      setIsLoading(false);
    }
  };

  const initViewer =() => {
    if (!window.NGL)
      return;
    
    try {
      console.log(1);
      // containerRef.current=document.getElementById('molecule-viewer');

      stageRef.current = new window.NGL.Stage(containerRef.current!.id,{backgroundColor:'black'})

      // 加载所有分子
      for (const MFile of selectedMFiles) {  
        MFile.molComponent.removeAllRepresentations();
        MFile.molComponent.addRepresentation(viewStyle,{color:MFile.color,visible:MFile.visible,roughness: 0.3, metalness: 0.3, diffuse: "#ff9999"})
      }
    } catch (error) {
      console.error('Error initializing viewer:', error);
    }
  };

  const toggleViewStyle =  (style:string) => {
    if (!stageRef.current) return;

    try {

      // 重新加载所有可见的分子
      for (const MFile of selectedMFiles) {  
        MFile.molComponent.removeAllRepresentations();
        MFile.molComponent.addRepresentation(style,{color:MFile.color,visible:MFile.visible,roughness: 0.3, metalness: 0.3, diffuse: "#ff9999"})
        MFile.molComponent.autoView();
        console.log(MFile.molComponent);
      }


    } catch (error) {
      console.error('Error toggling view style:', error);
    }
  };

  const getButtonStyles = (buttonStyle: 'cartoon' | 'ball+stick' | 'line') => {
    const isActive = viewStyle === buttonStyle;
    return `px-4 py-2 rounded transition-colors ${isActive
      ? 'bg-[#25b5ab] text-white'
      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`;
  };

  const updateMoleculeVisibility = async (id: string, visible: boolean) => {
    if (!stageRef.current) return;

    try {
      
      // 重新加载所有分子
      setSelectedMFiles((prev)=>{
       for (const MFile of prev) {  
        if(MFile.id === id){
            MFile.visible=visible;
            MFile.molComponent.setVisibility(MFile.visible);
            MFile.molComponent.autoView();
          }
        }
        return prev;
      });
      setSelectedMFiles(prev =>
        prev.map(mol => mol.id === id ? { ...mol,visible:visible } : mol)
      );

    } catch (error) {
      console.error('Error updating visibility:', error);
    }
  };

  const removeMolecule = async (id: string) => {
    for (const MFile of selectedMFiles) {  
        if(MFile.id === id)MFile.molComponent.removeAllRepresentations();
      }
    setSelectedMFiles(prev => prev.filter(mol => mol.id !== id));

  };

  const updateMoleculeColor = async (id: string, color: string) => {
    for (const MFile of selectedMFiles) {  
        MFile.molComponent.removeAllRepresentations();

      }
    setSelectedMFiles(prev => prev.map(mol => mol.id === id ? { ...mol, color: color } : mol)
    );
    console.log(selectedMFiles);
    if (!stageRef.current) return;

    try {
      
      // 重新加载所有分子
      for (const MFile of selectedMFiles) {  

        MFile.molComponent.addRepresentation(viewStyle,{color:MFile.color,visible:MFile.visible,roughness: 0.3, metalness: 0.3, diffuse: "#ff9999"})
      }


    } catch (error) {
      console.error('Error updating color:', error);
    }
  };

  const updateMoleculeRoughness = (id:string , roughness:string)=>{
    console.log(roughness)
  }
  return (
    <div className="min-h-screen bg-white flex">
      {/* 左侧导航栏 */}
      <div className="w-64 border-r border-gray-200 bg-white">
        <div className="p-4 border-b border-gray-200">
          <Image
            src="/icons/logo.svg"
            alt="Logo"
            width={40}
            height={40}
            className="object-contain cursor-pointer"
            onClick={() => router.push('/')}
          />
        </div>
        <nav className="p-4">
          {navItems.map((item) => (
            <div
              key={item.id}
              onClick={() => router.push(`/feature/${item.id}`)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-colors ${item.title === "多配体对比视图"
                ? 'bg-[#25b5ab] text-white'
                : 'text-gray-600 hover:bg-gray-50'
                }`}
            >
              <div className="w-5 h-5">
                <Image
                  src={item.icon}
                  alt={item.title}
                  width={20}
                  height={20}
                  className={item.title === "多配体对比视图" ? 'brightness-0 invert' : ''}
                />
              </div>
              <span className="text-sm">{item.title}</span>
            </div>
          ))}
        </nav>
      </div>

      {/* 主要内容区域 */}
      <div className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          {/* 标题和说明 */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-[#1e485d] mb-4">多配体对比视图</h1>
            <p className="text-gray-600 leading-relaxed">
              通过上传多个分子结构文件，在同一视图中对比它们的结构差异。系统会自动将分子置于同一重心，并用不同颜色展示不同的分子结构。
            </p>
          </div>

          {/* 上传区域 */}
          <div className="text-center p-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <input
              type="file"
              accept=".pdb"
              onChange={handleFileUpload}
              className="hidden"
              id="pdb-upload"
            />
            <label
              htmlFor="pdb-upload"
              className="bg-[#25b5ab] text-white px-6 py-2 rounded cursor-pointer hover:bg-[#1e9c93]"
            >
              上传PDB文件
            </label>
            <p className="mt-2 text-sm text-gray-500">
              支持上传多个.pdb格式文件进行对比
            </p>
          </div>

          {1 && (
            <div className="mt-8 space-y-6">
              {/* 分子列表 */}
              <div className="bg-white p-6 rounded-lg border">
                <h3 className="font-semibold mb-4">已加载的分子</h3>
                <div className="space-y-3">
                  {selectedMFiles.map((molecule) => (
                    <div key={molecule.id} className="flex items-center justify-between bg-gray-50 p-3 rounded">
                      <span>{molecule.file.name}</span>
                      <div className="flex items-center gap-4">
                        <div 
                          className={`px-3 py-1 rounded 'bg-green-500 text-white'}`}
                          
                        />
                        <input
                          type="range" 
                          id="basicSlider" 
                          min="0"      
                          max="1"    
                          value="0.3"   
                          step="0.01"   
                          onChange={(e) => {
                            updateMoleculeRoughness(molecule.id, e.target.value);
                          }}
                          
                        />
                        <input
                          type="color"
                          value={molecule.color}
                          onChange={(e) => {
                            updateMoleculeColor(molecule.id, e.target.value);
                          }}
                          className="w-8 h-8 rounded cursor-pointer"
                        />
                        <button
                          onClick={() => {
                            updateMoleculeVisibility(molecule.id, !molecule.visible);
                          }}
                          className={`px-3 py-1 rounded ${molecule.visible
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-300 text-gray-700'
                            }`}
                        >
                          {molecule.visible ? '显示' : '隐藏'}
                        </button>
                        <button
                          onClick={() => removeMolecule(molecule.id)}
                          className="text-red-500 hover:text-red-600"
                        >
                          删除
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 视图切换按钮组 */}
              <div className="bg-white p-4 rounded-lg border">
                <div className="flex justify-center gap-4">
                  <button
                    onClick={() => {
                      setViewStyle('ball+stick');
                      toggleViewStyle('ball+stick');
                    }}
                    className={getButtonStyles('ball+stick')}
                  >
                    球状模型
                  </button>
                  <button
                    onClick={() => {
                      setViewStyle('line');
                      toggleViewStyle('line');
                    }}
                    className={getButtonStyles('line')}
                  >
                    棍状模型
                  </button>
                  <button
                    onClick={() => {
                      setViewStyle('cartoon');
                      toggleViewStyle('cartoon');
                    }}
                    className={getButtonStyles('cartoon')}
                  >
                    卡通模型
                  </button>
                  <button
                    onClick={() => {
                      onCameraChanged();
                    }}
                    className={`px-4 py-2 rounded transition-colors bg-green-400 text-black-600 hover:bg-green-600`}
                    
                  >
                    { '复位首个分子:'+selectedMFiles[0]?.molComponent.object.id}
                  </button>
                </div>
              </div>

              {/* 分子查看器 */}
              <div className="relative">
                    <div
                      id="molecule-viewer"
                      className="w-full h-[800px] bg-white rounded-lg border"
                      style={{
                        position: 'relative',
                        overflow: 'hidden'
                      }}
                      ref={containerRef}
                      
                    />
                {isLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#25b5ab]"></div>
                      <p className="mt-2 text-[#25b5ab]">加载中...</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <Script
        src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.6.0/jquery.min.js"
        strategy="beforeInteractive"
        onLoad={() => {
          console.log('3Dmol.js loaded successfully');
        }}
        onError={(e) => {
          console.error('Error loading 3Dmol.js:', e);
        }}
      />
      <Script
        src="https://cdn.jsdelivr.net/npm/ngl@2.0.1/dist/ngl.js"
        strategy="afterInteractive"
        onLoad={() => {
          console.log('3Dmol.js loaded successfully');
        }}
        onError={(e) => {
          console.error('Error loading 3Dmol.js:', e);
        }}
      />
    </div>
  );
}


