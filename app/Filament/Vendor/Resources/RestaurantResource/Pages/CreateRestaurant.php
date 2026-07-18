<?php

namespace App\Filament\Vendor\Resources\RestaurantResource\Pages;

use App\Filament\Vendor\Resources\RestaurantResource;
use Filament\Resources\Pages\CreateRecord;

class CreateRestaurant extends CreateRecord
{
    protected static string $resource = RestaurantResource::class;

    // نربط السجل بالبائع الحالي
    protected function mutateFormDataBeforeCreate(array $data): array
    {
        return RestaurantResource::ownerData($data);
    }
}
