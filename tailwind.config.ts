import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        sand: "#f4f0ea",
        linen: "#ebe4db",
        sage: "#92a191",
        moss: "#55685a",
        ink: "#20211f",
        clay: "#8a6b5a",
        fog: "#f8f6f2",
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        serif: ["var(--font-serif)"],
      },
      boxShadow: {
        card: "0 16px 40px rgba(32, 33, 31, 0.08)",
        panel: "0 24px 64px rgba(32, 33, 31, 0.08)",
      },
      backgroundImage: {
        "soft-radial":
          "radial-gradient(circle at top, rgba(146, 161, 145, 0.18), transparent 45%), radial-gradient(circle at bottom right, rgba(138, 107, 90, 0.14), transparent 35%)",
      },
    },
  },
  plugins: [],
};

export default config;
