import forms from '@tailwindcss/forms';
import animate from 'tailwindcss-animate';

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './resources/views/**/*.blade.php',
        './resources/js/**/*.{js,jsx}',
    ],
    theme: {
        extend: {
            // ألوان محفول مكفول — مستخرجة من اللوجو (logo.png)
            colors: {
                navy:      { DEFAULT: '#363677', light: '#4C4C90', deep: '#28285C' },
                coral:     { DEFAULT: '#FC7660', light: '#FD9683', deep: '#EA4B3B' },
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
                mk:    '0 8px 28px rgba(54,54,119,.09)',
                'mk-lg': '0 18px 50px rgba(54,54,119,.14)',
            },
        },
    },
    plugins: [forms, animate],
};
