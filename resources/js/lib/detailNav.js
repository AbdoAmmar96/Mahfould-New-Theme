// تعريف أقسام صفحات التفاصيل في مكان واحد.
// كل قسم صفحة مستقلة، والشريط بيتبني من هنا في كل صفحة عشان
// ما نكرّرش نفس القائمة في 5 ملفات ونسيب واحدة منهم ورا الباقي.

/** أقسام الرحلة */
export function tourNav(slug, active, {
    included = 0, activities = 0, days = 0, selected = 0,
} = {}) {
    return [
        { key: 'overview', label: 'نظرة عامة', href: `/tours/${slug}` },
        // البرنامج بعد نظرة عامة على طول — ده أهم قسم للمسافر
        days > 0 && { key: 'schedule', label: 'البرنامج', href: `/tours/${slug}/schedule` },
        included > 0 && { key: 'included', label: 'بيشمل إيه', href: `/tours/${slug}/included` },
        activities > 0 && {
            key: 'activities', label: 'فعاليات',
            href: `/tours/${slug}/activities`, badge: selected || null,
        },
        { key: 'reviews', label: 'التقييمات', href: `/tours/${slug}/reviews` },
    ].filter(Boolean).map((i) => ({ ...i, active: i.key === active }));
}

/** أقسام الفندق */
export function hotelNav(slug, active, { rooms = 0, selected = false } = {}) {
    return [
        { key: 'overview', label: 'نظرة عامة', href: `/hotels/${slug}` },
        rooms > 0 && {
            key: 'rooms', label: 'الغرف',
            href: `/hotels/${slug}/rooms`, badge: selected ? '✓' : null,
        },
        { key: 'amenities', label: 'المرافق', href: `/hotels/${slug}/amenities` },
        { key: 'reviews', label: 'التقييمات', href: `/hotels/${slug}/reviews` },
    ].filter(Boolean).map((i) => ({ ...i, active: i.key === active }));
}
