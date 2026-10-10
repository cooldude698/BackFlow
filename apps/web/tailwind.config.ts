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
        black: "#000000",
        periwinkle: {
          50: "#f5f6ff",
          100: "#ebedfe",
          200: "#d7dcfe",
          300: "#b5bffd",
          400: "#9ba8fb",
          500: "#8B9DF8",
          600: "#7380eb",
          700: "#5d67db",
          DEFAULT: "#8B9DF8",
          glow: "#A5B4FC"
        },
        coral: {
          50: "#fff5f5",
          100: "#ffe8e8",
          200: "#ffd1d1",
          300: "#ffa8a8",
          400: "#ff8787",
          500: "#FF6B6B",
          600: "#fa5252",
          DEFAULT: "#FF6B6B",
          glow: "#FF8787"
        },
        surface: {
          950: "#000000",
          900: "#08080b",
          850: "#101015",
          800: "#181820",
          border: "rgba(255, 255, 255, 0.08)"
        }
      },
      fontFamily: {
        sans: ["-apple-system", "BlinkMacSystemFont", "SF Pro Display", "Inter", "sans-serif"],
        mono: ["SF Mono", "JetBrains Mono", "monospace"]
      }
    },
  },
  plugins: [],
};
export default config;
