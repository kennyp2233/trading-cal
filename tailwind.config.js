// tailwind.config.js
module.exports = {
    content: [
        './app/**/*.{js,ts,jsx,tsx}',
        './pages/**/*.{js,ts,jsx,tsx}',
        './components/**/*.{js,ts,jsx,tsx}',
    ],
    safelist: [
        'bg-gray-50',
        'bg-yellow-100',
        'text-yellow-800',
        'bg-purple-100',
        'text-purple-800',
        'bg-green-100',
        'text-green-800',
        'bg-blue-100',
        'text-blue-800',
        'bg-red-100',
        'text-red-800',
        'text-green-600',
        'text-red-600',
    ],
    theme: {
        extend: {},
    },
    plugins: [],
}
