'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import CreateProductModal from './CreateProductModal';

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <header className={`fixed w-full top-0 z-50 transition-all duration-300 py-2 ${
        isScrolled 
          ? 'shadow-md bg-gray-50' 
          : 'shadow-none bg-white'
      }`}>
        <div className="max-w-[924px] mx-auto px-4 flex justify-between items-center">
          <Link href="/" className="block w-fit">
            <Image
              src="/magexo_logo1.png"
              alt="Magexo Logo"
              width={150}
              height={50}
              sizes="150px"
              className="w-[150px] h-[50px]"
              priority
            />
          </Link>
          
          <button 
            onClick={() => setIsModalOpen(true)}
            className={`relative p-3 rounded-full transition-all duration-300 
              hover:bg-[#ffe4d3] group overflow-hidden
              ${isModalOpen ? 'bg-[#ffe4d3]' : 'bg-transparent'}`}
            aria-label="Add Product"
          >
            <div className={`w-10 h-10 transition-all duration-300 transform
              ${isModalOpen ? 'rotate-[135deg]' : 'group-hover:rotate-[90deg]'}`}
            >
              <svg 
                viewBox="0 0 36 36" 
                className="w-full h-full"
              >
                <path 
                  d="M18 4C10.268 4 4 10.268 4 18s6.268 14 14 14 14-6.268 14-14S25.732 4 18 4z" 
                  className={`transition-all duration-300 
                    ${isModalOpen 
                      ? 'fill-[#e55f00]' 
                      : 'fill-[#fe6900] group-hover:fill-[#e55f00]'}`}
                />
                <path 
                  d="M25 19h-6v6h-2v-6h-6v-2h6v-6h2v6h6v2z" 
                  fill="white"
                />
              </svg>
            </div>
          </button>
        </div>
      </header>
      <div className="h-[76px]" />
      <CreateProductModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </>
  );
}