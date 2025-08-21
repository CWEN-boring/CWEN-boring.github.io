'use client'

import { useState, useRef, useEffect } from 'react';
import Script from 'next/script';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { icons } from '@/public/icons';
import { Component, RepresentationElement, Stage } from 'ngl';
import { setFlagsFromString } from 'v8';
import Representation from 'ngl/dist/declarations/representation/representation';

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
  interface Window {
    NGL: any;
    
  }
}
let globalContent:string;
export default function MoleculeSelectionPage() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const stageRef = useRef<Stage| null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [selectionType, setSelectionType] = useState<'residue' | 'chain' | 'region' | 'atom' | 'resn' | 'site'>('residue');
  const [selectionValue, setSelectionValue] = useState('');
  const [selectedStyle, setSelectedStyle] = useState<'cartoon' | 'stick' | 'sphere' | 'line'>('cartoon');
  const [selectedColor, setSelectedColor] = useState('#25b5ab');
  const [backgroundColor, setBackgroundColor] = useState('white');
  const [separationDistance, setSeparationDistance] = useState<number>(5);
  const [isolatedSelection, setIsolatedSelection] = useState<string | null>(null);
  const [hiddenSelections, setHiddenSelections] = useState<string[]>([]);
  const [opacitizedSelections, setOpacitizedSelections] = useState<string[]>([]);
  const [residues, setResidues] = useState<{ id: number, chain: string, resn: string }[]>([]);
  const [chains, setChains] = useState<string[]>([]);
  // 添加下拉菜单状态
  const [isResidueDropdownOpen, setIsResidueDropdownOpen] = useState(false);
  const [isChainDropdownOpen, setIsChainDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [recentComponent,setRecentComponent] = useState<Component | null>(null)
  const [recentSelectedComponent,setRecentSelectedComponent] = useState<Component | null>(null)
  const [recentSelectedComponentList,setRecentSelectedComponentList] = useState<Array<{SeleComp:Component,SeleCont:string}>>([]);
  const [recentSurfaceComponent,setRecentSurfaceComponent] = useState<Component | null>(null)
  // 获取链的颜色配置
  const getChainColorConfig = (chain: string) => {
    // 为不同链分配不同的背景颜色
    const chainColors: { [key: string]: string } = {
      'A': '#e3f2fd', // 浅蓝色
      'B': '#e8f5e9', // 浅绿色
      'C': '#fff3e0', // 浅橙色
      'D': '#f3e5f5', // 浅紫色
      'E': '#ffebee', // 浅红色
      'F': '#e0f7fa', // 浅青色
      'G': '#fffde7', // 浅黄色
      'H': '#f1f8e9', // 浅绿色
    };
    // 默认颜色
    const backgroundColor = chainColors[chain] || '#f5f5f5';

    // 对应的文本颜色
    const textColors: { [key: string]: string } = {
      'A': '#1565c0', // 深蓝色
      'B': '#2e7d32', // 深绿色
      'C': '#e65100', // 深橙色
      'D': '#6a1b9a', // 深紫色
      'E': '#b71c1c', // 深红色
      'F': '#00838f', // 深青色
      'G': '#f9a825', // 深黄色
      'H': '#558b2f', // 深绿色
    };
    // 文本颜色
    const textColor = textColors[chain] || '#757575';

    return { backgroundColor, textColor };
  };

  // 点击外部关闭下拉菜单
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsResidueDropdownOpen(false);
        setIsChainDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    let scriptLoaded = false;
    let attempts = 0;
    const maxAttempts = 50;

    const checkAndInitViewer = async () => {
      if (window.NGL && selectedFile && !scriptLoaded) {
        try {
          scriptLoaded = true;
          const content = await selectedFile.text();
          globalContent=content;
          if (!stageRef.current) {
            initViewer();
          } else {
            updateViewer(content);
          }
        } catch (error) {
          console.error('Error initializing viewer:', error);
        }
      }
    };

    const interval = setInterval(() => {
      attempts++;
      if (window.NGL || attempts >= maxAttempts) {
        clearInterval(interval);
        checkAndInitViewer();
      }
    }, 100);

    return () => {
      clearInterval(interval);
      if (stageRef.current) {
        stageRef.current.dispose();
      }
    };
  }, [selectedFile]);

  const initShow=async (file:File)=>{
     if (!recentComponent)await stageRef.current?.loadFile(file,{ name: "componentAll" }).then(function (o: void |Component) {
        // o.addRepresentation("ball+stick", {
        //   radius: 0.2,
        //   colorscheme: 'chainHetatm' 
        // })
      o!.addRepresentation("cartoon", {colors: 'spectrum' ,opacity:0.1});
      o!.autoView()
      setRecentComponent(()=>{return o!;});
    })
  }
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
      }else {
        initShow(file);
      }
    } catch (error) {
      console.error('Error loading PDB file:', error);
      alert('加载PDB文件时出错，请确保文件格式正确。');
    } finally {
      setIsLoading(false);
    }
  };

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
    }catch(error){
        console.error('Error initializing viewer:', error);
    }
  };
  const parseResidueInfo = (content: string) => {
    try {
      const lines = content.split('\n');
      const uniqueResidues = new Map<string, { id: number, chain: string, resn: string }>();
      const uniqueChains = new Set<string>();
      const resnTypes = new Set<string>();

      // 遍历PDB文件中的ATOM和HETATM记录
      lines.forEach(line => {
        // 只处理具有标准格式的ATOM和HETATM行
        if ((line.startsWith('ATOM') || line.startsWith('HETATM')) && line.length >= 27) {
          // 更精确的PDB格式读取
          const resId = parseInt(line.substring(22, 26).trim());
          const chain = line.substring(21, 22).trim();
          const resn = line.substring(17, 20).trim();

          // 跳过无效数据
          if (isNaN(resId) || !chain || !resn) return;

          const key = `${resId}-${chain}`;

          if (!uniqueResidues.has(key)) {
            uniqueResidues.set(key, { id: resId, chain, resn });
          }

          if (!uniqueChains.has(chain)) {
            uniqueChains.add(chain);
          }

          if (!resnTypes.has(resn)) {
            resnTypes.add(resn);
          }


        }
      });

      // 检查是否解析到任何残基信息
      if (uniqueResidues.size === 0) {
        console.warn('No residue information found in the PDB file');
      }

      // 将残基信息转换为数组并排序
      const residuesArray = Array.from(uniqueResidues.values()).sort((a, b) => {
        if (a.chain !== b.chain) {
          return a.chain.localeCompare(b.chain);
        }
        return a.id - b.id;
      });

      setResidues(residuesArray);
      setChains(Array.from(uniqueChains).sort());

      console.log(`Found ${residuesArray.length} residues in ${uniqueChains.size} chains`);
    } catch (error) {
      console.error('Error parsing residue information:', error);
    }
  };
  const parseCurrentCloseSite =(centerAtom: number) => {
    const content:string=globalContent;
    const lines =content.split('\n');
    let list:any=[];
    let distance :number=0, pos:any=[0,0,0,0],posTGT: any=[0,0,0,0];
    let flag:boolean=false;

    lines.forEach(line => {
        // 只处理具有标准格式的ATOM和HETATM行
        if ((line.startsWith('ATOM') || line.startsWith('HETATM')) && line.length >= 27) {
          // 更精确的PDB格式读取
          
          lines.forEach(lineForTGT => {
            if(flag)return;
            if ((lineForTGT.startsWith('ATOM') || lineForTGT.startsWith('HETATM')) && lineForTGT.length >= 27){
              if(parseInt(lineForTGT.substring(6,11).trim()) == centerAtom){
                
                posTGT[1]=parseFloat(lineForTGT.substring(30,38).trim());
                posTGT[2]=parseFloat(lineForTGT.substring(38,46).trim());
                posTGT[3]=parseFloat(lineForTGT.substring(46,54).trim());
                flag=true;
                return ;
              }
            }
          });
          }
          pos[1]=parseFloat(line.substring(30,38).trim());
          pos[2]=parseFloat(line.substring(38,46).trim());
          pos[3]=parseFloat(line.substring(46,54).trim());
          distance = Math.sqrt(
            Math.pow(posTGT[1] - pos[1], 2) +
            Math.pow(posTGT[2] - pos[2], 2) +
            Math.pow(posTGT[3] - pos[3], 2)
          );
          if (distance<=5){
            list=[...list,parseInt(line.substring(6,11).trim())];

          };

        
      });

      return list;
  }
  const updateViewer = (content: string) => {
    // viewer.clear();
    // const model = viewer.addModel(content, "pdb");
    // viewer.setStyle({}, { cartoon: { color: 'spectrum' } });
    // viewer.zoomTo();
    // viewer.render();
    stageRef.current?.autoView()
    parseResidueInfo(content);
  };
  const updateViewerBackground = (color: string) => {
    if (!stageRef.current||color===backgroundColor) return;
    setBackgroundColor(color);
    console.log(backgroundColor);
    stageRef.current.setParameters({backgroundColor:color});
    
  };
  const isSelected=(seleCont:string )=>{

    let pos:number=-1;
    let fPos:number=0;
    recentSelectedComponentList.forEach(selectedCompoent=>{
      if(selectedCompoent.SeleCont == seleCont)pos=fPos;
      fPos+=1;

    });
    return pos;
  }
  const handleSelection = () => {
    if (!stageRef.current || !selectionValue) return;
    let selector: any = {};
    let selectorContent: string = '';
    switch (selectionType) {
      case 'residue':
        const [resId, chainData] = selectionValue.split('|');
        selector.resi = parseInt(resId);
        if (chainData) {
          selector.chain = chainData;
        }
        selectorContent=resId+' and :'+chainData;
        break;
      case 'chain':
        selector.chain = selectionValue.toUpperCase();
        selectorContent = ':'+selectionValue.toUpperCase();
        break;
      case 'region':
        const [start, end] = selectionValue.split('-').map(Number);
        selector.resi = { start, end };
        break;
      case 'atom':
        selector.serial = parseInt(selectionValue);
        break;
      case 'resn':
        selector.resn = selectionValue;
        break;
      case 'site':
        selector.serial = parseCurrentCloseSite(parseInt(selectionValue)) ;
        break;

    }

    // 添加到选中列表，确保格式一致
    let selectionKey = "";

    if (selectionType === 'residue') {
      // 查找完整的残基信息以便更好地显示在选择列表中
      const [resId, chainData] = selectionValue.split('|');
      const residueInfo = residues.find(r => r.id === parseInt(resId) && r.chain === chainData);
      if (residueInfo) {
        // 使用 residueId|chain 格式
        selectionKey = `residue:${residueInfo.id}|${residueInfo.chain}`;
      } else {
        selectionKey = `residue:${resId}|${chainData || ''}`;
      }
    } else if (selectionType === 'chain') {
      selectionKey = `chain:${selectionValue}`;
    } else {
      selectionKey = `${selectionType}:${selectionValue}`;
    }

    if (!selectedRegions.includes(selectionKey)) {
      setSelectedRegions([...selectedRegions, selectionKey]);
    }

    // 应用选择的样式和颜色

    switch (selectedStyle) {
      case 'cartoon':

        console.log(recentComponent);
        setRecentSelectedComponentList((prev)=>{
          prev.forEach(selectedComponent=>{
            selectedComponent?.SeleComp.removeAllRepresentations();
            selectedComponent?.SeleComp.addRepresentation('cartoon',{sele:selectedComponent.SeleCont, color:selectedColor});
          })
          return prev ;
        })
        // recentComponent!.addRepresentation("cartoon", {colors: 'spectrum' ,opacity:0.5});
        if(isSelected(selectorContent) != -1){

        }else{
          stageRef.current.loadFile(selectedFile!).then(async function (o:Component|void){
            o!.addRepresentation('cartoon',{sele:selectorContent, color:selectedColor});
            console.log(selectorContent);
            console.log(o)
            await setRecentSelectedComponentList((prev)=>{
              return [...prev,{SeleComp:o!,SeleCont:selectorContent}];
            })
          })
        }
        console.log(recentSelectedComponentList);
        break;
      case 'stick':
        console.log(recentComponent);
        setRecentSelectedComponentList((prev)=>{
          prev.forEach(selectedComponent=>{
            selectedComponent?.SeleComp.removeAllRepresentations();
              selectedComponent?.SeleComp.addRepresentation('licorice',{radius:0.2,sele:selectedComponent.SeleCont, color:selectedColor});
          })
          return prev ;
        })
        // recentComponent!.addRepresentation("cartoon", {colors: 'spectrum' ,opacity:0.5});
        if(isSelected(selectorContent) != -1){

        }else{
          stageRef.current.loadFile(selectedFile!).then(async function (o:Component|void){
            o!.addRepresentation('licorice',{radius:0.2,sele:selectorContent, color:selectedColor});
            console.log(selectorContent);
            console.log(o)
            await setRecentSelectedComponentList((prev)=>{
              return [...prev,{SeleComp:o!,SeleCont:selectorContent}];
            })
          })
        }
        console.log(recentSelectedComponentList);




        break;
      case 'sphere':
        setRecentSelectedComponentList((prev)=>{
          prev.forEach(selectedComponent=>{
            selectedComponent?.SeleComp.removeAllRepresentations();
              selectedComponent?.SeleComp.addRepresentation('spacefill',{radius:0.8,sele:selectedComponent.SeleCont, color:selectedColor});
          })
          return prev ;
        })
        // recentComponent!.addRepresentation("cartoon", {colors: 'spectrum' ,opacity:0.5});
        if(isSelected(selectorContent) != -1){

        }else{
          stageRef.current.loadFile(selectedFile!).then(async function (o:Component|void){
            o!.addRepresentation('spacefill',{radius:1,sele:selectorContent, color:selectedColor});
            console.log(selectorContent);
            console.log(o)
            await setRecentSelectedComponentList((prev)=>{
              return [...prev,{SeleComp:o!,SeleCont:selectorContent}];
            })
          })
        }
        console.log(recentSelectedComponentList);
        
        break;
      case 'line':
        setRecentSelectedComponentList((prev)=>{
          prev.forEach(selectedComponent=>{
            selectedComponent?.SeleComp.removeAllRepresentations();
            // selectedComponent.SeleRepr=selectedComponent?.SeleComp.addRepresentation('line',{radius: 0.2,sele:selectorContent, color:selectedColor});
          })
          return prev ;
        })
        setRecentSelectedComponentList((prev)=>{
          prev.forEach( selectedComponent=>{
            // selectedComponent?.SeleComp.removeRepresentation(selectedComponent?.SeleRepr);
            selectedComponent?.SeleComp.addRepresentation('line',{radius: 0.2,sele:selectedComponent.SeleCont, color:selectedColor});
          })
          return prev ;
        })
        // recentComponent!.addRepresentation("cartoon", {colors: 'spectrum' ,opacity:0.5});
        if(isSelected(selectorContent) != -1){
          console.log('selected')
        }else{
          stageRef.current.loadFile(selectedFile!).then(function (o:Component|void){
            o!.addRepresentation('line',{radius: 0.2,sele:selectorContent, color:selectedColor});
            console.log(selectorContent);
            console.log(o)
            setRecentSelectedComponentList((prev)=>{
              const newList= [...prev,{SeleComp:o!,SeleCont:selectorContent}];
              return newList;
            })
          })
        }
        console.log(recentSelectedComponentList);
        break;
    }
    
  };
  const handleToggleVisibility = (selection: string) => {
    if (!stageRef.current) return;

    const [type, valueWithChain] = selection.split(':');
    let selector: any = {};
    let selectorContent:string = '';
    switch (type) {
      case 'residue':
        const [resId, chainData] = valueWithChain.split('|');
        selector.resi = parseInt(resId);
        if (chainData) {
          selector.chain = chainData;
        }
        selectorContent=resId+' and :'+chainData;
        break;
      case 'chain':
        selector.chain = valueWithChain.toUpperCase();
        selectorContent = ':'+valueWithChain.toUpperCase();
        break;
      case 'region':
        const [start, end] = valueWithChain.split('-').map(Number);
        selector.resi = { start, end };
        break;
      case 'atom':
        selector.serial = parseInt(valueWithChain);
        break;
      case 'resn':
        selector.resn = valueWithChain;
        break;
      case 'site':
        selector.serial = parseCurrentCloseSite(parseInt(valueWithChain));
    }

    // 检查是否已经隐藏
    const isHidden = hiddenSelections.includes(selection);

    if (isHidden) {
      // 如果已经隐藏，则显示（移除出隐藏列表）
      setHiddenSelections(hiddenSelections.filter(s => s !== selection));

      // 显示选中区域
      setRecentSelectedComponentList((prev)=>{
        prev.forEach(selectedComponent=>{
          if(selectedComponent.SeleCont == selectorContent)selectedComponent.SeleComp.setVisibility(true);
        })
        return prev;
      })
    } else {
      // 如果未隐藏，则隐藏（添加到隐藏列表）
      setHiddenSelections([...hiddenSelections, selection]);

      // 隐藏选中区域
      setRecentSelectedComponentList((prev)=>{
        prev.forEach(selectedComponent=>{
          if(selectedComponent.SeleCont == selectorContent)selectedComponent.SeleComp.setVisibility(false);
        })
        return prev;
      })
    }
  };
  const handleIsolateSelection = (selection: string) => {
    if (!stageRef.current) return;


    // 如果当前点击的选择已经处于分离状态，则取消分离
    if (isolatedSelection === selection) {
      // 重置分离状态
      setIsolatedSelection(null);
      // 重置视图
      setRecentSelectedComponentList((prev)=>{
        prev.forEach(selectedComponent=>{
          selectedComponent.SeleComp.setVisibility(true);
        })
        return prev;
      })
      setRecentComponent((prev)=>{
        prev?.setVisibility(true)
        return prev;
      })
      return;
    }

    // 设置为分离状态
    setIsolatedSelection(selection);

    // 首先隐藏所有部分
    
    
    // 然后只显示选中的部分
    const [type, valueWithChain] = selection.split(':');
    let selector: any = {};
    let selectorContent: string = '';

    switch (type) {
      case 'residue':
        const [resId, chainData] = valueWithChain.split('|');
        selector.resi = parseInt(resId);
        if (chainData) {
          selector.chain = chainData;
        }
        selectorContent = resId + ' and :' + chainData;
        break;
      case 'chain':
        selector.chain = valueWithChain.toUpperCase();
        selectorContent = ':'+selector.chain;
        break;
      case 'region':
        const [start, end] = valueWithChain.split('-').map(Number);
        selector.resi = { start, end };
        break;
      case 'atom':
        selector.serial = parseInt(valueWithChain);
        break;
      case 'resn':
        selector.resn = valueWithChain;
        break;
      case 'site':
        selector.serial = parseCurrentCloseSite(parseInt(valueWithChain));
        break;
    }

    setRecentSelectedComponentList((prev)=>{
      prev.forEach(selectedComponent=>{
        if(selectedComponent.SeleCont == selectorContent)selectedComponent.SeleComp.setVisibility(true)
          else selectedComponent.SeleComp.setVisibility(false)
        console.log(selectedComponent.SeleCont);
      })
      return prev;
    })
    setRecentComponent((prev)=>{
        prev?.setVisibility(false)
        return prev;
    })
    recentComponent?.setVisibility(false);
    console.log(recentComponent?.visible)
  };
  const handleOpacitizeSelection = (selection: string) => {
    if (!stageRef.current) return;

    const [type, valueWithChain] = selection.split(':');
    let selector: any = {};
    let selectorContent: string = '';

    switch (type) {
      case 'residue':
        const [resId, chainData] = valueWithChain.split('|');
        selector.resi = parseInt(resId);
        if (chainData) {
          selector.chain = chainData;
        }
        selectorContent = resId + ' and :' + chainData;
        break;
      case 'chain':
        selector.chain = valueWithChain.toUpperCase();
        selectorContent = ':'+selector.chain;
        break;
      case 'region':
        const [start, end] = valueWithChain.split('-').map(Number);
        selector.resi = { start, end };
        break;
      case 'atom':
        selector.serial = parseInt(valueWithChain);
        break;
      case 'resn':
        selector.resn = valueWithChain;
        break;
      case 'site':
        selector.serial = parseCurrentCloseSite(parseInt(valueWithChain));
        break;
    }

    // 检查是否已经隐藏
    const isOpacitized = opacitizedSelections.includes(selection);



    if (isOpacitized) {
      // 如果已经隐藏，则显示（移除出隐藏列表）
      setOpacitizedSelections(opacitizedSelections.filter(s => s !== selection));
      recentSurfaceComponent?.setVisibility(false);
      // 显示选中区域

      // 重置视图
      setRecentSelectedComponentList((prev)=>{
        prev.forEach(selectedComponent=>{
          selectedComponent.SeleComp.setVisibility(true);
        })
        return prev;
      })
      setRecentComponent((prev)=>{
        prev?.setVisibility(true)
        return prev;
      })
      
    } else {
      // 如果未隐藏，则隐藏（添加到隐藏列表）
      if(recentSurfaceComponent)recentSurfaceComponent.setVisibility(true)
        else {
            stageRef.current?.loadFile(selectedFile!).then(async function (o){
              await o!.addRepresentation('surface',{type:'MS',opacity:0.2 , color: 'white'})
              setRecentSurfaceComponent(()=>{
                return o!;
              })
            })
      
        }

      console.log(recentSurfaceComponent);
      setOpacitizedSelections([...opacitizedSelections, selection]);
      setRecentSelectedComponentList((prev)=>{
        prev.forEach(selectedComponent=>{
          if(selectedComponent.SeleCont == selectorContent)selectedComponent.SeleComp.setVisibility(true)
            else selectedComponent.SeleComp.setVisibility(false)
          console.log(selectedComponent.SeleCont);
        })
        return prev;
      })
      setRecentComponent((prev)=>{
          prev?.setVisibility(false)
          return prev;
      })
      recentComponent?.setVisibility(false);

    }

  };
  const handleRemoveSelection = (selection: string) => {
    setSelectedRegions(selectedRegions.filter(s => s !== selection));
    if (!stageRef.current) return;
    const [type, valueWithChain] = selection.split(':');
    let selectorContent:string='';

    switch (type) {
      case 'residue':
        const [resId, chainData] = valueWithChain.split('|');
        selectorContent=resId+' and :'+chainData;
        break;
      case 'chain':
        selectorContent =':'+ valueWithChain.toUpperCase();
        break;
      // case 'region':
      //   const [start, end] = valueWithChain.split('-').map(Number);
      //   selector.resi = { start, end };
      //   break;
      // case 'atom':
      //   selector.serial = parseInt(valueWithChain);
      //   break;
      // case 'resn':
      //   selector.resn = valueWithChain;
      //   break;
      // case 'site':
      //   selector.serial = parseCurrentCloseSite(parseInt(valueWithChain));
      //   break;
    }

    // 恢复默认样式
    // viewer.setStyle(selector, { cartoon: { color: 'spectrum' } });
    // viewer.render();
    const posInList:number=isSelected(selectorContent);
    recentSelectedComponentList[posInList].SeleComp.removeAllRepresentations();
    recentSelectedComponentList.splice(posInList,1);
  };


  // 修改重置视图的函数
  const handleResetView = () => {
    handleClearAllSelections();
  };

  // 清除所有选择并恢复原始视图
  const handleClearAllSelections = () => {
    if (!stageRef.current || !selectedFile) return;

    // 清空选择列表
    setSelectedRegions([]);

    // 重置分离和隐藏状态
    setIsolatedSelection(null);
    setHiddenSelections([]);
    setOpacitizedSelections([])

    // 重新加载分子并恢复默认显示
    // pdbFile.text().then(content => {
    //   updateViewer(content, viewerRef.current);
    // });
    recentComponent?.setVisibility(true);
    setRecentSelectedComponentList((prev)=>{

      prev.forEach(selectedComponent=>{
        selectedComponent.SeleComp.removeAllRepresentations();
      })
      return [];
    })


  };

  // 渲染链标签
  const renderChainTag = (chain: string) => {
    const { backgroundColor, textColor } = getChainColorConfig(chain);
    return (
      <span
        className="ml-1.5 px-1.5 py-0.5 rounded text-xs font-medium"
        style={{
          backgroundColor,
          color: textColor
        }}
      >
        链 {chain}
      </span>
    );
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
              className={`flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-colors ${item.title === "分子选择与分离"
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
                  className={item.title === "分子选择与分离" ? 'brightness-0 invert' : ''}
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
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-[#1e485d] mb-2">分子选择与分离</h1>
            <p className="text-gray-600 leading-relaxed">
              通过选择特定的残基、蛋白质链或区域来进行分子的选择、分离和显示操作，帮助用户更好地分析分子结构的不同部分。
            </p>
          </div>

          {/* 分子查看器和控制面板的主容器 - 使用Flex布局将控制面板放在右侧 */}
          <div className="flex gap-6">
            {/* 左侧内容区 */}
            <div className="flex-grow">
              {/* 未上传文件时的占位区域 */}
              {!selectedFile && (
                <div className="h-[800px] flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <div className="text-center">
                    <div className="text-gray-400 mb-4">
                      <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <p className="text-gray-600 mb-3">上传PDB文件以开始分析</p>
                    <input
                      type="file"
                      accept=".pdb"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="pdb-upload"
                    />
                    <label
                      htmlFor="pdb-upload"
                      className="bg-[#25b5ab] text-white px-4 py-2 rounded cursor-pointer hover:bg-[#1e9c93] text-sm"
                    >
                      上传PDB文件
                    </label>
                  </div>
                </div>
              )}

              {/* 已上传文件后，显示分子查看器 */}
              {selectedFile && (
                <div>
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

            {/* 右侧控制面板 */}
            <div className="w-80 flex flex-col">
              {/* 已上传文件信息显示 - 仅在上传文件后显示 */}
              {selectedFile && (
                <div className="mb-4 flex items-center justify-between bg-gray-50 rounded-lg border p-3">
                  <div className="flex items-center">
                    <span className="text-gray-600 mr-2 text-sm">当前文件:</span>
                    <span className="font-medium text-sm truncate max-w-[120px]">{selectedFile.name}</span>
                  </div>
                  <input
                    type="file"
                    accept=".pdb"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="pdb-reupload"
                  />
                  <label
                    htmlFor="pdb-reupload"
                    className="bg-[#25b5ab] text-white px-3 py-1 rounded cursor-pointer hover:bg-[#1e9c93] text-xs whitespace-nowrap"
                  >
                    重新上传
                  </label>
                </div>
              )}

              {/* 操作提示 */}
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 mb-4">
                <h3 className="font-semibold text-blue-800 text-sm mb-2">操作指引</h3>
                <ul className="text-blue-700 text-xs space-y-1 list-disc list-inside">
                  <li>选择分子结构元素</li>
                  <li>调整显示样式和颜色</li>
                  <li>使用分离功能查看结构关系</li>
                </ul>
              </div>

              {/* 右侧控制面板区域 */}
              <div className="flex-grow flex flex-col gap-4 overflow-y-auto">
                {!selectedFile && (
                  <div className="bg-gray-100 p-4 rounded-lg text-center">
                    <p className="text-gray-500 text-sm">请先上传PDB文件</p>
                  </div>
                )}

                {/* 选择原子区域 - 仅在上传文件后显示 */}
                {selectedFile && (
                  <>
                    {/* 样式设置面板 - 调整位置到顶部 */}
                    <div className="bg-white p-4 rounded-lg border">
                      <h3 className="font-semibold mb-3 text-gray-700">显示设置</h3>
                      <div className="flex flex-col gap-3">
                        {/* 样式选择 */}
                        <div className="flex flex-col">
                          <label className="text-xs font-medium text-gray-700 mb-1">显示样式</label>
                          <select
                            value={selectedStyle}
                            onChange={(e) => setSelectedStyle(e.target.value as any)}
                            className="border rounded px-3 py-1.5 text-sm"
                          >
                            <option value="cartoon">卡通模式</option>
                            <option value="stick">棍状模式</option>
                            <option value="sphere">球状模式</option>
                            <option value="line">线框模式</option>
                          </select>
                        </div>

                        {/* 颜色选择 */}
                        <div className="flex flex-col">
                          <label className="text-xs font-medium text-gray-700 mb-1">高亮颜色</label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={selectedColor}
                              onChange={(e) => setSelectedColor(e.target.value)}
                              className="w-8 h-8 border rounded cursor-pointer"
                            />
                            <span className="text-xs flex-grow">{selectedColor}</span>
                          </div>
                        </div>

                        {/* 背景色选择 */}
                        <div className="pt-2 border-t">
                          <label className="text-xs font-medium text-gray-700 mb-1">查看器背景</label>
                          <div className="flex items-center gap-2 mt-1">
                            <button onClick={() => updateViewerBackground('white')} className="w-6 h-6 bg-white border rounded" />
                            <button onClick={() => updateViewerBackground('#f0f0f0')} className="w-6 h-6 bg-[#f0f0f0] border rounded" />
                            <button onClick={() => updateViewerBackground('#333333')} className="w-6 h-6 bg-[#333333] border rounded" />
                            <button onClick={() => updateViewerBackground('black')} className="w-6 h-6 bg-black border rounded" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 选择结构面板 - 调整到第二位置 */}
                    <div className="bg-white p-4 rounded-lg border">
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="font-semibold text-gray-700">选择结构</h3>
                        <button
                          className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded"
                          onClick={handleClearAllSelections}
                        >
                          清除选择
                        </button>
                      </div>

                      <div className="flex flex-col gap-3">
                        <div className="flex gap-2 items-center">
                          <select
                            value={selectionType}
                            onChange={(e) => setSelectionType(e.target.value as any)}
                            className="border rounded px-3 py-1.5 text-sm w-full"
                          >
                            <option value="residue">残基号</option>
                            <option value="chain">蛋白质链</option>
                            <option value="region">区域范围</option>
                            <option value="atom">原子编号</option>
                            <option value="resn">残基类型</option>
                            <option value="site">结合靶点</option>
                          </select>
                        </div>

                        <div>
                          {selectionType === 'residue' ? (
                            <div className="relative" ref={dropdownRef}>
                              {/* 自定义下拉按钮 */}
                              <div
                                className="border rounded px-3 py-2 text-sm w-full bg-white cursor-pointer flex justify-between items-center"
                                onClick={() => setIsResidueDropdownOpen(!isResidueDropdownOpen)}
                              >
                                <div className="flex-1 truncate">
                                  {selectionValue ? (
                                    (() => {
                                      const [resId, chain] = selectionValue.split('|');
                                      const residueInfo = residues.find(r => r.id === parseInt(resId) && r.chain === chain);
                                      if (residueInfo) {
                                        return (
                                          <div className="flex items-center">
                                            <span>{residueInfo.id} - {residueInfo.resn}</span>
                                            {renderChainTag(residueInfo.chain)}
                                          </div>
                                        );
                                      }
                                      return '选择残基号';
                                    })()
                                  ) : (
                                    '选择残基号'
                                  )}
                                </div>
                                <svg className="fill-current h-4 w-4 ml-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                                </svg>
                              </div>

                              {/* 下拉内容 */}
                              {isResidueDropdownOpen && (
                                <div className="absolute z-10 mt-1 w-full rounded-md bg-white shadow-lg border">
                                  {/* 搜索框 */}
                                  <div className="p-2 border-b">
                                    <input
                                      type="text"
                                      className="w-full px-2 py-1 text-sm border rounded"
                                      placeholder="搜索残基..."
                                      value={searchTerm}
                                      onChange={(e) => setSearchTerm(e.target.value)}
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                  </div>

                                  {/* 选项列表 */}
                                  <div className="max-h-60 overflow-auto">
                                    {residues
                                      .filter(residue =>
                                        searchTerm === '' ||
                                        `${residue.id} ${residue.resn} ${residue.chain}`.toLowerCase().includes(searchTerm.toLowerCase())
                                      )
                                      .map((residue) => {
                                        const isSelected = selectionValue === `${residue.id}|${residue.chain}`;
                                        return (
                                          <div
                                            key={`${residue.id}-${residue.chain}`}
                                            className={`px-3 py-2 cursor-pointer flex items-center ${isSelected ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
                                            onClick={() => {
                                              setSelectionValue(`${residue.id}|${residue.chain}`);
                                              console.log(`${residue.id}|${residue.chain}`)
                                              setIsResidueDropdownOpen(false);
                                              setSearchTerm('');
                                            }}
                                          >
                                            <span className="mr-1">{residue.id} - {residue.resn}</span>
                                            {renderChainTag(residue.chain)}
                                          </div>
                                        );
                                      })}
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : selectionType === 'chain' ? (
                            <div className="relative" ref={dropdownRef}>
                              {/* 自定义链下拉按钮 */}
                              <div
                                className="border rounded px-3 py-2 text-sm w-full bg-white cursor-pointer flex justify-between items-center"
                                onClick={() => setIsChainDropdownOpen(!isChainDropdownOpen)}
                              >
                                <div className="flex-1 truncate">
                                  {selectionValue ? (
                                    <div className="flex items-center">
                                      <span>链 {selectionValue}</span>
                                      {renderChainTag(selectionValue)}
                                    </div>
                                  ) : (
                                    '选择蛋白质链'
                                  )}
                                </div>
                                <svg className="fill-current h-4 w-4 ml-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                                </svg>
                              </div>

                              {/* 链下拉内容 */}
                              {isChainDropdownOpen && (
                                <div className="absolute z-10 mt-1 w-full rounded-md bg-white shadow-lg border">
                                  <div className="max-h-60 overflow-auto">
                                    {chains.map((chain) => {
                                      const isSelected = selectionValue === chain;
                                      return (
                                        <div
                                          key={chain}
                                          className={`px-3 py-2 cursor-pointer flex items-center ${isSelected ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
                                          onClick={() => {
                                            setSelectionValue(chain);
                                            setIsChainDropdownOpen(false);
                                          }}
                                        >
                                          <span className="mr-1">链</span>
                                          {renderChainTag(chain)}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : selectionType !== 'site' ? (
                            <input
                              type="text"
                              value={selectionValue}
                              onChange={(e) => setSelectionValue(e.target.value)}
                              placeholder={
                                selectionType === 'region' ? '输入区域范围 (例: 1-10)' :
                                  selectionType === 'atom' ? '输入原子编号' :
                                    selectionType === 'resn' ? '输入残基类型 (例: ALA)' :
                                      'meaningLessHolder'
                              }
                              className="border rounded px-3 py-1.5 text-sm w-full"
                            />
                          ) : (
                            <input
                              type="text"
                              value={selectionValue}
                              onChange={(e) => setSelectionValue(e.target.value)}
                              placeholder={
                                '输入结合靶点6666'
                              }
                              className="border rounded px-3 py-1.5 text-sm w-full"
                            />
                          )}
                        </div>

                        <button
                          onClick={handleSelection}
                          className="bg-[#25b5ab] text-white py-1.5 rounded hover:bg-[#1e9c93] text-sm w-full"
                        >
                          选择
                        </button>
                      </div>

                      {/* 整合已选择结构到选择结构面板中 */}
                      <div className="mt-3 border-t pt-3">
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="text-xs font-medium text-gray-700">已选择结构</h4>
                          <span className="text-xs text-gray-500">{selectedRegions.length}个</span>
                        </div>
                        <div className="h-[150px] overflow-y-auto bg-gray-50 rounded border p-2">
                          {selectedRegions.length === 0 ? (
                            <div className="text-xs text-gray-400 text-center py-2">未选择任何结构</div>
                          ) : (
                            <div className="space-y-1">
                              {selectedRegions.map((selection) => {
                                const [type, valueWithChain] = selection.split(':');
                                let displayText = '';
                                let chainTag = '';

                                if (type === 'residue') {
                                  // 修复处理残基格式
                                  const [resId, chain] = valueWithChain ? valueWithChain.split('|') : [valueWithChain, ''];
                                  const residueId = parseInt(resId);

                                  // 查找残基信息
                                  const residueInfo = residues.find(r => r.id === residueId && (!chain || r.chain === chain));

                                  if (residueInfo) {
                                    displayText = `${residueId} - ${residueInfo.resn}`;
                                    chainTag = chain || residueInfo.chain;
                                  } else {
                                    displayText = `${resId}`;
                                    chainTag = chain || '';
                                  }
                                } else if (type === 'chain') {
                                  displayText = '链';
                                  chainTag = valueWithChain;
                                } else if (type === 'region') {
                                  displayText = `区域: ${valueWithChain}`;
                                } else if (type === 'atom') {
                                  displayText = `原子: ${valueWithChain}`;
                                } else if (type === 'resn') {
                                  displayText = `残基类型: ${valueWithChain}`;
                                } else if (type === 'site'){
                                  displayText = `结合位点中心：${valueWithChain} 原子`;
                                } else {
                                  displayText = selection;
                                }

                                return (
                                  <div key={selection} className="flex items-center justify-between text-xs p-1.5 bg-white rounded border hover:bg-gray-50">
                                    <span className="flex items-center">
                                      <div
                                        className="w-2 h-2 rounded-full mr-1.5"
                                        style={{ backgroundColor: selectedColor }}
                                      />
                                      {chainTag ? (
                                        <>
                                          <span>{displayText}</span>
                                          {renderChainTag(chainTag)}
                                        </>
                                      ) : (
                                        displayText
                                      )}
                                    </span>
                                    <div className="space-x-1">
                                      <button
                                        onClick={() => handleToggleVisibility(selection)}
                                        className={`${hiddenSelections.includes(selection)
                                          ? 'bg-red-100 text-red-700 px-1.5 py-0.5 rounded'
                                          : 'text-red-500 hover:text-red-600'
                                          } text-xs`}
                                      >
                                        {hiddenSelections.includes(selection) ? '显示' : '隐藏'}
                                      </button>
                                      <button
                                        onClick={() => handleIsolateSelection(selection)}
                                        className={`${isolatedSelection === selection
                                          ? 'bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded'
                                          : 'text-blue-500 hover:text-blue-600'
                                          } text-xs`}
                                      >
                                        {isolatedSelection === selection ? '取消分离' : '分离'}
                                      </button>

                                      <button
                                        onClick={() => handleOpacitizeSelection(selection)}
                                        className={`${opacitizedSelections.includes(selection)
                                          ? 'bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded'
                                          : 'text-blue-500 hover:text-blue-600'
                                          } text-xs`}
                                      >
                                        {opacitizedSelections.includes(selection) ? '取消凸显' : '凸显'}
                                      </button>

                                      <button
                                        onClick={() => handleRemoveSelection(selection)}
                                        className="text-gray-500 hover:text-gray-600 text-xs ml-1"
                                      >
                                        ×
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                        {selectedRegions.length > 0 && (
                          <button
                            onClick={handleResetView}
                            className="mt-2 text-xs text-blue-600 hover:text-blue-800 w-full text-center py-1 bg-blue-50 rounded"
                          >
                            重置视图
                          </button>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Script
        src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.6.0/jquery.min.js"
        strategy="afterInteractive"
        onLoad={() => {
          console.log('3Dmol.js loaded successfully');
          initViewer()
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
