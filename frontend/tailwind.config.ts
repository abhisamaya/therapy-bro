import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Base / surfaces
        bg: "#ffffff", // page background - pure white
        "bg-muted": "#f8fafb", // subtle off-white for panels/sections
        card: "rgba(15, 23, 42, 0.03)", // very light card surface (soft shadow effect)
        "card-hover": "rgba(15, 23, 42, 0.06)",

        // Primary accents (teal -> emerald family)
        accent: "#0ea5a4", // teal (main)
        "accent-light": "#34d399", // lighter/emerald-leaning accent for hover, borders

        // Text hierarchy (dark on light background)
        text: "#0f172a", // primary text (slate-900)
        "text-muted": "#475569", // secondary text (slate-600)
        "text-dim": "#64748b", // tertiary / hint (slate-500)

        // Borders / dividers
        border: "rgba(15, 23, 42, 0.08)",

        // Semantic colors
        success: "#10b981", // green (success)
        warning: "#f59e0b", // amber (warning)
        danger: "#ef4444", // red (danger)
      },

      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-main": "linear-gradient(135deg, #dff7f6 0%, #e6fbf8 100%)", // soft teal wash
        "gradient-card":
          "linear-gradient(180deg, rgba(15,23,42,0.03) 0%, rgba(15,23,42,0.01) 100%)",
        "gradient-accent": "linear-gradient(135deg, #0ea5a4 0%, #34d399 100%)",
      },

      // Slightly lighter blur value for light theme frosted effects
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
  plugins: [],
};
export default config;
