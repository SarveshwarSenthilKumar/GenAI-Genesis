import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: "#f6efe5",
        ink: "#0e2433",
        safe: "#16805d",
        review: "#d98a1b",
        block: "#b9382f",
        panel: "#fff9f1",
        muted: "#6a7882",
        line: "#dcc9af",
      },
      boxShadow: {
        frame: "0 18px 60px rgba(14, 36, 51, 0.12)",
      },
      backgroundImage: {
        "sentinel-glow":
          "radial-gradient(circle at top left, rgba(217,138,27,0.18), transparent 38%), radial-gradient(circle at top right, rgba(22,128,93,0.16), transparent 34%), linear-gradient(135deg, #f6efe5 0%, #fffaf2 50%, #f1e5d3 100%)",
      },
    },
  },
  plugins: [],
};

export default config;

