<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="utf-8">
    <title>برنامج {{ $tour->title }} — محفول مكفول</title>
    <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&family=El+Messiri:wght@500;600;700&display=swap" rel="stylesheet">
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Cairo', sans-serif; color: #363677; background: #fff; padding: 40px 30px; line-height: 1.6; }
        .header { border-bottom: 3px solid #FC7660; padding-bottom: 20px; margin-bottom: 30px; }
        .logo { font-family: 'El Messiri', serif; font-size: 22px; font-weight: 700; color: #363677; }
        .logo b { color: #FC7660; }
        h1 { font-family: 'El Messiri', serif; font-size: 32px; margin: 15px 0 8px; color: #363677; }
        .subtitle { color: #8A7C6A; font-size: 15px; }
        .meta { display: flex; gap: 20px; margin-top: 15px; flex-wrap: wrap; font-size: 14px; }
        .meta span { background: #F1EADF; padding: 6px 14px; border-radius: 20px; font-weight: 600; }
        .price { display: inline-block; margin-top: 12px; padding: 8px 20px; background: linear-gradient(135deg, #FC7660, #EA4B3B); color: #fff; border-radius: 10px; font-family: 'El Messiri', serif; font-size: 20px; font-weight: 700; }

        h2 { font-family: 'El Messiri', serif; font-size: 22px; color: #363677; margin: 30px 0 15px; padding-right: 12px; border-right: 4px solid #FC7660; }

        .included { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
        .included li { list-style: none; padding: 8px 12px; background: #F1EADF; border-radius: 8px; font-size: 14px; font-weight: 600; }
        .included li::before { content: "✓ "; color: #1E7A52; font-weight: 900; }

        .day { border: 1.5px solid #E4DAC8; border-radius: 12px; padding: 20px; margin-bottom: 15px; break-inside: avoid; }
        .day-header { display: flex; align-items: center; gap: 15px; margin-bottom: 10px; }
        .day-num { width: 50px; height: 50px; border-radius: 50%; background: linear-gradient(135deg, #FC7660, #EA4B3B); color: #fff; display: flex; align-items: center; justify-content: center; font-family: 'El Messiri', serif; font-size: 18px; font-weight: 700; flex-shrink: 0; }
        .day-title { font-family: 'El Messiri', serif; font-size: 18px; font-weight: 700; color: #363677; }
        .day-desc { color: #363677; font-size: 14px; margin: 8px 0; }
        .highlights { list-style: none; padding: 0; }
        .highlights li { padding: 4px 0 4px 20px; position: relative; font-size: 13.5px; color: #363677; }
        .highlights li::before { content: "•"; position: absolute; right: 0; color: #FC7660; font-weight: 900; font-size: 16px; }

        .activities { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
        .activity { padding: 12px 14px; border: 1.5px solid #E4DAC8; border-radius: 10px; }
        .activity-title { font-weight: 700; font-size: 14px; color: #363677; }
        .activity-price { color: #EA4B3B; font-weight: 700; font-size: 14px; float: left; }

        .footer { margin-top: 40px; padding-top: 20px; border-top: 2px solid #F1EADF; text-align: center; font-size: 12px; color: #8A7C6A; }
        .footer strong { color: #363677; }

        @media print {
            body { padding: 15px 20px; }
            .no-print { display: none !important; }
            .day, .activity { break-inside: avoid; }
        }
        .print-btn { position: fixed; top: 20px; left: 20px; background: linear-gradient(135deg, #FC7660, #EA4B3B); color: #fff; border: none; padding: 12px 24px; border-radius: 10px; font-family: 'Cairo', sans-serif; font-size: 15px; font-weight: 700; cursor: pointer; box-shadow: 0 8px 20px rgba(234, 75, 59, .3); }
        .print-btn:hover { transform: translateY(-2px); }
    </style>
</head>
<body>
    <button class="print-btn no-print" onclick="window.print()">🖨 طباعة أو حفظ PDF</button>

    <div class="header">
        <div class="logo">محفول <b>مكفول</b></div>
        <div class="subtitle" style="font-size: 12px; margin-top: 4px;">رحلتك محفولة مكفولة · mahfolmakfol.com</div>
        <h1>{{ $tour->title }}</h1>
        <div class="subtitle">{{ $tour->short_desc }}</div>
        <div class="meta">
            <span>📍 {{ $tour->location?->name }}</span>
            <span>📅 {{ $tour->duration_days }} أيام</span>
            <span>👥 حتى {{ $tour->max_people }} فرد</span>
            @if($tour->is_guaranteed)
                <span style="background: #1E7A52; color: #fff;">✓ مكفول</span>
            @endif
        </div>
        <div class="price">
            {{ number_format($tour->sale_price ?: $tour->price, 0) }} ج.م
            @if($tour->sale_price)
                <span style="text-decoration: line-through; opacity: .7; font-size: 15px; margin-inline-start: 8px;">{{ number_format($tour->price, 0) }}</span>
            @endif
            <span style="font-size: 14px; opacity: .9; font-weight: 400;"> · للفرد</span>
        </div>
    </div>

    @if($tour->included && count($tour->included) > 0)
        <h2>الرحلة شاملة</h2>
        <ul class="included">
            @foreach($tour->included as $item)
                <li>{{ $item }}</li>
            @endforeach
        </ul>
    @endif

    @if($tour->itineraries->count() > 0)
        <h2>البرنامج اليومي</h2>
        @foreach($tour->itineraries as $day)
            <div class="day">
                <div class="day-header">
                    <div class="day-num">{{ $day->day_number }}</div>
                    <div class="day-title">{{ $day->title }}</div>
                </div>
                @if($day->description)
                    <p class="day-desc">{{ $day->description }}</p>
                @endif
                @if($day->highlights && count($day->highlights) > 0)
                    <ul class="highlights">
                        @foreach($day->highlights as $h)
                            <li>{{ $h }}</li>
                        @endforeach
                    </ul>
                @endif
            </div>
        @endforeach
    @elseif(is_array($tour->itinerary) && count($tour->itinerary) > 0)
        <h2>البرنامج اليومي</h2>
        @foreach($tour->itinerary as $i => $day)
            <div class="day">
                <div class="day-header">
                    <div class="day-num">{{ $i + 1 }}</div>
                    <div class="day-title">{{ $day['title'] ?? 'اليوم ' . ($i + 1) }}</div>
                </div>
                @if(!empty($day['desc']))
                    <p class="day-desc">{{ $day['desc'] }}</p>
                @endif
            </div>
        @endforeach
    @endif

    @if($tour->activeActivities->count() > 0)
        <h2>فعاليات اختيارية (Add-ons)</h2>
        <div class="activities">
            @foreach($tour->activeActivities as $act)
                <div class="activity">
                    <div class="activity-title">{{ $act->title }} <span class="activity-price">+{{ number_format($act->price, 0) }} ج.م</span></div>
                    @if($act->short_desc)
                        <div style="font-size: 12.5px; color: #8A7C6A; margin-top: 4px;">{{ $act->short_desc }}</div>
                    @endif
                </div>
            @endforeach
        </div>
    @endif

    <div class="footer">
        <strong>محفول مكفول</strong> — طُبع من mahfolmakfol.com · {{ now()->format('Y-m-d') }}
        <br>للاستفسار: 01000000000 · info@mahfolmakfol.com
    </div>

    <script>
        // فتح مربّع الطباعة تلقائياً لو المستخدم داخل من "تحميل PDF"
        if (window.location.search.includes('autoprint')) {
            window.addEventListener('load', () => setTimeout(() => window.print(), 500));
        }
    </script>
</body>
</html>
