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
        canvas: "#edf2f7",
        surface: "#f8fafc",
        elevated: "#ffffff",
        paper: "#f1f5f9",
        ink: "#0f172a",
        safe: "#0f766e",
        review: "#b7791f",
        block: "#c2410c",
        panel: "#ffffff",
        muted: "#64748b",
        line: "#cbd5e1",
        accent: "#2563eb",
      },
      boxShadow: {
        frame: "0 20px 60px rgba(15, 23, 42, 0.08)",
      },
      backgroundImage: {
        "sentinel-glow":
          "radial-gradient(circle at top left, rgba(37,99,235,0.12), transparent 34%), radial-gradient(circle at top right, rgba(15,118,110,0.08), transparent 30%), linear-gradient(135deg, #edf2f7 0%, #f8fafc 45%, #e2e8f0 100%)",
      },
    },
  },
  plugins: [],
};

export default config;
