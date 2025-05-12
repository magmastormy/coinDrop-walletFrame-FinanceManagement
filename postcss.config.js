import postcssImport from 'postcss-import';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';
import cssnano from 'cssnano';
import purgecssModule from '@fullhuman/postcss-purgecss';

const isProduction = process.env.NODE_ENV === 'production';

// Ensure purgecss is correctly imported as a function
const purgecss = purgecssModule.default || purgecssModule;

export default {
  plugins: [
    postcssImport,
    tailwindcss,
    autoprefixer,
    cssnano({ preset: 'default' }),
    isProduction &&
      purgecss({
        content: ['./src/**/*.jsx', './src/**/*.html'],
        defaultExtractor: content => content.match(/[\w-/:]+(?<!:)/g) || [],
      }),
  ].filter(Boolean),
};