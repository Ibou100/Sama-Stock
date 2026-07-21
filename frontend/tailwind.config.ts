import type { Config } from 'tailwindcss'

const config: Config = {
  // Paths to all files that use Tailwind classes — critical for purging unused CSS in production
  content: ['./index.html', './src/**/*.{ts,tsx}'],

  // 'class' strategy: dark mode is toggled by adding/removing the 'dark' class on <html>
  // This is required for our manual dark mode toggle (Sprint 2)
  darkMode: 'class',

  theme: {
    extend: {
      // Design tokens will be added here in Sprint 0-3 (shadcn/ui) and Sprint 2 (design system)
    },
  },

  plugins: [],
}

export default config
