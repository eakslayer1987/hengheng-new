import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        kanit: ['var(--font-kanit)', 'sans-serif'],
      },
      colors: {
        // ── Red Gold Shop Theme ──────────────────
        bg:       '#3D0008',
        'bg-mid': '#5A000E',
        card:     '#6B0010',
        card2:    '#830014',
        // True gold palette
        gold: {
          pale: '#FBF0C8',
          lt:   '#F7D37A',
          mid:  '#C9963A',
          dk:   '#8B6914',
          deep: '#5C440A',
        },
        border:   'rgba(201,150,58,0.3)',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      boxShadow: {
        gold:     '0 6px 24px rgba(201,150,58,0.35)',
        'gold-lg':'0 8px 32px rgba(201,150,58,0.45)',
        'card':   '0 6px 20px rgba(0,0,0,0.4)',
        'inner-gold': 'inset 0 1px 0 rgba(247,211,122,0.15)',
      },
      backgroundImage: {
        'gold-gradient': 'linear-gradient(135deg, #FBF0C8, #F7D37A, #C9963A, #8B6914)',
        'gold-text':     'linear-gradient(180deg, #FBF0C8 0%, #F7D37A 40%, #C9963A 100%)',
        'card-gradient': 'linear-gradient(175deg, #7A0018 0%, #5A000E 40%, #3D0008 100%)',
        'damask': "url(\"data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23C9963A' fill-opacity='0.05'%3E%3Cpath d='M40 0 Q50 10 40 20 Q30 10 40 0Z M40 80 Q50 70 40 60 Q30 70 40 80Z M0 40 Q10 30 20 40 Q10 50 0 40Z M80 40 Q70 30 60 40 Q70 50 80 40Z'/%3E%3C/g%3E%3C/svg%3E\")",
      },
      keyframes: {
        shimmer: {
          '0%':       { backgroundPosition: '200% center' },
          '100%':     { backgroundPosition: '-200% center' },
        },
        beamMove: {
          '0%,100%': { top: '4px' },
          '50%':     { top: '92%' },
        },
        floatCoin: {
          '0%,100%': { transform: 'translateY(0) rotate(0deg)' },
          '50%':     { transform: 'translateY(-10px) rotate(15deg)' },
        },
        glowPulse: {
          '0%,100%': { opacity: '0.6', transform: 'scale(1)' },
          '50%':     { opacity: '1',   transform: 'scale(1.08)' },
        },
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        popIn: {
          from: { opacity: '0', transform: 'scale(0.85)' },
          to:   { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        shimmer:    'shimmer 2.5s linear infinite',
        beam:       'beamMove 2s ease-in-out infinite',
        floatCoin:  'floatCoin 3s ease-in-out infinite',
        glowPulse:  'glowPulse 2.5s ease infinite',
        fadeUp:     'fadeUp 0.35s ease both',
        popIn:      'popIn 0.4s cubic-bezier(.16,1,.3,1) both',
      },
    },
  },
  plugins: [],
}

export default config
