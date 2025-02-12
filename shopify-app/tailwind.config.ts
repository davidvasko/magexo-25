import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      animation: {
        'gradient-x': 'gradient-x 15s ease infinite',
        'float': 'float 6s ease-in-out infinite',
        'card-hover': 'card-hover .3s ease-out forwards',
      },
      keyframes: {
        'gradient-x': {
          '0%, 100%': {
            'opacity': '0',
            'transform': 'translateX(-100%)'
          },
          '50%': {
            'opacity': '1',
            'transform': 'translateX(100%)'
          },
        },
        'float': {
          '0%, 100%': {
            transform: 'translateY(0)',
          },
          '50%': {
            transform: 'translateY(-10px)',
          },
        },
        'card-hover': {
          '0%': {
            transform: 'translateY(0) scale(1)',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
          },
          '100%': {
            transform: 'translateY(-5px) scale(1.01)',
            boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
          },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
