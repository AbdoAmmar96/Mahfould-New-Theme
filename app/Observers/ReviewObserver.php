<?php

namespace App\Observers;

use App\Models\Company;
use App\Models\Review;
use App\Services\ProviderRatingService;

/**
 * Observer يعيد حساب تقييم المزوّد المُجمّع لما يحصل تغيير على أي review.
 * §13: تقييم المزوّد = متوسط تقييمات كل عملياته.
 */
class ReviewObserver
{
    public function __construct(private ProviderRatingService $ratings)
    {
    }

    public function saved(Review $review): void
    {
        $this->refreshFor($review);
    }

    public function deleted(Review $review): void
    {
        $this->refreshFor($review);
    }

    private function refreshFor(Review $review): void
    {
        // نجيب الخدمة اللي التقييم عليها ونشوف المزوّد بتاعها
        $serviceClass = $review->reviewable_type;
        if (!$serviceClass || !class_exists($serviceClass)) return;

        $service = $serviceClass::find($review->reviewable_id);
        if (!$service || !$service->provider_id) return;

        $provider = Company::find($service->provider_id);
        if ($provider) {
            $this->ratings->refresh($provider);
        }

        // كمان نحدّث review_score على الخدمة نفسها
        if (method_exists($service, 'refreshReviewScore')) {
            $service->refreshReviewScore();
        }
    }
}
