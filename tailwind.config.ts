import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          900: "#1B2A4A",
          800: "#243556",
          700: "#2D4063",
          600: "#3A5280",
        },
        amber: {
          500: "#F59E0B",
          400: "#FBBF24",
          600: "#D97706",
        },
        slate: {
          500: "#64748B",
          600: "#475569",
          700: "#334155",
          800: "#1E293B",
        },
      },
      fontFamily: {
        display: ["DM Sans", "sans-serif"],
        body: ["Source Sans 3", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
