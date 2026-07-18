<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;background:#FBF7F0;font-family:'Segoe UI',Tahoma,Arial,sans-serif;color:#303070">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FBF7F0;padding:28px 12px">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff;border:1px solid #EADFC9;border-radius:16px;overflow:hidden">

        <tr><td style="background:linear-gradient(135deg,#303070,#24245A);padding:26px 30px;text-align:center">
          <h1 style="margin:0;color:#fff;font-size:22px">محفول مكفول</h1>
          <p style="margin:6px 0 0;color:rgba(255,255,255,.7);font-size:13px">رحلتك محفولة مكفولة</p>
        </td></tr>

        <tr><td style="padding:30px">
          <div style="text-align:center;margin-bottom:22px">
            <div style="width:70px;height:70px;line-height:70px;border-radius:50%;background:#1E7A52;color:#fff;font-size:34px;display:inline-block">✓</div>
            <h2 style="margin:16px 0 4px;font-size:22px">تم تأكيد حجزك!</h2>
            <p style="margin:0;color:#8A7C6A;font-size:15px">أهلاً {{ $booking->customer_name }}، حجزك اتأكد بنجاح.</p>
          </div>

          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #EADFC9;border-radius:12px;overflow:hidden">
            <tr><td style="background:#303070;color:#fff;padding:14px 18px">
              <span style="font-size:12px;opacity:.7">رقم الحجز</span><br>
              <strong style="font-size:18px;letter-spacing:1px">{{ $booking->code }}</strong>
            </td></tr>
            @php $rows = [
              ['الباقة', $booking->bookable?->title ?? '—'],
              ['الموعد', optional($booking->start_date)->format('Y-m-d') ?: 'غير محدّد'],
              ['عدد الأفراد', $booking->guests . ' فرد'],
              ['طريقة الدفع', $booking->payment_method === 'on_arrival' ? 'عند الوصول' : 'مدفوع'],
              ['الإجمالي', number_format((float)$booking->total) . ' ج.م'],
            ]; @endphp
            @foreach($rows as [$label, $value])
              <tr>
                <td style="padding:12px 18px;color:#8A7C6A;font-size:14px;border-top:1px solid #F1EADF">{{ $label }}</td>
                <td style="padding:12px 18px;text-align:left;font-weight:700;font-size:14px;border-top:1px solid #F1EADF">{{ $value }}</td>
              </tr>
            @endforeach
          </table>

          <div style="text-align:center;margin-top:26px">
            <a href="{{ route('booking.confirmation', $booking->code) }}"
               style="display:inline-block;background:#F5764E;color:#fff;text-decoration:none;padding:13px 30px;border-radius:11px;font-weight:700;font-size:15px">عرض تفاصيل الحجز</a>
          </div>
        </td></tr>

        <tr><td style="background:#F1EADF;padding:18px 30px;text-align:center;color:#8A7C6A;font-size:12.5px">
          © {{ date('Y') }} محفول مكفول — صُنع في مصر 🇪🇬<br>
          لأي استفسار كلّمنا على الدعم.
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>
