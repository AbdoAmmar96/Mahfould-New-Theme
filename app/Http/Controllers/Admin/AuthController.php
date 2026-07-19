<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

/**
 * تسجيل دخول مستقل للوحات التحكم (أدمن + بائع).
 * البانل بيتحدد من المسار (/admin أو /vendor).
 */
class AuthController extends Controller
{
    public function create(Request $request): Response
    {
        $panel = $request->is('vendor*') ? 'vendor' : 'admin';

        return Inertia::render('Admin/Login', [
            'panel' => $panel,
            'postUrl' => "/{$panel}/login",
            'title' => $panel === 'vendor' ? 'بوابة الشركاء' : 'لوحة التحكم',
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $panel = $request->is('vendor*') ? 'vendor' : 'admin';

        $credentials = $request->validate([
            'login' => ['required', 'string'],
            'password' => ['required', 'string'],
        ]);

        $field = filter_var($credentials['login'], FILTER_VALIDATE_EMAIL) ? 'email' : 'phone';

        if (! Auth::attempt([$field => $credentials['login'], 'password' => $credentials['password']], $request->boolean('remember'))) {
            return back()->withErrors(['login' => 'البيانات غير صحيحة، حاول تاني.'])->onlyInput('login');
        }

        $user = Auth::user();
        $allowed = $panel === 'admin' ? ['admin'] : ['vendor', 'admin'];

        if (! $user->is_active || ! in_array($user->role, $allowed, true)) {
            Auth::logout();

            return back()->withErrors(['login' => 'الحساب ده مش مصرّح له يدخل هنا.'])->onlyInput('login');
        }

        $request->session()->regenerate();

        return redirect()->intended("/{$panel}");
    }

    public function destroy(Request $request): RedirectResponse
    {
        $panel = $request->is('vendor*') ? 'vendor' : 'admin';

        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect("/{$panel}/login");
    }
}
