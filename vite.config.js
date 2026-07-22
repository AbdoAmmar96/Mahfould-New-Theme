import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [
        laravel({
            input: 'resources/js/app.jsx',
            refresh: true,
        }),
        react(),
    ],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'resources/js'),
        },
    },
    // من غير ده Vite بيربط على IPv6 بس، وLaravel بيكتب في public/hot
    // عنوان زي http://[::1]:5173 — واللي بيفشل في أي متصفح مش شايف IPv6،
    // فالصفحة بتطلع بيضا من غير CSS ولا JS.
    server: {
        host: '127.0.0.1',
        port: 5173,
        strictPort: true,
    },
});
