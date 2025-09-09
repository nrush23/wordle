"use client";

import { useState } from "react";
import { HiMenuAlt3 } from "react-icons/hi";
import { AiOutlineClose } from "react-icons/ai";

export default function Header() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const navigation = [
        { name: "Home", href: "/" },
        { name: "Graphics Assignments", href: "/graphics" },
        { name: "Contact", href: "/contact" }
    ];
    return (
        <header className="bg-gradient-to-r from-white to-gray-50 backdrop-blur-sm shadow-lg fixed w-full top-0 z-50 border-b border-gray-100 pb-px">
            <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-20">
                    <div className="flex-shrink-0 transition-transform duration-300 hover:scale-105">
                        <img
                            className="h-16 w-auto rounded-lg"
                            src="/favicon.ico"
                            alt="Durg's Durgers"
                            width={16}
                            height={16}
                        />
                    </div>

                    <div className="hidden md:flex md:items-center md:space-x-8">
                        {navigation.map((item) => (
                            <a key={item.name} href={item.href} className="text-gray-700 hover:text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ease-in-out relative group">
                                {item.name}
                                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-600 group-hover:w-full transition-all duration-300 ease-in-out"></span>
                            </a>
                        ))}
                    </div>

                    <div className="md:hidden">
                        <button
                            onClick={() => { setIsMenuOpen(!isMenuOpen) }}
                            className="inline-flex items-center justify-center p-2 rounded-full text-gray-700 hover:text-blue-600 hover:bg-blue-50 focus:outline-none transition-all duration-300"
                        >
                            {isMenuOpen ? (<AiOutlineClose className="h-6 w-6" />) : (<HiMenuAlt3 className="h-6 w-6" />)}

                        </button>
                    </div>
                </div>

                {isMenuOpen && (<div className="md:hidden animate-fadeIn"><div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">{navigation.map((item) => (
                    <a
                        key={item.name}
                        href={item.href}
                        className="text-gray-700 hover:text-blue-600 hover:bg-blue-50 block px-4 py-3 rounded-xl text-base font-medium transition-all duration-300 ease-in-out transform hover:translate-x-2"
                    >
                        {item.name}
                    </a>
                ))}
                </div>
                </div>)}
            </nav>
        </header>
    )
}