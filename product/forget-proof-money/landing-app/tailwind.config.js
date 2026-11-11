module.exports = {
  content: ["./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)", fg: "var(--fg)", soft: "var(--soft)", panel: "var(--panel)", panel2: "var(--panel2)", line: "var(--line)",
        ink: "#1d2440", bills: "#3a467c", mint: "#2fbf8f", "mint-l": "var(--mint-l)", coral: "#ff7a59", "coral-l": "var(--coral-l)", peri: "#6b7bd6", sun: "#ffd640",
      },
      fontFamily: {
        display: ['"Space Grotesk"', "Inter", "system-ui", "sans-serif"],
        body: ["Inter", "system-ui", "-apple-system", '"Segoe UI"', "sans-serif"],
        hand: ["Kalam", '"Comic Sans MS"', "cursive"],
      },
    },
  },
};
