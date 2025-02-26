export const categoryStyles = {
  container: "max-w-[1024px] mx-auto mb-8 overflow-hidden",
  list: "flex gap-4 pb-4 overflow-x-auto scrollbar-hide",
  item: (isSelected: boolean) => `
    flex-shrink-0 px-4 py-2 rounded-lg cursor-pointer transition-colors duration-300
    ${isSelected 
      ? 'bg-[#fe6900] text-white' 
      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}
  `,
  unassignedItem: (isSelected: boolean) => `
    flex-shrink-0 px-4 py-2 rounded-lg cursor-pointer transition-colors duration-300
    ${isSelected 
      ? 'bg-red-500 text-white' 
      : 'bg-red-100 text-red-700 hover:bg-red-200'}
  `
};

export const globalStyles = `
  /* Scrollbar styles */
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }

  /* Swiper styles */
  .swiper-button-next,
  .swiper-button-prev {
    color: #fe6900 !important;
  }

  .swiper-button-disabled {
    opacity: 0.35 !important;
    cursor: auto !important;
    pointer-events: none !important;
  }

  .swiper-container {
    width: 100%;
    height: 100%;
  }

  .swiper-slide {
    text-align: center;
    font-size: 18px;
    background: #fff;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .swiper-slide img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  /* Animation styles */
  @keyframes check {
    0% {
      stroke-dasharray: 100;
      stroke-dashoffset: 100;
    }
    100% {
      stroke-dasharray: 100;
      stroke-dashoffset: 0;
    }
  }
  
  .animate-check {
    animation: check 0.8s ease-in-out forwards;
  }
  
  .animate-fade-in {
    animation: fadeIn 0.5s ease-in-out;
  }
  
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: scale(0.9);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  .slide-in {
    animation: slideIn 0.5s ease-out forwards;
  }

  /* Product Display Swiper styles */
  .product-display .swiper-button-next,
  .product-display .swiper-button-prev {
    color: #6B7280 !important;
  }
  
  .product-display .swiper-button-next:hover,
  .product-display .swiper-button-prev:hover {
    color: #4B5563 !important;
  }
  
  .product-display .swiper-pagination-bullet-active {
    background: #6B7280 !important;
  }
`; 

