<?php

namespace App\Http\Controllers\Vendor;

use App\Http\Controllers\Admin\TourController as AdminTourController;

class TourController extends AdminTourController
{
    use VendorScoped;

    protected string $panel = 'vendor';

    protected string $label = 'رحلاتي';

    protected function columns(): array
    {
        return $this->vendorColumns('الرحلة');
    }
}
