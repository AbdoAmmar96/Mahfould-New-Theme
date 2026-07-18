<?php

namespace App\Filament\Resources\SahbPackageResource\Pages;

use App\Filament\Resources\SahbPackageResource;
use Filament\Actions;
use Filament\Resources\Pages\ListRecords;

class ListSahbPackages extends ListRecords
{
    protected static string $resource = SahbPackageResource::class;

    protected function getHeaderActions(): array
    {
        return [Actions\CreateAction::make()];
    }
}
