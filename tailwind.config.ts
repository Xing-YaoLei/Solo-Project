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
        primary: {
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",
        },
        shortage: {
          light: "#fef2f2",
          DEFAULT: "#ef4444",
          dark: "#b91c1c",
        },
        warning: {
          light: "#fffbeb",
          DEFAULT: "#f59e0b",
          dark: "#b45309",
        },
        success: {
          light: "#f0fdf4",
          DEFAULT: "#10b981",
          dark: "#047857",
        },
      },
    },
  },
  plugins: [],
};
export default config;
