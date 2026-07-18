<?php

namespace App\Http\Controllers;

use App\Models\Review;
use App\Support\Bookables;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ReviewController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'type'    => ['required', Rule::in(Bookables::types())],
            'id'      => ['required', 'integer'],
            'rating'  => ['required', 'integer', 'min:1', 'max:5'],
            'title'   => ['nullable', 'string', 'max:120'],
            'content' => ['required', 'string', 'max:1000'],
        ]);

        $model = Bookables::resolve($data['type'], $data['id']);
        abort_unless($model !== null, 404);

        Review::create([
            'user_id'         => $request->user()->id,
            'reviewable_type' => $model::class,
            'reviewable_id'   => $model->getKey(),
            'rating'          => $data['rating'],
            'title'           => $data['title'] ?? null,
            'content'         => $data['content'],
            'approved'        => true, // auto-approve (تقدر تخليها false للمراجعة)
        ]);

        // نحدّث متوسط التقييم على الخدمة
        if (method_exists($model, 'refreshReviewScore')) {
            $model->refreshReviewScore();
        }

        return back()->with('success', 'تم إضافة تقييمك — شكراً!');
    }
}
