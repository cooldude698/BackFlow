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
        periwinkle: {
          50: "#f5f6ff",
          100: "#ebedfe",
          200: "#d7dcfe",
          300: "#b5bffd",
          400: "#818cf8",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
          DEFAULT: "#6366f1",
          glow: "#818cf8"
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
          100: "#fafafc",
          200: "#f4f5fa",
          300: "#e9ebf2",
          400: "#d8dce8",
          border: "rgba(0, 0, 0, 0.08)"
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
