/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./app/components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#0E1B1E",
          soft: "#16292C",
          line: "#233A3D",
        },
        paper: {
          DEFAULT: "#EDE6D6",
          dim: "#E2D9C4",
          text: "#1B2420",
        },
        amber: {
          DEFAULT: "#E7A73E",
          dark: "#C98A26",
        },
        teal: {
          DEFAULT: "#4FB3A9",
          dark: "#357C75",
        },
        brick: {
          DEFAULT: "#C8553D",
          dark: "#A5432F",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      borderRadius: {
        card: "10px",
      },
    },
  },
  plugins: [],
};
