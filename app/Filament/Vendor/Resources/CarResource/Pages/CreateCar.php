<?php

namespace App\Filament\Vendor\Resources\CarResource\Pages;

use App\Filament\Vendor\Resources\CarResource;
use Filament\Resources\Pages\CreateRecord;

class CreateCar extends CreateRecord
{
    protected static string $resource = CarResource::class;

    // نربط السجل بالبائع الحالي
    protected function mutateFormDataBeforeCreate(array $data): array
    {
        return CarResource::ownerData($data);
    }
}
