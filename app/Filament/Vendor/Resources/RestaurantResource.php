<?php

namespace App\Filament\Vendor\Resources;

use App\Filament\Resources\RestaurantResource as AdminRestaurantResource;
use App\Filament\Vendor\Concerns\ScopedToVendor;
use App\Filament\Vendor\Resources\RestaurantResource\Pages;
use App\Models\Restaurant;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;

class RestaurantResource extends Resource
{
    use ScopedToVendor;

    protected static ?string $model = Restaurant::class;
    protected static ?string $navigationIcon = 'heroicon-o-cake';
    protected static ?string $navigationLabel = 'مطاعمي';
    protected static ?string $modelLabel = 'مطعم';
    protected static ?string $pluralModelLabel = 'مطاعمي';

    // نعيد استخدام فورم الأدمن نفسه
    public static function form(Form $form): Form
    {
        return AdminRestaurantResource::form($form);
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
            'index'  => Pages\ListRestaurants::route('/'),
            'create' => Pages\CreateRestaurant::route('/create'),
            'edit'   => Pages\EditRestaurant::route('/{record}/edit'),
        ];
    }
}
