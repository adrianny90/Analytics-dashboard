import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        rise: "#16a34a",
        fall: "#dc2626",
      },
    },
  },
  plugins: [],
};

export default config;
