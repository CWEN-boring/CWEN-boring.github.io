'use client'

import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import { icons } from '@/public/icons';
import Script from 'next/script';
import { Component } from 'ngl';

// 定义导航项
const navItems = [
  { id: 1, title: "分子结构", icon: icons.target },
  { id: 2, title: "分子视图", icon: icons.molecule },
  { id: 3, title: "分子配色", icon: icons.microscope },
  { id: 4, title: "分子位置", icon: icons.flask },
  { id: 5, title: "分子选择与分离", icon: icons.route },
  { id: 6, title: "多配体对比视图", icon: icons.antibody },

];

// 定义功能描述
const featureDescriptions = {
  1: {
    title: "分子结构3D可视化",
    description: "用户可以通过这个功能查看分子的详细结构，包括原子、键和分子骨架。允许旋转、移动和缩放分子以便从不同角度观察分子的三维结构。",
    uploadText: "请上传PDB文件以查看分子结构",
    buttonText: "上传PDB文件"
  },

};


export default function FeaturePage() {
  const params = useParams();
  const router = useRouter();
  const currentId = Number(params.id);
  const stageRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [pdbContent, setPdbContent] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
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

    }catch(error){
        console.error('Error initializing viewer:', error);
    }
  };
      
   

  // 显示分子结构
  const displayMolecule= (file:File)=>{
        
        // stageRef.current.loadFile(file ,{defaultRepresentation: true})
        stageRef.current.loadFile(file).then(function (o:Component){
          o.addRepresentation('cartoon',{visible:true})
        })
        setIsLoading(false);
        return ;
  };

  // 处理文件上传
  const handleFileUpload = async (event : React.ChangeEvent<HTMLInputElement>)=>{
        const file = event.target.files?.[0] as File; 
        setSelectedFile(file)
        if (!file) return ;
        try{
            setIsLoading(true);
            setSelectedFile(file);
            
            
            if(stageRef.current){
                displayMolecule(file!)
            }else{
                initViewer();
                displayMolecule(file!);
            }

        }catch(error){
            console.error('Error loading PDB file:', error);
            alert('加载PDB文件时出错，请确保文件格式正确。');
            setIsLoading(false);
        }
    };

  // 监听脚本加载
  useEffect(() => {
    // 脚本加载后会通过onLoad回调初始化查看器，不需要在这里再检查

    return () => {
      // 清理资源
      if (stageRef.current) {
        try {
          // stageRef.current.clear();
          stageRef.current = null;
        } catch (error) {
          console.error('Error cleaning up viewer:', error);
        }
      }
    };
  }, []);

  return (
    <>
      <Script
        src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.6.0/jquery.min.js"
        strategy="beforeInteractive"
      />
      <Script
        src="https://cdn.jsdelivr.net/npm/ngl@2.0.1/dist/ngl.js"
        strategy="afterInteractive"
        onLoad={() => {
          console.log('3Dmol.js loaded successfully');
          if (window.NGL && containerRef.current) {
            initViewer();
          }
        }}
        onError={(e) => {
          console.error('Error loading 3Dmol.js:', e);
          // 如果主要CDN加载失败，尝试使用备用CDN
          //not any spare CDN
        }}
      />

      <div className="min-h-screen bg-white flex">
        {/* 左侧导航栏 */}
        <div className="w-64 border-r border-gray-200 bg-white">
          <div className="p-4 border-b border-gray-200">
            <Image
              src="/icons/logo.svg"
              alt="iDrug Logo"
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
                className={`flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-colors ${currentId === item.id
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
                    className={`${currentId === item.id ? 'brightness-0 invert' : ''}`}
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
            {/* 功能说明部分 */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-[#1e485d] mb-4">
                {featureDescriptions[currentId as keyof typeof featureDescriptions]?.title}
              </h1>
              <p className="text-gray-600 leading-relaxed">
                {featureDescriptions[currentId as keyof typeof featureDescriptions]?.description}
              </p>
            </div>

            {/* 文件上传和预览区域 */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              {/* 上传区域 */}
              <div className="p-8 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">
                    {featureDescriptions[currentId as keyof typeof featureDescriptions]?.uploadText}
                  </span>
                  <label className="bg-[#25b5ab] text-white px-6 py-2 rounded cursor-pointer hover:bg-[#1e9c93] transition-colors">
                    {featureDescriptions[currentId as keyof typeof featureDescriptions]?.buttonText}
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
              <div className="h-[500px] bg-gray-100 relative border rounded-lg">
                <div
                  id="molecule-viewer"
                  ref={containerRef}
                  className="w-full h-full"
                  style={{ display:  'block'  }}
                />

                {!selectedFile && (
                  <div className="h-full flex items-center justify-center text-gray-400">
                    <div className="text-center">
                      <p>请上传PDB文件以查看分子结构</p>
                      <p className="text-sm mt-2">支持.pdb格式文件</p>
                    </div>
                  </div>
                )}

                {/* 加载提示 */}
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
    </>
  );
} 