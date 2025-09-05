import type { Config } from 'tailwindcss'
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: { extend: { colors: { bg: '#0b1020', card: '#151b2e', accent: '#4f46e5', text: '#e5e7eb' } } },
  plugins: [],
}
export default config
