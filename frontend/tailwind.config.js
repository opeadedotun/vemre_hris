/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    50: '#e3faf1',
                    100: '#c6f5e4',
                    200: '#88e7c6',
                    300: '#49d4a4',
                    400: '#1db783',
                    500: '#16996d',
                    600: '#127a58',
                    700: '#0E5C42',  // Official Company Color
                    800: '#093d2b',
                    900: '#062b1e',
                },
            },
        },
    },
    plugins: [],
}
