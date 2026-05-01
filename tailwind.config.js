/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      boxShadow: {
        soft: "0 12px 30px rgba(15, 23, 42, 0.08)",
      },
      keyframes: {
        "ring-spin": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
      },
      animation: {
        "ring-spin": "ring-spin 2.5s linear infinite",
      },
    },
  },
  plugins: [],
};
