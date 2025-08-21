'use client'

import { useState, useRef, useEffect } from 'react';
import Script from 'next/script';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { icons } from '@/public/icons';
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


export default function MoleculePositionPage() {
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const atomListRef=useRef<Array<{'atomCom':Component , 'serial':number ,'index':number}>>([])
  const stageRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAtomForAdjust, setSelectedAtomForAdjust] = useState<number | null>(null);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);
  const [backgroundColor, setBackgroundColor] = useState<string>('white');
  const containerRef = useRef<HTMLDivElement>(null)
  const [recentComponent,setRecentComponent] = useState<Component | null>(null);
  const [selectedAtoms,setSelectedAtoms] = useState<Array<number>>([]);
  const [distanceRepresentations,setDistanceRepresentations]= useState<Array<{representation:Component}>>([])
  const [recentAroundAtomsComponent, setRecentAroundAtomsComponent]=useState<Component | null>(null);
  const [recentHYDBNDComponent,setRecentHYDBNDComponent]=useState<Component|null>(null);
  const clearAllHighlights = () => {
    atomListRef.current.forEach(function (atom){
      atom.atomCom.removeAllRepresentations();
      console.log(atom)
    })
    atomListRef.current=[];
    setSelectedAtoms([]);
    setDistanceRepresentations((prev)=>{
      prev.forEach(function (eachPresentation){
        eachPresentation.representation.removeAllRepresentations();
      });
      return [];
    })
    setRecentAroundAtomsComponent((prev)=>{
      console.log(prev)
      prev?.removeAllRepresentations();
      return null;
    })
    setRecentHYDBNDComponent((prev)=>{
      prev?.removeAllRepresentations();
      return null;
    })

  };
  const handleAtomClick = async (event: any) => {
    if(!event.atom || !stageRef.current || !selectedFile)return ;
    var atomCom:any;
    var serial:number = event.atom.serial;

    await stageRef.current.loadFile(selectedFile).then(async function (o:Component){
      var listIndex:number=-1;
      var index:number=-1;
      atomListRef.current.forEach((atom)=>{
        index=index+1;
        if (atom.serial === serial && listIndex == -1){
          listIndex=index;
        }
      })
      const isHighlighted:Boolean= listIndex !== -1;
      console.log(listIndex,isHighlighted);
      if(!isHighlighted){
        atomCom=await o;
        var newAtomList= [...atomListRef.current,{"atomCom":atomCom,"serial":serial,'index':event.atom.index}]
        await o.addRepresentation(
            'spacefill',
            {
              sele:event.atom.resno.toString()+':'+event.atom.chainname+'.'+event.atom.atomType.atomname+'/0',
              color:'lightgreen',
              radius:'1'
            });
        console.log('frag')
        atomListRef.current=newAtomList;
        console.log(atomListRef.current);
        setSelectedAtoms((prev) => {

          const newSelected = [...prev, serial];
          
          return newSelected;
        });
      }
      if(isHighlighted){
        atomListRef.current[listIndex].atomCom.removeAllRepresentations(); 
        var list=atomListRef.current;
        list.splice(listIndex,1);
        // setAtomList([...list]);
        atomListRef.current=list;

        setSelectedAtoms((prev) => {

          var newSelected = [...prev];
          newSelected.splice(listIndex,1);
          
          return newSelected;
        });
      }
    });


    if(atomListRef.current.length >= 2){
      console.log('disped')
      setDistanceRepresentations((prev)=>{
        prev.forEach(function (eachPresentation){
          eachPresentation.representation.removeAllRepresentations();
        });
        return [];
      })
      atomListRef.current.forEach(async function ( atom1 ){
        atomListRef.current.forEach(async function (atom2) {
          if(atom1!=atom2){
              await stageRef.current.loadFile(selectedFile).then(async function (o:Component){
              await o.addRepresentation('distance',{atomPair:[[atom1.index,atom2.index]], color:'lightblue'});
              setDistanceRepresentations((prev)=>{
                const newPresentations=[...prev,{representation:o}];
                return newPresentations;
              });
            })
          }
          
        })
      })
    }
    else{
      setDistanceRepresentations((prev)=>{
        prev.forEach(function (eachPresentation){
          eachPresentation.representation.removeAllRepresentations();
        });
        return [];
      })
    };
  };
  // Load PDB file into 3Dmol.js viewer
    useEffect(() => {
    if ( !stageRef.current&& containerRef.current) {
      initViewer();
    }
  }, [selectedFile]);

  const initViewer = () => {

    if (!containerRef.current){
        console.error('Container ref is not available');
        return ;
    }
    if (!window.NGL){
        console.error('NGL lib not loaded');
        return ;
    }
    try{
        console.log(containerRef.current.id)
        stageRef.current =new window.NGL.Stage(containerRef.current.id, { backgroundColor: "white" });
        console.log(stageRef.current)
        console.log("stage loaded");
        if(!stageRef.current.signals.clicked.has(handleAtomClick))stageRef.current.signals.clicked.add(handleAtomClick);

    }catch(error){
        console.error('Error initializing viewer:', error);
    }




  };

  // 添加辅助函数用于找到最近的原子

  // 修改为使用PyMOL API的测量函数
  const measureAtomDistance = async (atom1: {atomCom:Component, serial:number}, atom2:{atomCom:Component, serial:number}, stage: any) => {
    setDebugInfo(`原子 ${atom1.serial} 和 ${atom2.serial} 之间的距离，已显示在相连虚线旁（ Å ）  切换深色背景便于观察`);
  };

  //初展示pdb
  const initShow=async (file:File)=>{
    await stageRef.current.loadFile(file,{ name: "componentAll" }).then(function (o:Component) {
        // o.addRepresentation("ball+stick", {
        //   radius: 0.2,
        //   colorscheme: 'chainHetatm' 
        // })
        o.addRepresentation("spacefill", { sele: "polymer",colorscheme: 'byElement' ,radius: 0.8,opacity:0.3});
        o.autoView()
        setRecentComponent(o);
      })
  }

  //字面意思
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsLoading(true);
      setSelectedFile(file);
      initViewer();
      const content = await file.text();

      // 确保查看器已初始化
      if (!stageRef.current) {
        await initViewer();
        initShow(file);
        // stageRef.current.loadFile(file ,{defaultRepresentation: true})
      }
      console.log('1');
      // 显示分子
      if (stageRef.current) {

        
        console.log(file);
      //  stageRef.current.loadFile(file ,{defaultRepresentation: true})
      initShow(file);

      }
    } catch (error) {
      console.error('Error loading PDB file:', error);
      alert('加载PDB文件时出错，请确保文件格式正确。');
    } finally {
      setIsLoading(false);
    }
  };

  // 添加键角计算功能
  const measureAngle = async (atom1: number, atom2: number, atom3: number) => {
    try {
      // 1. 定义带索引签名的类型
      type ElementMassMap = {
        [key: string]: number; // 允许字符串索引
      };

      // 2. 初始化元素质量映射表
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
      var position1,position2,position3:Array<number>
      const lines= await (await selectedFile!.text()).split('\n');
      // 获取xyz
      lines.forEach(line=>{

        if((line.startsWith('ATOM') || line.startsWith('HETATM')) && line.length >= 27){
          if(parseInt(line.substring(6,11).trim())==atom1)
            position1=[parseFloat(line.substring(30,38).trim()),parseFloat(line.substring(38,46).trim()),parseFloat(line.substring(46,54).trim())];
          if(parseInt(line.substring(6,11).trim())==atom2)
            position2=[parseFloat(line.substring(30,38).trim()),parseFloat(line.substring(38,46).trim()),parseFloat(line.substring(46,54).trim())];
          if(parseInt(line.substring(6,11).trim())==atom3)
            position3=[parseFloat(line.substring(30,38).trim()),parseFloat(line.substring(38,46).trim()),parseFloat(line.substring(46,54).trim())];
          const elementSymbol :string = line.substring(75, 78).trim().toUpperCase();
          const mass = elementMassMap[elementSymbol];

        }
      })
      
      
      // 计算向量
      // const vector
      const vector1 = {
        x: position1![0] - position2![0],
        y: position1![1] - position2![1],
        z: position1![2] - position2![2],
      };

      const vector2 = {
        x: position3![0] - position2![0],
        y: position3![1] - position2![1],
        z: position3![2] - position2![2],
      };
      // 计算点积
      const dotProduct = vector1.x * vector2.x + vector1.y * vector2.y + vector1.z * vector2.z;
      // 计算向量长度
      const magnitude1 = Math.sqrt(vector1.x * vector1.x + vector1.y * vector1.y + vector1.z * vector1.z);
      const magnitude2 = Math.sqrt(vector2.x * vector2.x + vector2.y * vector2.y + vector2.z * vector2.z);

      // 计算角度（弧度）
      const angleRadians = Math.acos(dotProduct / (magnitude1 * magnitude2));

      // 转换为角度
      const angleDegrees = angleRadians * (180 / Math.PI);

      return angleDegrees;

    } catch (error) {
      console.error('计算角度时出错:', error);
      return null;
    }
  };

  // 添加氢键分析功能
  const analyzeHydrogenBonds = async (cutoff: number = 3.2) => {
    if(recentHYDBNDComponent){
      return;
    }
    stageRef.current.loadFile(selectedFile).then(function (o:Component){

      o.addRepresentation('contact',{type:'hbond'})
      setRecentHYDBNDComponent(()=>{return o;})
    })
    setDebugInfo('可能氢键已在图中显示（深色背景便于观察）')
  };

  // 添加更新背景色的函数
  const updateViewerBackground = (color: string) => {
    if (!stageRef.current||color===backgroundColor) return;
    setBackgroundColor(color);
    console.log(backgroundColor);
    stageRef.current.setParameters({backgroundColor:color});
    
  };

  // 添加前端实现的分析相邻原子功能
  const analyzeNeighborAtoms = async () => {
    const content:string = await selectedFile!.text();
    const lines = content.split('\n');
    let distance :number=0;
    let list:any=[];
    let seleContent:string='';
    // 遍历所有原子对
    let debugCont:string='与所选原子相距小于 5 埃的原子已被突出显示，序列号、距离信息如下\n'
    lines.forEach(line =>{
      if((line.startsWith('ATOM') || line.startsWith('HETATM')) && line.length >= 27){
        // if(!hydrogenDonors.includes(line[])&&!hydrogenAcceptors.includes(line[]))
        if(selectedAtoms.includes(parseInt(line.substring(6,11).trim()))){
          console.log(parseInt(line.substring(6,11).trim()))
          lines.forEach(lineForTGT=>{
            if((lineForTGT.startsWith('ATOM') 
              || lineForTGT.startsWith('HETATM')) 
                && lineForTGT.length >= 27
                  && parseInt(line.substring(6,11).trim())!=parseInt(lineForTGT.substring(6,11).trim())){
                    distance=Math.sqrt(
                      Math.pow(parseFloat(lineForTGT.substring(30,38).trim()) - parseFloat(line.substring(30,38).trim()), 2) +
                      Math.pow(parseFloat(lineForTGT.substring(38,46).trim()) - parseFloat(line.substring(38,46).trim()), 2) +
                      Math.pow(parseFloat(lineForTGT.substring(46,54).trim()) - parseFloat(line.substring(46,54).trim()), 2)
                    )
                    if (distance<=5){
                      list=[...list,parseInt(line.substring(6,11).trim())];
                      seleContent=seleContent.length? seleContent+' or ( '+lineForTGT.substring(22,26).trim()+' and .'+lineForTGT.substring(12,16).trim()+' and :'+lineForTGT.substring(21,22).trim()+' ) '
                                                    : seleContent+'( '+lineForTGT.substring(22,26).trim()+' and .'+lineForTGT.substring(12,16).trim()+' and :'+lineForTGT.substring(21,22).trim()+' ) '

                      console.log(seleContent)
                      debugCont+=`\n与原子${line.substring(6,11).trim()}相距${distance}Å 的${lineForTGT.substring(6,11).trim()}`
                    };
                  }
          })
        };
      };//only atomInfo
    })
    if(!recentAroundAtomsComponent){
      stageRef.current.loadFile(selectedFile).then(function (o:Component){
        o.addRepresentation('spacefill',{sele:seleContent, radius:0.5, color: 'pink'});
        setRecentAroundAtomsComponent(()=>{return o;})
      })
      setDebugInfo(debugCont);
    }else{
      recentAroundAtomsComponent.removeAllRepresentations()
      stageRef.current.loadFile(selectedFile).then(function (o:Component){
        o.addRepresentation('spacefill',{sele:seleContent, radius:0.5, color: 'pink'});
        setRecentAroundAtomsComponent(()=>{return o;})
      })
    }
  };

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
              className={`flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-colors ${item.title === "分子位置"
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
                  className={item.title === "分子位置" ? 'brightness-0 invert' : ''}
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
            <h1 className="text-3xl font-bold text-[#1e485d] mb-4">分子位置</h1>
            <p className="text-gray-600 leading-relaxed">
              通过不同的功能来调整和测量分子中原子的位置信息，帮助用户更好地理解分子的空间结构和原子间关系。
            </p>
          </div>

          {/* 新的功能区域 - 使用flex布局 */}
          <div className="flex gap-6">
            {/* 左侧分子查看器 */}
            <div className="flex-grow space-y-6">
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
                  {selectedFile ? '重新上传' : '上传PDB文件'}
                </label>
                <p className="mt-2 text-sm text-gray-500">
                  {selectedFile
                    ? `当前文件：${selectedFile.name}`
                    : '支持.pdb格式文件'
                  }
                </p>
              </div>

              {/* 分子查看器 */}
              { selectedFile &&(
                <div className="relative">
                  <div
                    id="molecule-viewer"
                    className="w-full h-[500px] bg-white rounded-lg border relative"
                    style={{
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                    ref ={containerRef}
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
              )}
            </div>

            {/* 右侧功能区域 */}
            {selectedFile && (
              <div className="w-80 space-y-4">
                {/* 操作说明 */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-blue-800">
                    • 左键点击两个原子可测量距离
                    <br />
                    • 选择原子后可使用功能按钮进行分析
                  </p>
                </div>

                {/* 背景色选择 */}
                <div className="bg-white rounded-lg border p-4">
                  <h3 className="text-sm font-semibold mb-2">背景设置:</h3>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => updateViewerBackground('white')}
                      className={`w-8 h-8 border ${backgroundColor === 'white' ? 'ring-2 ring-blue-500' : ''} bg-white rounded-full`}
                      title="白色背景"
                    />
                    <button
                      onClick={() => updateViewerBackground('#f0f0f0')}
                      className={`w-8 h-8 border ${backgroundColor === '#f0f0f0' ? 'ring-2 ring-blue-500' : ''} bg-[#f0f0f0] rounded-full`}
                      title="浅灰色背景"
                    />
                    <button
                      onClick={() => updateViewerBackground('#333333')}
                      className={`w-8 h-8 border ${backgroundColor === '#333333' ? 'ring-2 ring-blue-500' : ''} bg-[#333333] rounded-full`}
                      title="深灰色背景"
                    />
                    <button
                      onClick={() => updateViewerBackground('black')}
                      className={`w-8 h-8 border ${backgroundColor === 'black' ? 'ring-2 ring-blue-500' : ''} bg-black rounded-full`}
                      title="黑色背景"
                    />
                  </div>
                </div>

                {/* 原子选择列表 */}
                <div className="bg-white rounded-lg border p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-sm font-semibold">选择原子:</h3>
                    <button
                      onClick={() => {clearAllHighlights()}}
                      className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded"
                    >
                      清除选择
                    </button>
                  </div>
                  <div className="max-h-32 overflow-y-auto border rounded p-2 bg-white">
                    <div className="mb-2 text-xs text-gray-500 sticky top-0 bg-white p-1 border-b">
                      {atomListRef.current.length === 0 && "请选择一个原子"}
                      {atomListRef.current.length === 1 && `已选择原子 ${atomListRef.current[0].serial}，请选择第二个原子测量距离`}
                      {atomListRef.current.length === 2 && `显示原子 ${atomListRef.current[0].serial} 和 ${atomListRef.current[1].serial} 之间的距离`}
                    </div>

                    {/* {stageRef.current && stageRef.current.atoms &&
                     stageRef.current.getModel().atoms
                        .slice(0, 100) // 限制显示的原子数量
                        .map((atom: any) => (
                          <div
                            id={`atom-item-${atom.serial}`}
                            key={atom.serial}
                            // className={`px-2 py-1 text-xs cursor-pointer hover:bg-gray-100 ${selectedAtoms.includes(atom.serial) ? 'bg-blue-100 font-bold' : ''
                            className={`px-2 py-1 text-xs cursor-pointer hover:bg-gray-100 ${(atomListRef.current[0].serial==atom.serial || atomListRef.current[1].serial ==atom.serial )? 'bg-blue-100 font-bold' : ''
                              }`}
                            onClick={() => {
                              const atomId = atom.serial;
                              viewerRef.current.setStyle({}, { sphere: { radius: 0.8 }, stick: { radius: 0.2 } });
                              viewerRef.current.setStyle({ serial: atomId }, { sphere: { radius: 1.2, color: 'yellow' } });
                              viewerRef.current.render();

                              setSelectedAtoms((prev) => {
                                if (prev.length >= 2) {
                                  viewerRef.current.removeAllLabels();
                                  viewerRef.current.removeAllShapes();
                                  return [atomId];
                                }
                                return [...prev, atomId];
                              });

                              if (selectedAtoms.length === 1) {
                                measureAtomDistance(selectedAtoms[0], atomId, viewerRef.current);
                              }
                            }}
                          >
                            原子 {atom.serial}: {atom.elem} [{atom.x.toFixed(2)}, {atom.y.toFixed(2)}, {atom.z.toFixed(2)}]
                          </div>
                        ))
                    } */}
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    已选择原子: {selectedAtoms.join(', ')}
                  </div>
                </div>

                {/* 功能按钮组 */}
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      if (atomListRef.current.length === 2) {
                        measureAtomDistance(atomListRef.current[0], atomListRef.current[1], stageRef.current);
                      } else {
                        setDebugInfo('请先选择两个原子');
                      }
                    }}
                    className="w-full px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    测量选中原子距离
                  </button>

                  <button
                    onClick={() => analyzeHydrogenBonds(3.2)}
                    className="w-full px-3 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                  >
                    显示所有氢键
                  </button>

                  <button
                    onClick={() => {
                      if (atomListRef.current.length > 0) {
                        analyzeNeighborAtoms();
                      } else {
                        setDebugInfo('请先选择一个参考原子');
                      }
                    }}
                    className="w-full px-3 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                  >
                    分析相邻原子
                  </button>

                  <button
                    onClick={() => {
                      // viewerRef.current.removeAllLabels();
                      // viewerRef.current.removeAllShapes();
                      // viewerRef.current.setStyle({}, { sphere: { radius: 0.8 }, stick: { radius: 0.2 } });
                      // viewerRef.current.render();
                      // setSelectedAtoms([]);
                      // setDebugInfo(null);
                    }}
                    className="w-full px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    清除所有测量
                  </button>
                </div>

                {/* 调试信息 */}
                {debugInfo && (
                  <div className="p-4 bg-gray-100 rounded-lg">
                    <h3 className="text-sm font-semibold text-gray-700">调试信息:</h3>
                    <pre className="text-xs text-gray-600 mt-2 whitespace-pre-wrap">{debugInfo}</pre>
                    <button
                      onClick={() => setDebugInfo(null)}
                      className="mt-2 text-xs text-red-500 hover:text-red-700"
                    >
                      关闭
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <Script
        src="https://cdn.jsdelivr.net/npm/ngl@2.0.1/dist/ngl.js"
        strategy="beforeInteractive"
      />
      <Script
        src="https://code.jquery.com/jquery-3.6.0.min.js"
        strategy="beforeInteractive"
      />
    </div>
  );
} 
