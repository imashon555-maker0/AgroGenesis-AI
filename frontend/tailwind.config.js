/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Primary agricultural greens (forest canopy)
        agro: {
          50:  "#f0fdf4",
          100: "#dcfce7",
          200: "#bbf7d0",
          300: "#86efac",
          400: "#4ade80",
          500: "#2d8a4e",
          600: "#1a7a3e",
          700: "#1a5c2a",
          800: "#164d24",
          900: "#0f3d1a",
        },
        // Field backgrounds (deep earth)
        field: {
          50:  "#e8f0e6",
          100: "#c8d5c0",
          200: "#a0b896",
          300: "#789b6c",
          400: "#5a8050",
          500: "#3d6438",
          600: "#2d4a2a",
          700: "#1e3320",
          800: "#162a1a",
          900: "#0f1f12",
          950: "#0a140c",
        },
        // Canopy surfaces (cards, panels)
        canopy: {
          50:  "#eef5ec",
          100: "#d4e5d0",
          200: "#a8c9a0",
          300: "#7cad70",
          400: "#5a914e",
          500: "#3d7a34",
          600: "#2d5c28",
          700: "#1e4a20",
          800: "#1a3d1a",
          900: "#142e14",
          950: "#0f220f",
        },
        // Earth accents (wheat, soil)
        earth: {
          50:  "#fdf8ed",
          100: "#f5e6c8",
          200: "#e8cc8a",
          300: "#d4a843",
          400: "#c4923a",
          500: "#a87a30",
          600: "#8b6328",
          700: "#6e4e22",
          800: "#5c3d1e",
          900: "#4a3018",
        },
      },
    },
  },
  plugins: [],
};
