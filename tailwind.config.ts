import type { Config } from "tailwindcss"

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
          50: "#E8EBF0",
          100: "#C5CCD9",
          200: "#8B99B3",
          300: "#51668D",
          400: "#2D4470",
          500: "#1B2A4A",
          600: "#162240",
          700: "#111A33",
          800: "#0C1226",
          900: "#070919",
        },
        amber: {
          500: "#F59E0B",
          600: "#D97706",
        },
        slate: {
          500: "#64748B",
        },
        emerald: {
          500: "#10B981",
        },
        coral: {
          500: "#EF4444",
        },
      },
      fontFamily: {
        sans: ['"Noto Sans SC"', '"DM Sans"', "sans-serif"],
        display: ['"DM Sans"', '"Noto Sans SC"', "sans-serif"],
      },
    },
  },
  plugins: [],
}

export default config
