import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './context/**/*.{js,ts,jsx,tsx}',
    './lib/**/*.{js,ts,jsx,tsx}',
  ],
  safelist: [
    'bg-cyan-600/80', 'border-cyan-400/40',
    'bg-emerald-600/80', 'border-emerald-400/40',
    'bg-blue-600/80', 'border-blue-400/40',
    'bg-red-600/80', 'border-red-400/40',
    'bg-amber-600/80', 'border-amber-400/40',
    'bg-violet-500/15', 'border-violet-500/25',
    'bg-emerald-500/15', 'border-emerald-500/25',
    'bg-blue-500/15', 'border-blue-500/25',
    'bg-red-500/15', 'border-red-500/25',
    'bg-amber-500/15', 'border-amber-500/25',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Semantic theme tokens (driven by CSS vars in globals.css).
        // Dark values match the current design, so dark mode is unchanged.
        bg: 'rgb(var(--bg) / <alpha-value>)',
        surface: 'rgb(var(--surface) / <alpha-value>)',
        'surface-2': 'rgb(var(--surface-2) / <alpha-value>)',
        fg: 'rgb(var(--fg) / <alpha-value>)',
        'fg-muted': 'rgb(var(--fg-muted) / <alpha-value>)',
        line: 'rgb(var(--line) / <alpha-value>)',
      },
      keyframes: {
        silkReveal: {
          '0%': { opacity: '0', transform: 'translateY(-6px) scale(0.98)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
      },
      animation: {
        'silk-reveal': 'silkReveal 0.4s cubic-bezier(0.22, 1, 0.36, 1) both',
      },
    },
  },
  plugins: [
    function ({ addUtilities }: { addUtilities: (utils: Record<string, Record<string, string | Record<string, string>>>) => void }) {
      addUtilities({
        '.scrollbar-hide': {
          '-ms-overflow-style': 'none',
          'scrollbar-width': 'none',
          '&::-webkit-scrollbar': {
            display: 'none',
          },
        },
      });
    },
  ],
}
export default config
