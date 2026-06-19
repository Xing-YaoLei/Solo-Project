/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        primary: {
          DEFAULT: "#0D4F4F",
          light: "#1A6B6B",
          dark: "#073535",
        },
        accent: {
          DEFAULT: "#D4A24C",
          light: "#E5BC6D",
          dark: "#B8873A",
        },
        success: {
          DEFAULT: "#4CAF82",
          light: "#6FC99B",
          dark: "#3A8E68",
        },
        danger: {
          DEFAULT: "#E06C5C",
          light: "#EC8E82",
          dark: "#C45546",
        },
        warning: {
          DEFAULT: "#F5A623",
          light: "#F7BC55",
          dark: "#D48C14",
        },
        info: {
          DEFAULT: "#5B9BD5",
          light: "#7EB3E0",
          dark: "#417AB5",
        },
        neutral: {
          50: "#F5F1EA",
          100: "#E8E2D7",
          200: "#D1C8B5",
          300: "#B5AA93",
          400: "#998B72",
          500: "#7D6E56",
          600: "#5E5242",
          700: "#433A2F",
          800: "#2A2A2A",
          900: "#1A1A1A",
        },
      },
      borderRadius: {
        xl: "12px",
      },
      boxShadow: {
        button:
          "0 2px 8px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.08)",
        "button-hover":
          "0 4px 16px rgba(13, 79, 79, 0.25), 0 0 0 2px rgba(212, 162, 76, 0.4)",
        glass: "0 8px 32px rgba(0, 0, 0, 0.1)",
        card: "0 4px 16px rgba(0, 0, 0, 0.08)",
      },
      backdropBlur: {
        xs: "2px",
      },
      animation: {
        "progress-fill": "progressFill 0.6s ease-out forwards",
        "fade-in": "fadeIn 0.2s ease-out",
        "scale-in": "scaleIn 0.2s ease-out",
        pulse: "pulse 2s ease-in-out infinite",
      },
      keyframes: {
        progressFill: {
          "0%": { width: "0%" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
      },
    },
  },
  plugins: [],
};
