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
  daisyui: {
    themes: [
      {
        dark: {
          primary: "#14b8a6", // teal-500
          secondary: "#f59e0b", // amber-500
          accent: "#ec4899", // pink-500
          neutral: "#1e293b", // slate-800
          "base-100": "#0f172a", // slate-900
          "base-200": "#1e293b", // slate-800
          "base-300": "#334155", // slate-700
          info: "#3abff8",
          success: "#36d399",
          warning: "#fbbd23",
          error: "#f87272",
        },
        light: {
          primary: "#14b8a6", // teal-500
          secondary: "#f59e0b", // amber-500
          accent: "#ec4899", // pink-500
          neutral: "#e5e7eb", // gray-200
          "base-100": "#f9fafb", // gray-50
          "base-200": "#f3f4f6", // gray-100
          "base-300": "#e5e7eb", // gray-200
          info: "#3abff8",
          success: "#36d399",
          warning: "#fbbd23",
          error: "#f87272",
        },
        cyberpunk: {
          primary: "#ff7ac6", // pink
          secondary: "#31c4fe", // cyan
          accent: "#f3f73f", // yellow
          neutral: "#000000", // black
          "base-100": "#000000", // black
          "base-200": "#1a1a1a", // darker black
          "base-300": "#2a2a2a", // even darker black
          info: "#31c4fe",
          success: "#3fff2d",
          warning: "#f3f73f",
          error: "#ff1f1f",
        },
        synthwave: {
          primary: "#e779c1", // pink
          secondary: "#58c7f3", // blue
          accent: "#f3cc30", // yellow
          neutral: "#2e1065", // purple-950
          "base-100": "#2e1065", // purple-950
          "base-200": "#4c1d95", // purple-900
          "base-300": "#6b21a8", // purple-800
          info: "#58c7f3",
          success: "#36d399",
          warning: "#f3cc30",
          error: "#ff1f1f",
        },
        forest: {
          primary: "#16a34a", // green-600
          secondary: "#eab308", // yellow-500
          accent: "#d97706", // amber-600
          neutral: "#064e3b", // emerald-900
          "base-100": "#064e3b", // emerald-950
          "base-200": "#065f46", // emerald-900
          "base-300": "#047857", // emerald-800
          info: "#0284c7", // sky-600
          success: "#16a34a", // green-600
          warning: "#d97706", // amber-600
          error: "#dc2626", // red-600
        },
        aqua: {
          primary: "#0ea5e9", // sky-500
          secondary: "#14b8a6", // teal-500
          accent: "#06b6d4", // cyan-500
          neutral: "#0c4a6e", // sky-950
          "base-100": "#0c4a6e", // sky-950
          "base-200": "#075985", // sky-900
          "base-300": "#0369a1", // sky-800
          info: "#38bdf8", // sky-400
          success: "#4ade80", // green-400
          warning: "#fbbf24", // amber-400
          error: "#f87171", // red-400
        },
      },
    ],
  },
};

export default config;