"use client";

import Image from "next/image";
import { useState } from "react";
import { icons } from "@/public/icons";
import { useRouter } from 'next/navigation';

// 定义功能描述和图片映射
const featureDetails = {
  1: {
    title: "分子结构",
    image: "/images/features/molecule-illustration.png",
    description: "用户可以通过这个功能查看分子的详细结构，包括原子、键和分子骨架。这个功能允许用户旋转、移动和缩放分子以便从不同角度观察分子的三维结构。"
  },
  2: {
    title: "分子视图",
    image: "/images/features/molecule-view.png",
    description: "这个功能提供了多种视图选项，用户可以选择查看分子的不同方面，如分子视图、表面疏水视图等。用户可以改变视图以更好地理解分子的特定属性或特征。"
  },
  3: {
    title: "分子配色",
    image: "/images/features/molecule-color.png",
    description: "通过不同的配色方案来展示分子的不同特性和属性，帮助用户更好地理解分子的化学特性和物理性质。"
  },
  4: {
    title: "分子位置",
    image: "/images/features/molecule-position.png",
    description: "精确控制分子的位置和方向，便于观察特定结构。用户可以自由调整分子的空间位置，以获得最佳的观察角度。"
  },
  5: {
    title: "分子选择与分离",
    image: "/images/features/molecule-selection.png",
    description: "用户可以选择和分离特定的分子部分进行详细分析，这对于研究分子的特定区域和功能具有重要意义。"
  },
  6: {
    title: "多配体对比视图",
    image: "/images/features/molecule-comparison.png",
    description: "用户可以在同一视图中比较多个配体，这有助于用户分析和比较不同配体与蛋白质靶点的相互作用。这个功能对于药物设计和筛选过程中的比较分析至关重要。"
  }
} as const;

export default function ServiceCards() {
  const [selectedService, setSelectedService] = useState<number>(1);
  const router = useRouter();

  const services = [
    { id: 1, title: "分子结构", icon: icons.target },
    { id: 2, title: "分子视图", icon: icons.molecule },
    { id: 3, title: "分子配色", icon: icons.microscope },
    { id: 4, title: "分子位置", icon: icons.flask },
    { id: 5, title: "分子选择与分离", icon: icons.route },
    { id: 6, title: "多配体对比视图", icon: icons.antibody },
  ];

  return (
    <div>
      <h2 className="text-3xl font-bold text-center mt-12 mb-12">主要功能</h2>

      <div className="px-[120px]">
        <div className="grid grid-cols-6 gap-8 mb-16">
          {services.map((service) => (
            <div
              key={service.id}
              className={`flex flex-col items-center cursor-pointer group`}
              onClick={() => setSelectedService(service.id)}
            >
              <div
                className={`w-14 h-14 flex items-center justify-center mb-2 ${service.id === selectedService ? 'text-primary' : 'text-gray-600'
                  } transition-colors`}
              >
                <Image
                  src={service.icon}
                  alt={service.title}
                  width={48}
                  height={48}
                  className="object-contain"
                />
              </div>
              <span
                className={`text-center text-sm ${service.id === selectedService
                  ? 'text-primary border-b-2 border-primary'
                  : ''
                  }`}
              >
                {service.title}
              </span>
            </div>
          ))}
        </div>

        <div className="flex items-start gap-24">
          <div className="w-[460px]">
            <Image
              src={featureDetails[selectedService as keyof typeof featureDetails].image}
              alt={featureDetails[selectedService as keyof typeof featureDetails].title}
              width={460}
              height={280}
              className="object-contain"
              priority
            />
          </div>

          <div className="flex-1 pt-4">
            <h2 className="text-3xl font-bold text-[#1e485d] mb-4">
              {featureDetails[selectedService as keyof typeof featureDetails].title}
            </h2>
            <p className="text-gray-600 mb-6 leading-relaxed max-w-2xl">
              {featureDetails[selectedService as keyof typeof featureDetails].description}
            </p>
            <button
              onClick={() => router.push(`/feature/${selectedService}`)}
              className="bg-primary text-white px-6 py-2 rounded bg-[#2cd3c7] hover:bg-[#25b5ab] transition-colors flex items-center gap-2 text-sm"
              type="button"
            >
              立即体验
              <span className="text-base">→</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 