{{-- صفحة «مفيش نت» — بيخزّنها الـservice worker وقت التسطيب.
     مستقلة تماماً: مفيش Vite ولا خطوط خارجية، عشان تشتغل وانت أوفلاين. --}}
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
    <title>مفيش اتصال — محفول مكفول</title>
    <link rel="icon" type="image/png" href="/assets/img/favicon-32.png">
    <meta name="theme-color" content="#363677">
    <style>
        * { box-sizing: border-box; }
        body {
            margin: 0; min-height: 100vh;
            display: flex; align-items: center; justify-content: center;
            padding: 24px;
            background: #FBF7F0; color: #363677;
            font-family: 'Cairo', system-ui, -apple-system, 'Segoe UI', sans-serif;
            text-align: center;
            -webkit-tap-highlight-color: transparent;
        }
        .box { max-width: 340px; }
        img { width: 96px; height: auto; margin-bottom: 22px; }
        h1 { font-size: 22px; margin: 0 0 8px; }
        p { font-size: 15px; line-height: 1.7; color: #8A7C6A; margin: 0 0 26px; }
        button {
            width: 100%; min-height: 52px;
            border: 0; border-radius: 11px;
            background: linear-gradient(to left, #FC7660, #EA4B3B);
            color: #fff; font-size: 16px; font-weight: 800;
            font-family: inherit; cursor: pointer;
            transition: transform .13s ease, opacity .13s ease;
        }
        button:active { transform: scale(.96); opacity: .8; }
    </style>
</head>
<body>
    <div class="box">
        <img src="/assets/img/logo.png" alt="محفول مكفول">
        <h1>مفيش اتصال بالإنترنت</h1>
        <p>اتأكد إن الشبكة شغّالة وجرّب تاني — حجوزاتك كلها محفوظة ومستنياك.</p>
        <button type="button" onclick="location.reload()">حاول تاني</button>
    </div>
    <script>
        // أول ما النت يرجع، رجّعه لآخر صفحة كان عليها
        addEventListener('online', function () { history.length > 1 ? history.back() : location.replace('/'); });
    </script>
</body>
</html>
