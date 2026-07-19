<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * يحمي لوحات التحكم: يتأكد إن المستخدم داخل، مفعّل، ودوره ضمن المسموح.
 * الاستخدام: ->middleware('role:admin')  أو  'role:vendor,admin'
 * لو مش داخل → يوجّهه لصفحة دخول اللوحة المناسبة. لو داخل بدور غلط → 403.
 */
class EnsureRole
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        // صفحة دخول اللوحة حسب المسار (/vendor أو /admin)
        $loginRoute = $request->is('vendor*') ? 'vendor.login' : 'admin.login';

        if (! $user) {
            return redirect()->guest(route($loginRoute));
        }

        if (! $user->is_active) {
            abort(403, 'الحساب موقوف.');
        }

        if (! in_array($user->role, $roles, true)) {
            abort(403, 'مش مصرّح لك تدخل هنا.');
        }

        return $next($request);
    }
}
