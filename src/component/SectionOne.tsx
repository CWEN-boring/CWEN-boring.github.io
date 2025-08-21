"use client";

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import Script from 'next/script';
import { dataFiles } from '../../public/data';



export default function NGLBlock() {
  const stageRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const StageForming = () => {
    if (!containerRef.current) {
      console.error('Container ref is not available');
      return;
    }

    if (!window.NGL) {
      console.error('3Dmol library not loaded');
      return;
    }
    console.log('Initializing 3Dmol viewer');
    try {
        console.log('Initializing 3Dmol viewer');
    //   stageRef.current = window.$3Dmol.createViewer(
    //     containerRef.current,
    //     {
    //       backgroundColor: '#F5F5F5',  // 浅灰色背景
    //       antialias: true,
    //       id: 'molecule-viewer',
    //       width: '100%',
    //       height: '100%'
    //     }
    //   );
        console.log(11);
        stageRef.current =new window.NGL.Stage(containerRef.current.id);
        console.log(111);
        stageRef.current.loadFile("https://files.rcsb.org/download/9k25.pdb" ,{defaultRepresentation: true})
        
        if (!stageRef.current) {
        console.error('Failed to create 3Dmol viewer');
        return;
      }
        console.log(11111);
    }catch (error) {
      console.error('Error initializing viewer:', error);
    }
  };
  return (
    <div className="flex-1">
        <div className="flex-1" >
          <Script
            src="https://cdn.jsdelivr.net/npm/ngl@2.0.1/dist/ngl.js"
            strategy="afterInteractive"
            onLoad={() => {
              

              StageForming()
              console.log('stage loaded successfully');
            }}
            />
          <div id="molecule-viewer"  className='flex-1 min-w-[1024px] min-h-[1024px]' ref={containerRef}/>
        </div>      
     </div>
  );
}
