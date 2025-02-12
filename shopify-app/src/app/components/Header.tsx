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
      <header className={`sticky top-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'py-2 shadow-md bg-gray-50' 
          : 'py-6 shadow-none bg-white'
      }`}>
        <div className="max-w-[1024px] mx-auto px-4 flex justify-between items-center">
          <Link href="/" className="block w-fit">
            <Image
              src="/magexo_logo1.png"
              alt="Magexo Logo"
              width={200}
              height={60}
              className={`w-auto transition-all duration-300 ${
                isScrolled ? 'h-[60px]' : 'h-[70px]'
              } object-contain`}
              priority
            />
          </Link>
          
          <button 
            onClick={() => setIsModalOpen(true)}
            className="p-2 hover:bg-gray-100 rounded-full transition-all duration-300 hover:scale-110"
          >
            <svg 
              width="60" 
              height="60" 
              viewBox="0 0 100 100" 
              fill="#fe6900"
              className={`transition-all duration-300 hover:fill-[#d95800] ${
                isScrolled ? 'scale-[0.6]' : 'scale-[0.8]'
              }`}
            >
              <path d="M50,4C24.634,4,4,24.634,4,50s20.634,46,46,46s46-20.634,46-46S75.366,4,50,4z M74,52H52v22h-4V52H26v-4h22V26h4v22h22V52z" />
            </svg>
          </button>
        </div>
      </header>

      <CreateProductModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </>
  );
}