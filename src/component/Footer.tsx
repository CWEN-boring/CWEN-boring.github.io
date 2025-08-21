"use client";

import { useLanguage } from "@/contexts/LanguageContext";

export default function Footer() {
    const { t } = useLanguage();

    return (
        <footer className="bg-secondary text-white py-8 bg-[#1e475d]" >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-2 gap-8">
                    {/* 左侧联系方式 */}
                    <div className="border-r border-gray-600 pr-8">
                        <h3 className="text-xl font-semibold mb-4">联系我们</h3>
                        <div className="space-y-2">
                            <p className="flex items-center">
                                <span className="w-20">姓名：</span>
                                <a href="#" className="hover:text-gray-300">陈博奕、 刘冰冰 </a>
                            </p>
                            <p className="flex items-center">
                                <span className="w-20">电话：</span>
                                {/* <a href="tel:15238666015" className="hover:text-gray-300">15238666015</a> */}
                            </p>
                            <p className="flex items-center">
                                <span className="w-20">邮箱：</span>
                                {/* <a href="mailto:liuyb_work@163.com" className="hover:text-gray-300">liuyb_work@163.com</a> */}
                            </p>
                        </div>
                    </div>

                    {/* 右侧其他信息 */}
                    <div className="pl-8">
                        <h3 className="text-xl font-semibold mb-4">关注我们</h3>
                        <div className="space-y-2">
                            <p>更多信息敬请期待...</p>
                        </div>
                    </div>
                </div>

                {/* 版权信息 */}
                <div className="mt-8 pt-8 border-t border-gray-600 text-center text-sm text-gray-400">
                    <p>Copyright © 2024 HIT. All Rights Reserved.</p>
                </div>
            </div>
        </footer>
    );
} 