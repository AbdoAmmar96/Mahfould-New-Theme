import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './resources/views/**/*.blade.php',
        './resources/js/**/*.{js,jsx}',
    ],
    theme: {
        extend: {
            // ألوان محفول مكفول — من دليل الهوية
            colors: {
                navy:      { DEFAULT: '#303070', light: '#4A4680', deep: '#24245A' },
                coral:     { DEFAULT: '#F5764E', deep: '#E2492B' },
                cream:     '#FBF7F0',
                beige:     '#F1EADF',
                sandline:  '#EADFC9',
                muted:     '#8A7C6A',
                makfol:    '#1E7A52',
                vip:       '#B58A2E',
                danger:    '#D2402F',
                royal:     '#6B4EA8',
            },
            fontFamily: {
                head: ['El Messiri', 'Cairo', 'serif'],
                body: ['Cairo', 'system-ui', 'sans-serif'],
            },
            borderRadius: {
                input: '11px',
                card: '16px',
                section: '20px',
            },
            boxShadow: {
                mk:    '0 8px 28px rgba(48,48,112,.09)',
                'mk-lg': '0 18px 50px rgba(48,48,112,.14)',
            },
        },
    },
    plugins: [forms],
};
