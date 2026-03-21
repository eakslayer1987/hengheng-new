/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: "#00B900", light: "#00D46A", dark: "#009A00", bg: "#E8F9E8" },
      },
      fontFamily: { kanit: ["Kanit", "sans-serif"] },
    },
  },
  plugins: [],
};
