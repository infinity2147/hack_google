/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        bg: {
          base: "#060b14",
          surface: "#0d1521",
          elevated: "#111d2e",
          hover: "#162035",
        },
        border: {
          DEFAULT: "#1e2d42",
          bright: "#2a3f5e",
        },
        text: {
          primary: "#e2eaf6",
          secondary: "#8fa4c0",
          dim: "#4a6278",
        },
        accent: {
          teal: "#00d4aa",
          blue: "#3b82f6",
          purple: "#8b5cf6",
          amber: "#f59e0b",
          red: "#ef4444",
          green: "#22c55e",
        },
        sir: {
          s: "#3b82f6",
          i: "#ef4444",
          r: "#22c55e",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["'JetBrains Mono'", "'Fira Code'", "monospace"],
      },
      animation: {
        "ping-ring": "ping-ring 1.6s cubic-bezier(0,0,0.2,1) infinite",
        "scan-sweep": "scan-sweep 2.5s ease-in-out infinite",
        "slow-spin": "slow-spin 18s linear infinite",
        "pulse-soft": "pulse-soft 2s ease-in-out infinite",
      },
      keyframes: {
        "ping-ring": {
          "0%": { boxShadow: "0 0 0 0 rgba(239,68,68,0.6)" },
          "100%": { boxShadow: "0 0 0 16px rgba(239,68,68,0)" },
        },
        "scan-sweep": {
          "0%": { transform: "translateY(-100%)", opacity: "0" },
          "50%": { opacity: "0.6" },
          "100%": { transform: "translateY(2000%)", opacity: "0" },
        },
        "slow-spin": {
          to: { transform: "rotate(360deg)" },
        },
        "pulse-soft": {
          "0%,100%": { opacity: "1" },
          "50%": { opacity: "0.6" },
        },
      },
      boxShadow: {
        glow: "0 0 20px rgba(0,212,170,0.18)",
        "glow-red": "0 0 20px rgba(239,68,68,0.25)",
        "glow-amber": "0 0 16px rgba(245,158,11,0.22)",
        "glow-purple": "0 0 16px rgba(139,92,246,0.22)",
      },
    },
  },
  plugins: [],
};
