<?php

namespace App\Filament\Vendor\Resources\TourResource\Pages;

use App\Filament\Vendor\Resources\TourResource;
use Filament\Resources\Pages\CreateRecord;

class CreateTour extends CreateRecord
{
    protected static string $resource = TourResource::class;

    // نربط السجل بالبائع الحالي
    protected function mutateFormDataBeforeCreate(array $data): array
    {
        return TourResource::ownerData($data);
    }
}
