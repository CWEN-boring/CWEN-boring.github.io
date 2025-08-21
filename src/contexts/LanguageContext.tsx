"use client";

import { createContext, useContext, useState, ReactNode } from 'react';

type Language = 'zh' | 'en';

// 定义所有需要翻译的文本
export const translations = {
  zh: {
    title: "分子演示平台",
    subtitle: "分子属性预测和从头生成演示平台",
    description1: "专注于分子属性预测与从头生成的智能平台，借助3D分子结构展示技术，实现蛋白质分子的3D可视化，允许用户对蛋白质分子进行一系列操作，实现用户对蛋白质多方面的观察和分析，并实现从分子属性预测到高效从头生成的全流程演示，为科研人员、药物研发者等提供直观、实用的工具，加速分子创新与应用进程",
    description2: [
      '分子结构：展示分子的基本三维视图。',
      '分子视图：查看分子的不同方面，如分子视图、表面疏水视图等。',
      '分子配色：改变分子的配色方案，以突出显示分子的不同部分或属性。',
      '分子位置：对分子进行原子距离测量和原子位置微调。',
      '分子选择与分离：对特定的残基、蛋白质链等进行显示或隐藏，实现分子分离。',
      '多配体对比视图：分析和比较不同配体与蛋白质靶点的相互作用。'
    ],
    nav: {
      home: '首页',
      resources: '资源',
      community: '社区论坛'
    },
    services: {
      proteinStructure: "分子结构",
      virtualScreening: "分子视图",
      moleculeGeneration: "分子配色",
      admetPrediction: "分子位置",
      synthesisPlan: "分子选择与分离",
      antibody: "多配体对比视图",
      molecularStructureDescription: "用户可以通过这个功能查看分子的详细结构，包括原子、键和分子骨架。这个功能允许用户对分子进行旋转、移动和缩放，以便从不同角度观察分子的三维结构。",
      molecularViewDescription: "这个功能提供了多种视图选项，用户可以选择查看分子的不同方面，如分子视图、表面疏水视图等。用户可以改变视图以更好地理解分子的特定属性或特征。",
      molecularColoringDescription: "用户可以改变分子的配色方案，以突出显示分子的不同部分或属性。这有助于用户识别和区分分子中的特定残基或功能团。",
      molecularPositionDescription: "这个功能允许用户调整分子中原子的位置，进行微调以观察结构变化对分子属性的影响。用户可以测量原子之间的距离，以了解分子内部的相互作用。",
      molecularSelectionDescription: "用户可以选择特定的残基、蛋白质链或区域进行显示或隐藏，实现分子的分离。这个功能允许用户专注于分子的特定部分，同时隐藏其他部分以减少视觉干扰。",
      multiLigandViewDescription: "用户可以在同一视图中比较多个配体，这有助于用户分析和比较不同配体与蛋白质靶点的相互作用。这个功能对于药物设计和筛选过程中的比较分析至关重要。"
    },
    footer: {
      contact: "联系我们",
      phone: "电话",
      email: "邮箱",
      followUs: "关注我们",
      comingSoon: "更多信息敬请期待...",
      copyright: "版权所有 © 2024 HIT。保留所有权利。"
    }
  },
  en: {
    title: "Molecular Property Prediction and De Novo Generation Platform",
    subtitle: "Molecular Property Prediction and De Novo Generation Platform",
    description1: "An AI-driven platform for molecular property prediction and de novo generation, leveraging advanced deep learning algorithms, extensive database resources, and powerful cloud computing capabilities to help users efficiently and accurately explore molecular properties and reduce the cost and time of de novo molecular generation.",
    description2: [
      'Molecular Structure: Display basic 3D view of molecules.',
      'Molecular View: Examine different aspects of molecules, such as molecular view and surface hydrophobicity view.',
      'Molecular Coloring: Change coloring schemes to highlight different parts or properties of molecules.',
      'Molecular Position: Measure atomic distances and fine-tune atomic positions.',
      'Molecular Selection & Isolation: Select specific residues, protein chains, or regions for display or hiding.',
      'Multi-Ligand Comparison View: Analyze and compare interactions between different ligands and protein targets.'
    ],
    nav: {
      home: 'Home',
      resources: 'Resources',
      community: 'Community'
    },
    services: {
      proteinStructure: "Molecular Structure",
      virtualScreening: "Molecular View",
      moleculeGeneration: "Molecular Coloring",
      admetPrediction: "Molecular Position",
      synthesisPlan: "Molecular Selection & Isolation",
      antibody: "Multi-Ligand Comparison View",
      molecularStructureDescription: "Users can view detailed molecular structures, including atoms, bonds, and molecular scaffolds. This feature allows users to rotate, move, and zoom the molecule to observe its three-dimensional structure from different angles.",
      molecularViewDescription: "This feature provides multiple view options, allowing users to examine different aspects of molecules, such as molecular view and surface hydrophobicity view. Users can change views to better understand specific molecular properties or characteristics.",
      molecularColoringDescription: "Users can modify molecular coloring schemes to highlight different parts or properties of molecules. This helps users identify and distinguish specific residues or functional groups within the molecule.",
      molecularPositionDescription: "This feature allows users to adjust atomic positions within molecules, making fine adjustments to observe how structural changes affect molecular properties. Users can measure distances between atoms to understand intramolecular interactions.",
      molecularSelectionDescription: "Users can select specific residues, protein chains, or regions for display or hiding, achieving molecular isolation. This feature allows users to focus on specific parts of molecules while hiding others to reduce visual interference.",
      multiLigandViewDescription: "Users can compare multiple ligands in the same view, helping analyze and compare interactions between different ligands and protein targets. This feature is crucial for comparative analysis in drug design and screening processes."
    },
    footer: {
      contact: "Contact Us",
      phone: "Phone",
      email: "Email",
      followUs: "Follow Us",
      comingSoon: "More information coming soon...",
      copyright: "Copyright © 2024 HIT. All Rights Reserved."
    }
  }
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: typeof translations.zh | typeof translations.en;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('zh');

  const value = {
    language,
    setLanguage,
    t: translations[language]
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
} 