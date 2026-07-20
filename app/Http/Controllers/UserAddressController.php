<?php

namespace App\Http\Controllers;

use App\Models\UserAddress;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class UserAddressController extends Controller
{
    public function index(Request $request): Response
    {
        return Inertia::render('Account/Addresses', [
            'addresses' => $request->user()->addresses->map(fn ($a) => [
                'id' => $a->id,
                'label' => $a->label,
                'address' => $a->address,
                'city' => $a->city,
                'lat' => $a->lat ? (float) $a->lat : null,
                'lng' => $a->lng ? (float) $a->lng : null,
                'notes' => $a->notes,
                'is_default' => $a->is_default,
            ])->values(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $this->validated($request);
        $data['user_id'] = $request->user()->id;
        // لو أول عنوان → default تلقائياً
        if ($request->user()->addresses()->count() === 0) {
            $data['is_default'] = true;
        }
        UserAddress::create($data);

        return back()->with('success', 'اتضاف العنوان.');
    }

    public function update(Request $request, UserAddress $address): RedirectResponse
    {
        abort_if($address->user_id !== $request->user()->id, 403);
        $address->update($this->validated($request));

        return back()->with('success', 'اتحدّث العنوان.');
    }

    public function destroy(Request $request, UserAddress $address): RedirectResponse
    {
        abort_if($address->user_id !== $request->user()->id, 403);
        $address->delete();

        return back()->with('success', 'اتحذف العنوان.');
    }

    public function setDefault(Request $request, UserAddress $address): RedirectResponse
    {
        abort_if($address->user_id !== $request->user()->id, 403);
        $address->update(['is_default' => true]);

        return back()->with('success', 'اتحدّد العنوان الرئيسي.');
    }

    private function validated(Request $request): array
    {
        return $request->validate([
            'label' => ['required', 'string', 'max:40'],
            'address' => ['required', 'string', 'max:255'],
            'city' => ['nullable', 'string', 'max:120'],
            'lat' => ['nullable', 'numeric', 'between:-90,90'],
            'lng' => ['nullable', 'numeric', 'between:-180,180'],
            'notes' => ['nullable', 'string', 'max:200'],
            'is_default' => ['nullable', 'boolean'],
        ]);
    }
}
