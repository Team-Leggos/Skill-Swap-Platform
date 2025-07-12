/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          light: "#3a5ba0", // darker blue
          DEFAULT: "#22336b", // main dark blue
          dark: "#141e30", // very deep blue
        },
        secondary: {
          light: "#7b4397", // darker purple
          DEFAULT: "#4e2a62", // main dark purple
          dark: "#2c1338", // very deep purple
        },
        accent: {
          light: "#e0c3fc", // muted pastel
          DEFAULT: "#b993d6", // muted purple accent
          dark: "#8e54e9", // rich accent
        },
        background: {
          light: "#232526", // dark gray
          DEFAULT: "#1a1a2e", // main background
          dark: "#0f2027", // very dark
        },
        success: "#34d399",
        warning: "#f59e42",
        danger: "#ef4444",
      },
      fontFamily: {
        sans: ["Poppins", "Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
