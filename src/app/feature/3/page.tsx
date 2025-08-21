'use client'

import { useState, useRef, useEffect } from 'react';
import Script from 'next/script';
import { useRouter,useParams } from 'next/navigation';
import Image from 'next/image';
import { icons } from '@/public/icons';
import { Component,} from 'ngl';
import AtomProxy from 'ngl/dist/declarations/proxy/atom-proxy';
import { PickingData } from 'ngl/dist/declarations/controls/picking-proxy';
import { clear } from 'console';


// 定义导航项
const navItems = [
  { id: 1, title: "分子结构", icon: icons.target },
  { id: 2, title: "分子视图", icon: icons.molecule },
  { id: 3, title: "分子配色", icon: icons.microscope },
  { id: 4, title: "分子位置", icon: icons.flask },
  { id: 5, title: "分子选择与分离", icon: icons.route },
  { id: 6, title: "多配体对比视图", icon: icons.antibody },

];

// 定义配色方案
const colorSchemes = [
  {
    id: 'elementColors',
    name: '元素配色',
    icon: '⚛️',
    description: '根据原子类型显示不同颜色，帮助识别分子中的不同元素'
  },
  {
    id: 'hydrophobic',
    name: '疏水性配色',
    icon: '💧',
    description: '红色表示疏水区域（不喜欢水），蓝色表示亲水区域（喜欢水），帮助理解蛋白质表面性质'
  },
  {
    id: 'electrostatic',
    name: '静电势配色',
    icon: '⚡',
    description: '红色表示负电荷区域，蓝色表示正电荷区域，白色表示中性区域，展示分子的电荷分布'
  },
  {
    id: 'bFactor',
    name: 'B因子配色',
    icon: '🌡️',
    description: '显示原子的温度因子分布，反映分子各部分的灵活性'
  },
  {
    id: 'conservation',
    name: '序列保守性',
    icon: '🧬',
    description: '显示氨基酸序列的保守程度，帮助识别功能重要区域'
  },
  {
    id: 'atomHighlight',
    name: '原子高亮模式',
    icon: '💡',
    description: '点击任意原子使其高亮显示，便于分析特定原子的特性和位置'
  }
];

// declare global {
//   interface Window {
//     NGL: any;
//   }
// }

