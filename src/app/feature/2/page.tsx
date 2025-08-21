'use client'

import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import { icons } from '@/public/icons';
import Script from 'next/script';
import { Component, Stage, Structure } from 'ngl';


// 定义导航项
const navItems = [
  { id: 1, title: "分子结构", icon: icons.target },
  { id: 2, title: "分子视图", icon: icons.molecule },
  { id: 3, title: "分子配色", icon: icons.microscope },
  { id: 4, title: "分子位置", icon: icons.flask },
  { id: 5, title: "分子选择与分离", icon: icons.route },
  { id: 6, title: "多配体对比视图", icon: icons.antibody },

];

// 定义视图选项
const viewOptions = [
  { id: 'cartoon', name: '基础视图', icon: '🎨', description: '显示蛋白质的二级结构元素' },
  { id: 'stick', name: '棍状视图', icon: '🔨', description: '显示分子的键结构' },
  { id: 'sphere', name: '球状视图', icon: '⭕', description: '以球体形式显示原子' },
  { id: 'surface', name: '表面视图', icon: '🌊', description: '显示分子表面的凹凸和结合位点。蓝色区域表示凹陷处，红色区域表示凸起处，黄色区域表示可能的结合位点。' },
  { id: 'hydrophobic', name: '疏水视图', icon: '💧', description: '展示分子表面的疏水性分布。红色区域代表疏水性强的区域（不喜欢水），蓝色区域代表亲水性强的区域（喜欢水）。' },
  { id: 'electrostatic', name: '静电势视图', icon: '⚡', description: '显示分子表面的电荷分布。红色区域代表负电荷（富电子区），蓝色区域代表正电荷（缺电子区），白色区域代表中性。' }
];

