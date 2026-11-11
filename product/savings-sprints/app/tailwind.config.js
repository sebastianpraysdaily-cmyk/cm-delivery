module.exports = {
  content: ["./src/**/*.{js,jsx}"],
  theme: { extend: {
    colors: { bg: "var(--bg)", fg: "var(--fg)", soft: "var(--soft)", panel: "var(--panel)", panel2: "var(--panel2)", line: "var(--line)",
      ink: "#1f1b2e", pink: "#ff5fa2", sun: "#ffd23f", mint: "#3ddc97", sky: "#4cc9f0", grape: "#7b61ff", tang: "#ff8c42" },
    fontFamily: { display: ["Fredoka", "Inter", "system-ui", "sans-serif"], body: ["Inter", "system-ui", "-apple-system", '"Segoe UI"', "sans-serif"] },
  } },
};
