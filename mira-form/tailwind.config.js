/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx,js,jsx}", "./components/**/*.{ts,tsx,js,jsx}", "./data/**/*.{ts}"],
  theme: {
    extend: {
      colors: {
        miraBlue: "#00289f"
      }
    },
  },
  plugins: [],
}