export default function MoleculeViewPage() {
  const params = useParams();
  const router = useRouter();
  
  const [pdbContent, setPdbContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedView, setSelectedView] = useState('cartoon');
  const stageRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [recentComponent,setRecentComponent] = useState<Component | null>(null)
 

  
   // 初始化查看器
  const initViewer=()=>{
    if (!containerRef.current){
        console.error('Container ref is not available');
        return ;
    }
    if (!window.NGL){
        console.error('NGL lib not loaded');
        return ;
    }
    try{
        stageRef.current =new window.NGL.Stage(containerRef.current.id,{backgroundColor:'white'});
        console.log("stage loaded");
        if (selectedFile) {
            displayMolecule(selectedView)
        }
    }catch(error){
        console.error('Error initializing viewer:', error);
    }
  };

  // 处理文件上传
  const handleFileUpload = async (event : React.ChangeEvent<HTMLInputElement>)=>{

        const file = event.target.files?.[0]; 
        if (!file) return ;

        try{
          
            setIsLoading(true);
            setSelectedFile(file);
            const content = await file.text()
            setPdbContent(content)
            
            console.log('file')
            if(!selectedFile)console.log('null')
            
            if(stageRef.current){
                displayMolecule(selectedView)
            }else{
                await initViewer();
                displayMolecule(selectedView)

            }

        }catch(error){
            console.error('Error loading PDB file:', error);
            alert('加载PDB文件时出错，请确保文件格式正确。');
            setIsLoading(false);
        }
    };

  // 处理视图切换

  // 显示分子结构
  const displayMolecule = (viewId:string) => {
    console.log("dis")
    if (!stageRef.current) return;
    if (!selectedFile) {
      console.log("no file");
      return ;
    }
    console.log(selectedFile)
    try {
      // recentComponent?.dispose();
      // stageRef.current?.dispose();
      // setRecentComponent(null);
      recentComponent?.removeAllRepresentations();

      switch (viewId){
        
        case 'cartoon':

          stageRef.current.loadFile(selectedFile).then(function (o: Component) {

             o.addRepresentation("cartoon", { colorscheme: {
                prop: 'ss',
                map: {
                  helix: '#FF4D4D',
                  sheet: '#4169E1',
                  water: '#00FF00',
                  '': '#B8860B'
                }
              } })
             setRecentComponent(o);
             o.autoView()

          })
          break;
        
        case 'electrostatic':
          stageRef.current.loadFile(selectedFile).then(function (o:Component) {
            o.addRepresentation("surface", {
              sele: "polymer",
              colorScheme: "electrostatic",
              colorDomain: [ -0.1, 0.1 ],
              surfaceType: "av"
            })
            setRecentComponent(o);
            console.log(recentComponent);
            recentComponent!.autoView();
          })
          break;
        
        case 'stick':
          stageRef.current.loadFile(selectedFile).then(function (o:Component) {
            // o.addRepresentation("ball+stick", {
            //   radius: 0.2,
            //   colorscheme: 'chainHetatm' 
            // })
            o.addRepresentation("line", { sele: "polymer",color: 'chainId'  ,radius: 0.2});
            stageRef.current.autoView()
            setRecentComponent(o);
          })

          break;
        case 'surface':
          window.NGL.autoLoad(selectedFile).then(function (structure:Structure) {
            var molsurf = new window.NGL.MolecularSurface(structure)
            var surf = molsurf.getSurface({
              type: "av",
              probeRadius: 1.4,
              name: "molsurf",
              // color: 'spectrum'
            })
            var o = stageRef.current.addComponentFromObject(surf)
            o.addRepresentation("surface",{})
            setRecentComponent(o);
            o.autoView()
          })
          break;

        case 'sphere':
          stageRef.current.loadFile(selectedFile).then(function (o:Component) {
            // o.addRepresentation("spacefill",{color: "chainid" })；
            o.addRepresentation("spacefill",{radius: 0.8,
              colorscheme: 'chainHetatm'})
            setRecentComponent(o);
            console.log(recentComponent);
            recentComponent!.autoView();
          })
          break;
        case 'hydrophobic':
          stageRef.current.loadFile(selectedFile).then(function (o:Component) {
            // o.addRepresentation("surface", {
            //   sele: "polymer",
            //   colorScheme: "volume",
            //   colorDomain: [ -0.3, 0.3 ],
            //   surfaceType: "av"
            // })；
            o.addRepresentation("surface", {
              
              // color: {
                
              //   // gradient: new window.NGL.Gradient.RWB(1)
              // },
              sele: "polymer",
              colorScheme: "hydrophobicity",
              colorDomain: [ -0.3, 0.3 ],
              surfaceType: "av"
            });
            setRecentComponent(o);
            console.log(recentComponent);
            recentComponent!.autoView();
          })
          break;
      
      
      
        }
      // stageRef.current.loadFile(selectedFile, {defaultRepresentation: true});

      setIsLoading(false);
    } catch (error) {
      console.error('Error displaying molecule:', error);
      setIsLoading(false);
    }
  };

  return (
    <>
      <Script
        src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.6.0/jquery.min.js"
        strategy="beforeInteractive"
      />
      <Script
        src="https://cdn.jsdelivr.net/npm/ngl@2.0.1/dist/ngl.js"
        strategy="afterInteractive"
      />

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
                className={`flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-colors ${item.id === 2  // 直接检查是否为分子视图页面
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
                    className={item.id === 2 ? 'brightness-0 invert' : ''}
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
              <h1 className="text-3xl font-bold text-[#1e485d] mb-4">分子视图</h1>
              <p className="text-gray-600 leading-relaxed">
                用户可以选择查看分子的不同方面。包括卡通视图、棍状视图、
                球状视图、表面视图、疏水性视图和静电势视图等。通过切换不同的视图模式，
                可以更好地理解分子的结构特征和物理化学性质。（其中表面视图显示分子表面的凹凸和结合位点。
                蓝色区域表示凹陷处，红色区域表示凸起处，黄色区域表示可能的结合位点；疏水视图展示分子表面的疏水性分布。
                红色区域代表疏水性强的区域（不喜欢水），蓝色区域代表亲水性强的区域（喜欢水）；静电势视图显示分子表面的电荷分布。
                红色区域代表负电荷（富电子区），蓝色区域代表正电荷（缺电子区），白色区域代表中性。）

              </p>
            </div>

            {/* 主要内容区域 */}
            <div className="flex gap-6">
              {/* 左侧视图选项 */}
              <div className="w-48 space-y-2">
                {viewOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={ () =>{
                      setSelectedView(option.id);
                      setSelectedView(()=>{return option.id});
                      displayMolecule(option.id);

                    } }
                    className={`w-full px-4 py-3 rounded-lg text-left transition-colors ${selectedView === option.id
                      ? 'bg-[#25b5ab] text-white'
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                      }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span>{option.icon}</span>
                      <span>{option.name}</span>
                    </div>
                    <p className="text-xs opacity-80">{option.description}</p>
                  </button>
                ))}
              </div>

              {/* 右侧显示区域 */}
              <div className="flex-1">
                <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                  {/* 上传区域 */}
                  <div className="p-8 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">
                        请上传PDB文件以查看分子结构
                      </span>
                      <label className="bg-[#25b5ab] text-white px-6 py-2 rounded cursor-pointer hover:bg-[#1e9c93] transition-colors">
                        上传PDB文件
                        <input
                          type="file"
                          accept=".pdb"
                          className="hidden"
                          onChange={handleFileUpload}
                        />
                      </label>
                    </div>
                  </div>

                  {/* 3D 预览区域 */}
                  <div className="h-[500px] bg-gray-50 relative">
                    <div
                      id="molecule-viewer"
                      ref={containerRef}
                      className="w-full h-full"
                      style={{ display:  'block' }}
                    />

                    {!selectedFile && (
                      <div className="h-full flex items-center justify-center text-gray-400">
                        <div className="text-center">
                          <p>请上传PDB文件以查看分子结构</p>
                          <p className="text-sm mt-2">支持.pdb格式文件</p>
                        </div>
                      </div>
                    )}

                    {isLoading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-50 text-gray-600">
                        <p>正在加载分子结构...</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 