export default function MoleculeColoringPage() {
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pdbContent, setPdbContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedScheme, setSelectedScheme] = useState('elementColors');
  const [highlightedAtoms, setHighlightedAtoms] = useState<{}[]>([]);

  const [recentComponent,setRecentComponent] = useState<Component | null>(null);
  const stageRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const params = useParams();
  const [recentAtomComponent,setRecentAtomComponent]=useState<any | null >(null)
  // var atomList:Array<{'atomCom':Component , 'serial':number }>=[];
  // const [atomList,setAtomList]=useState<Array<{'atomCom':Component , 'serial':number }>>([]);
  const atomListRef=useRef<Array<{'atomCom':Component , 'serial':number }>>([])
  // 清除所有高亮的函数
  const clearAllHighlights = () => {
    // console.log(atomList)
    // atomList.forEach(function (atom){
    //   atom.atomCom.removeAllRepresentations();
    //   console.log(atom)
    // })
    // console.log(1111111111)
    // setAtomList([]);
    console.log(atomListRef.current)
    atomListRef.current.forEach(function (atom){
      atom.atomCom.removeAllRepresentations();
      console.log(atom)
    })
    atomListRef.current=[];
  };

  // 修改添加图例组件
  const renderColorLegend = () => {
    if (!selectedFile) return null;

    switch (selectedScheme) {
      case 'elementColors':
        return (
          <div className="absolute top-4 right-4 w-48 p-3 bg-white rounded shadow-sm bg-opacity-90 z-10">
            <h4 className="text-sm font-medium mb-2">原子元素色彩图例</h4>
            <div className="grid grid-cols-2 gap-1">
              <div className="w-full h-6 bg-gray-500 rounded text-white text-xs flex items-center justify-center">C - 灰色（碳）</div>
              <div className="w-full h-6 bg-red-600 rounded text-white text-xs flex items-center justify-center">O - 红色（氧）</div>
              <div className="w-full h-6 bg-blue-600 rounded text-white text-xs flex items-center justify-center">N - 蓝色（氮）</div>
              <div className="w-full h-6 bg-yellow-500 rounded text-black text-xs flex items-center justify-center">S - 黄色（硫）</div>
              <div className="w-full h-6 bg-white border border-gray-300 rounded text-gray-700 text-xs flex items-center justify-center">H - 白色（氢）</div>
              <div className="w-full h-6 bg-orange-500 rounded text-white text-xs flex items-center justify-center">P - 橙色（磷）</div>
              <div className="w-full h-6 bg-green-500 rounded text-white text-xs flex items-center justify-center">Cl - 绿色（氯）</div>
              <div className="w-full h-6 bg-purple-500 rounded text-white text-xs flex items-center justify-center">Fe - 紫色（铁）</div>
              <div className="w-full h-6 bg-pink-500 rounded text-white text-xs flex items-center justify-center">Mg - 粉色（镁）</div>
              <div className="w-full h-6 bg-blue-300 rounded text-black text-xs flex items-center justify-center">Ca - 淡蓝（钙）</div>
            </div>
            <div className="text-xs text-gray-600 mt-2 pt-1 border-t border-gray-200">
              化学键以球棒模型展示，键由不同颜色的原子相连形成
            </div>
          </div>
        );
      case 'bFactor':
        return (
          <div className="absolute top-4 right-4 w-64 p-3 bg-white rounded shadow-sm bg-opacity-90 z-10">
            <h4 className="text-sm font-medium mb-2">B因子配色图例</h4>
            <div className="flex items-center">
              <div className="w-full h-6 bg-gradient-to-r from-blue-600 via-white to-red-600 rounded"></div>
            </div>
            <div className="flex justify-between mt-1 text-xs text-gray-600">
              <span>低B因子 (稳定)</span>
              <span>中等</span>
              <span>高B因子 (灵活)</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              B因子反映原子的热振动程度，低值(蓝色)表示结构稳定，高值(红色)表示结构灵活
            </p>
          </div>
        );
      case 'conservation':
        return (
          <div className="absolute top-4 right-4 w-64 p-3 bg-white rounded shadow-sm bg-opacity-90 z-10">
            <h4 className="text-sm font-medium mb-2">序列保守性图例</h4>
            <div className="flex items-center">
              <div className="w-full h-6 bg-gradient-to-r from-blue-600 via-white to-red-600 rounded"></div>
            </div>
            <div className="flex justify-between mt-1 text-xs text-gray-600">
              <span>低度保守</span>
              <span>中度保守</span>
              <span>高度保守</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              序列保守性反映残基在进化中的保守程度，高度保守(红色)通常表示功能重要区域
            </p>
          </div>
        );
      case 'hydrophobic':
        return (
          <div className="absolute top-4 right-4 w-64 p-3 bg-white rounded shadow-sm bg-opacity-90 z-10">
            <h4 className="text-sm font-medium mb-2">疏水性配色图例</h4>
            <div className="flex items-center">
              <div className="w-full h-6 bg-gradient-to-r from-blue-600 via-white to-red-600 rounded"></div>
            </div>
            <div className="flex justify-between mt-1 text-xs text-gray-600">
              <span>亲水性</span>
              <span>中性</span>
              <span>疏水性</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              疏水性配色显示蛋白质表面的亲水/疏水属性，蓝色区域亲水，红色区域疏水
            </p>
          </div>
        );
      case 'electrostatic':
        return (
          <div className="absolute top-4 right-4 w-64 p-3 bg-white rounded shadow-sm bg-opacity-90 z-10">
            <h4 className="text-sm font-medium mb-2">静电势配色图例</h4>
            <div className="flex items-center">
              <div className="w-full h-6 bg-gradient-to-r from-red-600 via-white to-blue-600 rounded"></div>
            </div>
            <div className="flex justify-between mt-1 text-xs text-gray-600">
              <span>负电荷</span>
              <span>中性</span>
              <span>正电荷</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              静电势显示分子表面的电荷分布，红色表示负电荷区域，蓝色表示正电荷区域
            </p>
          </div>
        );
      case 'atomHighlight':
        return (
          <div className="absolute top-4 right-4 w-64 p-3 bg-white rounded shadow-sm bg-opacity-90 z-10">
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-sm font-medium">原子高亮模式</h4>
              { (
                <button
                  onClick={clearAllHighlights}
                  className="text-xs px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                >
                  清除所有高亮
                </button>
              )}
            </div>
            <div className="space-y-2 text-xs text-gray-600">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gray-300"></div>
                <span>未选择的原子</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-400"></div>
                <span>高亮选中的原子</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2 border-t pt-2">
              <span className="font-medium">操作说明：</span><br />
              • 点击任意原子将其高亮显示<br />
              • 再次点击高亮的原子可取消高亮<br />
              • 可同时高亮多个原子进行比较<br />
              • 点击"清除所有高亮"按钮可重置视图
            </p>
          </div>
        );
      default:
        return null;
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsLoading(true);
      

      const content = await file.text();
      setPdbContent(content);
      setSelectedFile(file);
      // 确保查看器已初始化
      if (!stageRef.current) {
        initViewer();
      }
      console.log('1');
      // 显示分子
      if (stageRef.current) {

        
        console.log(file);

        
        applyColorScheme(selectedScheme);
      }
    } catch (error) {
      console.error('Error loading PDB file:', error);
      alert('加载PDB文件时出错，请确保文件格式正确。');
    } finally {
      setIsLoading(false);
    }
  };
  const handleAtomClick = async (event: any) => {
    if(!event.atom || !stageRef.current || !selectedFile)return ;
    // recentComponent?.addRepresentation('spacefill',{sele:'.'+event.atom.atomType.atomname,color:'lightgreen'})



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
      // o.addRepresentation('spacefill',{sele:':A/0',color:'lightgreen'});
      // o.removeAllRepresentations()
      if(!isHighlighted){
        atomCom=await o;
        // atomList= await [...atomList,{"atomCom":atomCom,"serial":serial}];
        // const newHighlightedAtoms = [...highlightedAtoms, atom];
        // setHighlightedAtoms(newHighlightedAtoms);
        var newAtomList= [...atomListRef.current,{"atomCom":atomCom,"serial":serial}]
        
        await o.addRepresentation(
            'spacefill',
            {
              sele:event.atom.resno.toString()+':'+event.atom.chainname+'.'+event.atom.atomType.atomname+'/0',
              color:'lightgreen',
              radius:'0.25'
            });
        console.log('frag')
        // o.removeAllRepresentations();
        // setAtomList(newAtomList);
        atomListRef.current=newAtomList;
        // console.log(atomList[0].atomCom)
        // atomList[0].atomCom.removeAllRepresentations();
        // atomList.splice(0,1);
        console.log(atomListRef.current);
      }
      if(isHighlighted){
        atomListRef.current[listIndex].atomCom.removeAllRepresentations(); 
        var list=atomListRef.current;
        list.splice(listIndex,1);
        // setAtomList([...list]);
        atomListRef.current=list
      }
      // o.removeAllRepresentations();
    });
  };
  const applyColorScheme = async (scheme: string) => {
    // if (!recentComponent) return;
    recentComponent?.removeAllRepresentations();

    if (!pdbContent) return;
    await stageRef.current?.signals.clicked.removeAll();

    // 移除任何现有的点击事件处理
    // viewerRef.current.setClickable({}, false);
    // viewerRef.current.removeAllSurfaces();
    // viewerRef.current.removeAllLabels();
    const file:File =selectedFile!;


    // stageRef.current=new window.NGL.Stage(containerRef.current?.id)
    switch (scheme) {
      case 'elementColors':

        await stageRef.current.loadFile(selectedFile).then(function (o:Component) {
            // o.addRepresentation("ball+stick", {
            //   radius: 0.2,
            //   colorscheme: 'chainHetatm' 
            // })
            o.addRepresentation("spacefill", { sele: "polymer",colorscheme: 'byElement' ,radius: 0.2});
            o.autoView()
            setRecentComponent(o);
          })
        
        // 移除3D空间中的标签，将在renderColorLegend函数中使用CSS添加固定位置的图例
        break;
      case 'hydrophobic':

        await stageRef.current.loadFile(selectedFile).then(function (o:Component) {

          o.addRepresentation("surface", {
              sele: "polymer",
              colorScheme: "hydrophobicity",
              colorDomain: [ -0.3, 0.3 ],
              surfaceType: "av"
            });
          setRecentComponent(o);
          console.log(recentComponent);
          recentComponent!.autoView();
        });
        break;
      case 'electrostatic':
        await stageRef.current.loadFile(selectedFile).then(function (o:Component) {
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
      case 'bFactor':
        // // viewerRef.current.setStyle({}, {
        // //   // 移除卡通显示，只使用空样式
        // //   line: { hidden: true }
        // // });
        await stageRef.current.loadFile(selectedFile).then(function (o:Component) {
          o.addRepresentation("surface", {
            radiusType: "bfactor",
            radiusScale: 0.010,
            color: "bfactor",
            colorScale: "RdYlBu"
          })
          o.autoView()
          setRecentComponent(o);
        })

        break;
      case 'conservation':
        await stageRef.current.loadFile(selectedFile).then(function (o:Component) {
          o.addRepresentation("cartoon", {
            color:"conservation"
          })
          setRecentComponent(o);
          o.autoView()
        })
        
        break;
      case 'atomHighlight':
        await stageRef.current.loadFile(selectedFile).then(function (o:Component) {
            // o.addRepresentation("ball+stick", {
            //   radius: 0.2,
            //   colorscheme: 'chainHetatm' 
            // })
            o.addRepresentation("line", { sele: "polymer",colorschemes: 'elementId'  ,radius: 0.15,opacity:0.9});
            o.addRepresentation("cartoon", { sele: "polymer",color: 'lightgrey'  ,radius: 0.2,opacity:0.4});
            o.addRepresentation("spacefill", { sele: "polymer",colorschemes: 'elementId'  ,radius: 0.2});
            setRecentComponent(o);
            o.autoView()
            
          })
          if(!stageRef.current.signals.clicked.has(handleAtomClick))stageRef.current.signals.clicked.add(handleAtomClick);
    }
  };
  useEffect(() => {
    if (selectedFile && !stageRef.current) {
      initViewer();
    }
  }, [selectedFile]);

  const handleSchemeChange = async (scheme: string) => {
    await recentAtomComponent?.removeAllRepresentations()
    await stageRef.current?.signals.clicked.removeAll();
    clearAllHighlights();
    // setRecentAtomComponent(null)
    console.log('2');
    setSelectedScheme(scheme);
    console.log('2');
    applyColorScheme(scheme);
    console.log(scheme);
  };

  // 初始化 3Dmol 查看器
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
        if (selectedFile) {
          
            applyColorScheme(selectedScheme);
        }
    }catch(error){
        console.error('Error initializing viewer:', error);
    }




  };

  // // 添加 useEffect 来监听容器的创建
  // useEffect(() => {
  //   if (selectedFile && !stageRef.current) {
  //     initViewer();
  //   }
  // }, [selectedFile]);

  return (
    <>
      <Script
        src="https://code.jquery.com/jquery-3.6.0.min.js"
        strategy="beforeInteractive"
      />
      <Script
        src="https://cdn.jsdelivr.net/npm/ngl@2.0.1/dist/ngl.js"
        strategy="afterInteractive"
        onLoad={() => {
          console.log('3Dmol.js loaded successfully');
          if (window.NGL) {
            initViewer();
             console.log('3Dmol.js loaded successfully');
          }
        }}
        onError={(e) => {
          
        }}
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
                className={`flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-colors ${item.title === "分子配色"
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
                    className={item.title === "分子配色" ? 'brightness-0 invert' : ''}
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
              <h1 className="text-3xl font-bold text-[#1e485d] mb-4">分子配色</h1>
              <p className="text-gray-600 leading-relaxed">
                通过不同的配色方案来展示分子的不同特性和属性，帮助用户更好地理解分子的化学特性和物理性质。
                包括元素配色、疏水性配色、静电势配色、B因子配色和序列保守性等多种配色方案。
              </p>
            </div>

            {/* 主要内容区域 */}
            <div className="flex gap-6">
              {/* 左侧配色方案选项 */}
              <div className="w-64 space-y-2">
                {colorSchemes.map((scheme) => (
                  <button
                    key={scheme.id}
                    onClick={() => handleSchemeChange(scheme.id)}
                    className={`w-full px-4 py-3 rounded-lg text-left transition-colors ${selectedScheme === scheme.id
                      ? 'bg-[#25b5ab] text-white'
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                      }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span>{scheme.icon}</span>
                      <span>{scheme.name}</span>
                    </div>
                    <p className="text-xs opacity-80">{scheme.description}</p>
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

                  {/* 分子查看器区域 */}
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

                    {/* 配色图例 - 现在放在分子查看器内部的右上角 */}
                    {renderColorLegend()}
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