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
        espresso: '#2b2118',
        crema: '#f7f0e7',
        caramel: '#a55a1f',
        'caramel-strong': '#c87532',
        sage: '#59654f',
      },
    },
  },
  plugins: [],
};

export default config;
