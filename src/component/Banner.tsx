"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Banner() {
    const { t } = useLanguage();
    const [currentSlide, setCurrentSlide] = useState(0);

    const slides = [
        {
            title: "HIT",
            subtitle: t.subtitle,
            description: t.description1,
            image: "/images/banner-bg1.png"
        },
        {
            title: "HIT",
            subtitle: t.subtitle,
            description: t.description2,
            image: "/images/banner-bg2.png"
        }
    ];

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % slides.length);
        }, 5000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="relative h-[500px] bg-secondary overflow-hidden bg-[#1e475d]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full ">
                <div className="flex items-center h-full">
                    <div className="w-3/4 text-white z-10">
                        <h1 className="text-4xl font-bold mb-4">
                            {slides[currentSlide].title}
                            <div className="text-2xl font-normal mt-2">{slides[currentSlide].subtitle}</div>
                        </h1>
                        <div className="text-gray-300 mb-8 max-w-3xl leading-relaxed">
                            {currentSlide === 0 ? (
                                <p className="text-base">{slides[currentSlide].description}</p>
                            ) : (
                                <div className="flex flex-col space-y-3">
                                    {(slides[currentSlide].description as string[]).map((item, index) => (
                                        <p key={index} className="text-base">{item}</p>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="flex space-x-3">
                            {slides.map((_, index) => (
                                <div
                                    key={index}
                                    className={`w-2 h-2 rounded-full transition-opacity duration-300
                    ${index === currentSlide ? 'bg-white' : 'bg-white/50'}
                    cursor-pointer`}
                                    onClick={() => setCurrentSlide(index)}
                                />
                            ))}
                        </div>
                    </div>
                    <div className="absolute right-0 top-0 w-1/2 h-full">
                        <div className="relative w-full h-full">
                            <Image
                                src={slides[currentSlide].image}
                                alt="Banner Image"
                                fill
                                className="object-cover object-right"
                                priority
                                unoptimized
                            />
                            <div className="absolute inset-0 bg-gradient-to-r from-secondary via-secondary/50 to-transparent" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
} 