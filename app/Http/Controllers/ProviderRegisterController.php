<?php

namespace App\Http\Controllers;

use App\Models\Company;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

/**
 * تسجيل المزوّدين (شركة أو فرد) — V2-BLUEPRINT §1.1.
 *
 * صفحة تسجيل منفصلة تماماً عن تسجيل العملاء.
 * عند التسجيل:
 *   1) يُنشأ user (role=vendor) + company (verification_status=pending)
 *   2) يدخل المزوّد لوحته (/vendor) لكن خدماته لا تنشر إلا بعد موافقة الأدمن.
 *   3) الأفراد يجب رفع "فيش وتشبيه" قبل الموافقة.
 */
class ProviderRegisterController extends Controller
{
    public function create(): Response
    {
        return Inertia::render('Provider/Register');
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'provider_type' => ['required', Rule::in(['company', 'individual'])],
            // بيانات صاحب الحساب (user)
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:120', 'unique:users,email'],
            'phone' => ['required', 'string', 'max:20'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
            // بيانات الكيان (company)
            'business_name' => ['required', 'string', 'max:200'],
            'about' => ['nullable', 'string', 'max:2000'],
            // للأفراد
            'national_id' => ['required_if:provider_type,individual', 'nullable', 'string', 'max:20'],
            // للشركات
            'license_no' => ['nullable', 'string', 'max:60'],
            'license_authority' => ['nullable', 'string', 'max:120'],
            'terms_accepted' => ['accepted'],
        ]);

        [$user, $company] = DB::transaction(function () use ($data) {
            $user = User::create([
                'name' => $data['name'],
                'email' => $data['email'],
                'phone' => $data['phone'],
                'password' => Hash::make($data['password']),
                'role' => User::ROLE_VENDOR,
                'is_active' => true,
            ]);

            $company = Company::create([
                'user_id' => $user->id,
                'provider_type' => $data['provider_type'],
                'name' => $data['business_name'],
                'phone' => $data['phone'],
                'email' => $data['email'],
                'about' => $data['about'] ?? null,
                'national_id' => $data['national_id'] ?? null,
                'license_no' => $data['license_no'] ?? null,
                'license_authority' => $data['license_authority'] ?? null,
                'verification_status' => 'pending', // يحتاج موافقة الأدمن قبل النشر
                'is_first_party' => false,
            ]);

            return [$user, $company];
        });

        Auth::login($user);

        return redirect('/vendor')
            ->with('success', 'تم إنشاء حسابك — بوابتك جاهزة لتجهيز الخدمات. النشر يتم بعد موافقة الأدمن.');
    }
}
