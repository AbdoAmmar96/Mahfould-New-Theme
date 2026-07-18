<?php

namespace App\Filament\Vendor\Resources;

use App\Filament\Resources\HotelResource as AdminHotelResource;
use App\Filament\Vendor\Concerns\ScopedToVendor;
use App\Filament\Vendor\Resources\HotelResource\Pages;
use App\Models\Hotel;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;

class HotelResource extends Resource
{
    use ScopedToVendor;

    protected static ?string $model = Hotel::class;
    protected static ?string $navigationIcon = 'heroicon-o-building-office-2';
    protected static ?string $navigationLabel = 'فنادقي';
    protected static ?string $modelLabel = 'فندق';
    protected static ?string $pluralModelLabel = 'فنادقي';

    // نعيد استخدام فورم الأدمن نفسه
    public static function form(Form $form): Form
    {
        return AdminHotelResource::form($form);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\ImageColumn::make('image')->label(''),
                Tables\Columns\TextColumn::make('title')->label('العنوان')->searchable()->limit(40),
                Tables\Columns\TextColumn::make('price')->label('السعر')->money('EGP')->sortable(),
                Tables\Columns\TextColumn::make('bookings_count')->label('الحجوزات')->counts('bookings'),
                Tables\Columns\TextColumn::make('status')->label('الحالة')->badge()
                    ->color(fn ($state) => match ($state) { 'publish' => 'success', 'pending' => 'warning', default => 'gray' })
                    ->formatStateUsing(fn ($state) => match ($state) { 'publish' => 'منشور', 'pending' => 'مراجعة', default => 'مسودة' }),
            ])
            ->actions([Tables\Actions\EditAction::make(), Tables\Actions\DeleteAction::make()])
            ->bulkActions([Tables\Actions\DeleteBulkAction::make()]);
    }

    public static function getPages(): array
    {
        return [
            'index'  => Pages\ListHotels::route('/'),
            'create' => Pages\CreateHotel::route('/create'),
            'edit'   => Pages\EditHotel::route('/{record}/edit'),
        ];
    }
}
