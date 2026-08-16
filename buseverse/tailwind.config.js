/** @type {import('tailwindcss').Config} */
const v = (name) => `rgb(var(${name}) / <alpha-value>)`

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: { 0: v('--bg-0'), 1: v('--bg-1'), 2: v('--bg-2'), 3: v('--bg-3') },
        line: v('--line'),
        ink: { DEFAULT: v('--ink'), dim: v('--ink-dim'), mute: v('--ink-mute') },
        accent: { DEFAULT: v('--accent'), soft: v('--accent-soft') },
        gold: v('--gold'),
        lav: v('--lav'),
        wine: v('--wine'),
        rarity: {
          common: v('--r-common'),
          uncommon: v('--r-uncommon'),
          rare: v('--r-rare'),
          epic: v('--r-epic'),
          legendary: v('--r-legendary'),
          secret: v('--r-secret'),
        },
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', '"Times New Roman"', 'serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      borderRadius: {
        xs: '6px',
        sm: '10px',
        md: '14px',
        lg: '20px',
        xl: '28px',
        '2xl': '36px',
      },
      boxShadow: {
        soft: '0 2px 12px -4px rgb(0 0 0 / 0.45)',
        card: '0 10px 40px -18px rgb(0 0 0 / 0.75), inset 0 1px 0 0 rgb(255 255 255 / 0.05)',
        lift: '0 24px 60px -24px rgb(0 0 0 / 0.85), inset 0 1px 0 0 rgb(255 255 255 / 0.08)',
        glow: '0 0 28px -6px rgb(var(--accent) / 0.55)',
      },
      spacing: {
        gutter: 'clamp(1rem, 4vw, 2.5rem)',
        nav: '76px',
      },
      transitionTimingFunction: {
        out: 'cubic-bezier(0.22, 1, 0.36, 1)',
        inout: 'cubic-bezier(0.65, 0, 0.35, 1)',
      },
      keyframes: {
        shimmer: {
          '0%': { transform: 'translateX(-120%)' },
          '100%': { transform: 'translateX(220%)' },
        },
        floaty: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        pulseGlow: {
          '0%,100%': { opacity: '0.45' },
          '50%': { opacity: '0.9' },
        },
        heartbeat: {
          '0%,100%': { transform: 'scale(1)' },
          '14%': { transform: 'scale(1.14)' },
          '28%': { transform: 'scale(1)' },
          '42%': { transform: 'scale(1.1)' },
          '58%': { transform: 'scale(1)' },
        },
      },
      animation: {
        shimmer: 'shimmer 2.4s cubic-bezier(0.4,0,0.2,1) infinite',
        floaty: 'floaty 5s ease-in-out infinite',
        pulseGlow: 'pulseGlow 3.2s ease-in-out infinite',
        heartbeat: 'heartbeat 1.8s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
