import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Existing tokens
        bg: "#ffffff",
        "bg-muted": "#f8fafb",
        card: "rgba(15, 23, 42, 0.03)",
        "card-hover": "rgba(15, 23, 42, 0.06)",
        accent: "#0ea5a4",
        "accent-light": "#34d399",
        text: "#0f172a",
        "text-muted": "#475569",
        "text-dim": "#64748b",
        border: "rgba(15, 23, 42, 0.08)",
        success: "#10b981",
        warning: "#f59e0b",
        danger: "#ef4444",

        // Design tokens used by the HTML exports
        primary: "#4d91ea",
        "background-light": "#f6f7f8",
        "background-dark": "#111821",
      },
      fontFamily: {
        display: ["var(--font-inter)", "Inter", "sans-serif"],
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-main": "linear-gradient(135deg, #dff7f6 0%, #e6fbf8 100%)",
        "gradient-card":
          "linear-gradient(180deg, rgba(15,23,42,0.03) 0%, rgba(15,23,42,0.01) 100%)",
        "gradient-accent": "linear-gradient(135deg, #0ea5a4 0%, #34d399 100%)",
      },
      backdropBlur: {
        xs: "2px",
      },
      animation: {
        "fade-in": "fadeIn 0.45s ease-in-out",
        "slide-up": "slideUp 0.28s ease-out",
        "scale-in": "scaleIn 0.18s ease-out",
        "pulse-soft": "pulse 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(8px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        scaleIn: {
          "0%": { transform: "scale(0.98)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
      },
      boxShadow: {
        glass: "0 6px 24px 0 rgba(2, 6, 23, 0.06)",
        glow: "0 0 18px rgba(14, 165, 164, 0.14)",
      },
    },
  },
  plugins: [require("@tailwindcss/container-queries")],
};

export default config;