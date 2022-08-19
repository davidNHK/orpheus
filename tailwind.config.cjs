/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './node_modules/@busybox/react-components/dist/react-components.mjs',
    './cypress/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  presets: [require('@busybox/tailwindcss-config')],
};
