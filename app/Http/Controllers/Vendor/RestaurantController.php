<?php

namespace App\Http\Controllers\Vendor;

use App\Http\Controllers\Admin\RestaurantController as AdminRestaurantController;

class RestaurantController extends AdminRestaurantController
{
    use VendorScoped;

    protected string $panel = 'vendor';

    protected string $label = 'مطاعمي';

    protected function columns(): array
    {
        return [
            ['key' => 'image', 'label' => '', 'type' => 'image'],
            ['key' => 'title', 'label' => 'المطعم'],
            ['key' => 'price_range', 'label' => 'الفئة', 'type' => 'badge'],
            ['key' => 'bookings_count', 'label' => 'الحجوزات'],
            ['key' => 'status', 'label' => 'الحالة', 'type' => 'badge'],
        ];
    }
}
