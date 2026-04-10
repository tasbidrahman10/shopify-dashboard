import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          950: "#0a0f1e",
          900: "#0d1424",
          800: "#111827",
          700: "#1a2035",
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
      },
      boxShadow: {
        "glow-indigo":
          "0 0 20px rgba(99,102,241,0.18), 0 0 40px rgba(99,102,241,0.06)",
        "glow-emerald": "0 0 20px rgba(16,185,129,0.18)",
        "glow-amber": "0 0 20px rgba(245,158,11,0.18)",
        "glow-pink": "0 0 20px rgba(236,72,153,0.18)",
      },
      animation: {
        "fade-slide-up": "fadeSlideUp 0.5s ease-out forwards",
        "pulse-slow": "pulse 3s ease-in-out infinite",
        "spin-slow": "spin 3s linear infinite",
        "border-glow": "borderGlow 2s ease-in-out infinite alternate",
      },
      keyframes: {
        fadeSlideUp: {
          from: { opacity: "0", transform: "translateY(24px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        borderGlow: {
          from: { borderColor: "rgba(99,102,241,0.3)" },
          to: { borderColor: "rgba(139,92,246,0.7)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
