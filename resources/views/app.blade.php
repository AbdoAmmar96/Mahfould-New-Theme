<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" dir="rtl">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title inertia>{{ config('app.name', 'محفول مكفول') }}</title>
    {{-- شعار التبويب (favicon) --}}
    <link rel="icon" type="image/png" sizes="32x32" href="{{ asset('assets/img/logo-t.png') }}">
    <link rel="icon" type="image/png" sizes="192x192" href="{{ asset('assets/img/logo.png') }}">
    <link rel="apple-touch-icon" href="{{ asset('assets/img/logo.png') }}">
    <link rel="shortcut icon" href="{{ asset('assets/img/logo-t.png') }}">
    <meta name="theme-color" content="#363677">
    <meta property="og:image" content="{{ asset('assets/img/logo.png') }}">
    <meta property="og:title" content="{{ config('app.name', 'محفول مكفول') }}">
    <meta name="description" content="رحلتك محفولة مكفولة — سياحة داخلية موثوقة في مصر">
    <meta property="og:description" content="رحلتك محفولة مكفولة — سياحة داخلية موثوقة في مصر">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&family=El+Messiri:wght@500;600;700&display=swap" rel="stylesheet">
    @routes
    @viteReactRefresh
    @vite('resources/js/app.jsx')
    @inertiaHead
</head>
<body class="font-body bg-cream text-navy antialiased">
    @inertia
</body>
</html>
