/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      screens: {
        'xs': '475px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
      },
      colors: {
        background: 'rgb(var(--background) / <alpha-value>)',
        foreground: 'rgb(var(--foreground) / <alpha-value>)',
        card: {
          DEFAULT: 'rgb(var(--card) / <alpha-value>)',
          foreground: 'rgb(var(--card-foreground) / <alpha-value>)',
        },
        popover: {
          DEFAULT: 'rgb(var(--popover) / <alpha-value>)',
          foreground: 'rgb(var(--popover-foreground) / <alpha-value>)',
        },
        primary: {
          DEFAULT: 'rgb(var(--primary) / <alpha-value>)',
          foreground: 'rgb(var(--primary-foreground) / <alpha-value>)',
        },
        secondary: {
          DEFAULT: 'rgb(var(--secondary) / <alpha-value>)',
          foreground: 'rgb(var(--secondary-foreground) / <alpha-value>)',
        },
        muted: {
          DEFAULT: 'rgb(var(--muted) / <alpha-value>)',
          foreground: 'rgb(var(--muted-foreground) / <alpha-value>)',
        },
        accent: {
          DEFAULT: 'rgb(var(--accent) / <alpha-value>)',
          foreground: 'rgb(var(--accent-foreground) / <alpha-value>)',
        },
        destructive: {
          DEFAULT: 'rgb(var(--destructive) / <alpha-value>)',
          foreground: 'rgb(var(--destructive-foreground) / <alpha-value>)',
        },
        border: 'rgb(var(--border) / <alpha-value>)',
        input: 'rgb(var(--input) / <alpha-value>)',
        ring: 'rgb(var(--ring) / <alpha-value>)',
        // Design System Colors - Curator Pro Theme
        'surface': {
          DEFAULT: '#0b1326',
          'dim': '#0b1326',
          'bright': '#31394d',
          'container': {
            'lowest': '#060e20',
            'low': '#131b2e',
            DEFAULT: '#171f33',
            'high': '#222a3d',
            'highest': '#2d3449',
          },
          'variant': '#2d3449',
          'tint': '#b6c4ff',
        },
        'on-surface': {
          DEFAULT: '#dae2fd',
          'variant': '#c6c6cd',
        },
        'primary-container': '#001247',
        'on-primary-container': '#4d76ff',
        'secondary-container': '#00a572',
        'on-secondary-container': '#00311f',
        'tertiary': {
          DEFAULT: '#b9c8de',
          'container': '#081828',
        },
        'on-tertiary': {
          DEFAULT: '#233143',
          'container': '#738296',
        },
        'primary-fixed': '#dce1ff',
        'primary-fixed-dim': '#b6c4ff',
        'secondary-fixed': '#6ffbbe',
        'secondary-fixed-dim': '#4edea3',
        'tertiary-fixed': '#d4e4fa',
        'tertiary-fixed-dim': '#b9c8de',
        'on-primary-fixed': '#001550',
        'on-secondary-fixed': '#002113',
        'on-tertiary-fixed': '#0d1c2d',
        'on-primary-fixed-variant': '#003ab3',
        'on-secondary-fixed-variant': '#005236',
        'on-tertiary-fixed-variant': '#39485a',
        'inverse': {
          'surface': '#dae2fd',
          'on-surface': '#283044',
          'primary': '#004ee8',
        },
        'outline': {
          DEFAULT: '#909097',
          'variant': '#45464d',
        },
        'error': {
          DEFAULT: '#ffb4ab',
          'container': '#93000a',
        },
        'on-error': {
          DEFAULT: '#690005',
          'container': '#ffdad6',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        sans: ['Manrope', 'sans-serif'],
        display: ['Sora', 'sans-serif'],
        headline: ['Manrope', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        label: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'glass': '0 4px 30px rgba(0, 0, 0, 0.1)',
        'glass-sm': '0 2px 10px rgba(0, 0, 0, 0.03)',
        'glass-md': '0 10px 30px rgba(0, 0, 0, 0.06)',
        'glow': '0 0 20px rgba(59, 130, 246, 0.3)',
      },
      backdropBlur: {
        'xs': '2px',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [],
}
