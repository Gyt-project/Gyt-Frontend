import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        canvas: {
          DEFAULT: '#0d1117',
          subtle: '#161b22',
          inset: '#010409',
          overlay: '#2d333b',
        },
        border: {
          DEFAULT: '#30363d',
          muted: '#21262d',
        },
        fg: {
          DEFAULT: '#cdd9e5',
          muted: '#768390',
          subtle: '#545d68',
          onEmphasis: '#ffffff',
        },
        accent: {
          DEFAULT: '#316dca',
          emphasis: '#388bfd',
          muted: '#1d2d3e',
          subtle: '#0d2137',
          fg: '#58a6ff',
        },
        success: {
          DEFAULT: '#46954a',
          emphasis: '#238636',
          muted: '#1b4332',
          fg: '#57ab5a',
        },
        danger: {
          DEFAULT: '#e5534b',
          emphasis: '#c93c37',
          muted: '#341a1f',
          fg: '#f47067',
        },
        warning: {
          DEFAULT: '#966600',
          muted: '#2d2a00',
          fg: '#c69026',
        },
        purple: {
          DEFAULT: '#8957e5',
          fg: '#dcbdfb',
        },
      },
      fontFamily: {
        mono: [
          'ui-monospace',
          'SFMono-Regular',
          'SF Mono',
          'Menlo',
          'Consolas',
          'Liberation Mono',
          'monospace',
        ],
      },
    },
  },
  plugins: [],
};

export default config;
