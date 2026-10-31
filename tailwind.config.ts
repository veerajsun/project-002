import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        honey: {
          50: "#fbf8ef",
          100: "#f5eed7",
          500: "#c28a2a",
          600: "#b87a1e",
          700: "#966114",
          800: "#8c5e14",
        },
        charcoal: {
          900: "#111827",
          800: "#1f2937",
          700: "#374151",
          600: "#4b5563",
          500: "#6b7280",
        },
        surface: {
          DEFAULT: "#ffffff",
          card: "#ffffff",
          muted: "#f9fafb",
          container: "#f3f4f6",
        },
        hairline: "#e5e7eb",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        serif: ["var(--font-serif)", "Georgia", "serif"],
      },
      maxWidth: {
        store: "1360px",
      },
      boxShadow: {
        flyout:
          "0 12px 32px -4px rgba(17,24,39,0.04), 0 4px 12px -2px rgba(17,24,39,0.02)",
      },
    },
  },
  plugins: [],
};

export default config;
