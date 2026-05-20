/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                wedding: {
                    light: '#fdfbf7',
                    dark: '#2c2c2c',
                    accent: '#c8b273' // Zarif bir gold/krem tonu
                }
            }
        },
    },
    plugins: [],
}