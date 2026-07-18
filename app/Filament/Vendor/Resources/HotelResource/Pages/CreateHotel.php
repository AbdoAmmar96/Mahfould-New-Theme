<?php

namespace App\Filament\Vendor\Resources\HotelResource\Pages;

use App\Filament\Vendor\Resources\HotelResource;
use Filament\Resources\Pages\CreateRecord;

class CreateHotel extends CreateRecord
{
    protected static string $resource = HotelResource::class;

    // نربط السجل بالبائع الحالي
    protected function mutateFormDataBeforeCreate(array $data): array
    {
        return HotelResource::ownerData($data);
    }
}
