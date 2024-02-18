import type { Config } from "tailwindcss";
import plugin from "tailwindcss/plugin";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
    },
  },
  plugins: [
    plugin(({ addComponents }) => {
      addComponents({
        ".btn": {
          padding: ".25rem 1rem",
          borderRadius: ".25rem",
          fontWeight: "600",
        },
        ".btn-primary": {
          backgroundColor: "#84cc16",
          color: "#000",
          "&:disabled": {
            backgroundColor: "#d4d4d4",
            color: "#737373",
          },
        },
      });
    }),
  ],
};
export default config;
