import { useEffect, useState } from 'react';

// تنسيق تاريخ محلي Y-m-d بدون تحويل UTC (يتجنّب إزاحة اليوم حسب المنطقة)
export function ymd(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

/** يجيب خريطة تاريخ→عدد متبقّي من endpoint الإتاحة */
export function useAvailability(url) {
    const [data, setData] = useState(null); // { units_total, remaining: {date:count} }

    useEffect(() => {
        if (!url) return;
        let alive = true;
        fetch(url, { headers: { Accept: 'application/json' } })
            .then((r) => (r.ok ? r.json() : null))
            .then((j) => alive && setData(j))
            .catch(() => {});
        return () => { alive = false; };
    }, [url]);

    return data;
}

/** أقل عدد وحدات متبقّية عبر مدى ليالٍ (يبدأ من startDate لعدد nights) */
export function remainingForRange(data, startDate, nights) {
    if (!data || !startDate) return null;
    const total = data.units_total ?? 0;
    const map = data.remaining || {};
    let min = total;
    const d = new Date(startDate + 'T00:00:00');
    for (let i = 0; i < nights; i++) {
        const key = ymd(d);
        min = Math.min(min, key in map ? map[key] : total);
        d.setDate(d.getDate() + 1);
    }
    return Math.max(0, min);
}
