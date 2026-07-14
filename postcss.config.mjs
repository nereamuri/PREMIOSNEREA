// Tailwind v4 sustituye al plugin PostCSS "tailwindcss" (v3) por
// "@tailwindcss/postcss". Ya no hace falta autoprefixer: el nuevo motor
// (Lightning CSS) gestiona el prefijado de vendor internamente.
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
