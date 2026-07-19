<?php

namespace App\Http\Controllers\Vendor;

use App\Http\Controllers\Admin\CarController as AdminCarController;

class CarController extends AdminCarController
{
    use VendorScoped;

    protected string $panel = 'vendor';

    protected string $label = 'سياراتي';

    protected function columns(): array
    {
        return $this->vendorColumns('السيارة', 'سعر اليوم');
    }
}
