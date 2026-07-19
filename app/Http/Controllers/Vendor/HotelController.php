<?php

namespace App\Http\Controllers\Vendor;

use App\Http\Controllers\Admin\HotelController as AdminHotelController;

class HotelController extends AdminHotelController
{
    use VendorScoped;

    protected string $panel = 'vendor';

    protected string $label = 'فنادقي';

    protected function columns(): array
    {
        return $this->vendorColumns('الفندق', 'سعر الليلة');
    }
}
