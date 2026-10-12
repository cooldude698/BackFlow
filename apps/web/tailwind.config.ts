import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brutal: {
          yellow: "#FFC800",
          "yellow-hover": "#FFD21A",
          "yellow-light": "#FFFBEB",
          black: "#000000",
          white: "#FFFFFF",
          canvas: "#F7F7F4",
          surface: "#FFFFFF",
          muted: "#666666",
          border: "#000000",
          danger: "#EF4444",
          success: "#10B981"
        },
        periwinkle: {
          50: "#fffdf0",
          100: "#fff9cc",
          200: "#fff199",
          300: "#ffe766",
          400: "#ffd933",
          500: "#ffc800",
          600: "#e6b400",
          700: "#cc9f00",
          DEFAULT: "#ffc800",
          glow: "#ffd933"
        },
        coral: {
          50: "#fff1f2",
          100: "#ffe4e6",
          200: "#fecdd3",
          300: "#fda4af",
          400: "#fb7185",
          500: "#f43f5e",
          600: "#e11d48",
          DEFAULT: "#f43f5e",
          glow: "#fb7185"
        },
        surface: {
          50: "#ffffff",
          100: "#faf9f5",
          200: "#f5f5f0",
          300: "#e5e5dc",
          400: "#c7c7bc",
          border: "#000000"
        }
      },
      fontFamily: {
        display: ["Space Grotesk", "Plus Jakarta Sans", "sans-serif"],
        sans: ["Plus Jakarta Sans", "Inter", "sans-serif"],
        mono: ["JetBrains Mono", "SF Mono", "monospace"]
      },
      boxShadow: {
        brutal: "3px 3px 0px #000000",
        "brutal-sm": "2px 2px 0px #000000",
        "brutal-lg": "5px 5px 0px #000000",
        "brutal-xl": "8px 8px 0px #000000",
        "brutal-yellow": "3px 3px 0px #FFC800",
        "2xs": "1.5px 1.5px 0px #000000",
        xs: "2px 2px 0px #000000",
        sm: "3px 3px 0px #000000"
      }
    },
  },
  plugins: [],
};
export default config;
