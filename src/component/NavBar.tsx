"use client";

import Image from "next/image";
import Link from "next/link";
import { icons } from "@/public/icons";
import { useLanguage } from "@/contexts/LanguageContext";

export default function NavBar() {
  const { language, setLanguage, t } = useLanguage();

  const toggleLanguage = () => {
    setLanguage(language === 'zh' ? 'en' : 'zh');
  };

  return (
    <nav className="bg-secondary text-white bg-[#1e475d]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Link href="/">
                <Image
                  src={icons.logo}
                  alt="Logo"
                  width={32}
                  height={32}
                  className="rounded-full"
                />
              </Link>
            </div>
            <div className="ml-10 flex items-center space-x-8">
              <Link
                href="/"
                className="border-b-2 border-primary hover:text-gray-300 transition-colors"
              >
                {t.nav.home}
              </Link>
              <Link
                href="/resources"
                className="hover:text-gray-300 transition-colors"
              >
                {t.nav.resources}
              </Link>
              <Link
                href="/community"
                className="hover:text-gray-300 transition-colors"
              >
                {t.nav.community}
              </Link>
            </div>
          </div>
          <div className="flex items-center">
            <button
              onClick={toggleLanguage}
              className="flex items-center space-x-2 hover:text-gray-300 transition-colors px-4 py-2 rounded-md"
            >
              <span className={`${language === 'zh' ? 'text-primary font-medium' : ''} transition-colors`}>
                中
              </span>
              <span className="text-gray-400">|</span>
              <span className={`${language === 'en' ? 'text-primary font-medium' : ''} transition-colors`}>
                EN
              </span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
} 