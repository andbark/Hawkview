/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      borderColor: {
        border: "var(--border)"
      },
      backgroundColor: {
        background: "var(--background)"
      },
      textColor: {
        foreground: "var(--foreground)"
      }
    }
  }
}
