import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#4F46E5", // Indigo
        secondary: "#10B981", // Emerald
        accent: "#F59E0B", // Amber
      },
    },
  },
  plugins: [require("daisyui")],
  // @ts-ignore - DaisyUI config is not recognized by TypeScript
  daisyui: {
    themes: ["light", "dark"],
  },
};

export default config;