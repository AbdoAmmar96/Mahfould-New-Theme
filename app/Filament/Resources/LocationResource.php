<?php

namespace App\Filament\Resources;

use App\Filament\Resources\LocationResource\Pages;
use App\Models\Location;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;

class LocationResource extends Resource
{
    protected static ?string $model = Location::class;
    protected static ?string $navigationIcon = 'heroicon-o-map-pin';
    protected static ?string $navigationLabel = 'الوجهات';
    protected static ?string $modelLabel = 'وجهة';
    protected static ?string $pluralModelLabel = 'الوجهات';
    protected static ?string $navigationGroup = 'المحتوى';

    public static function form(Form $form): Form
    {
        return $form->schema([
            Forms\Components\TextInput::make('name')->label('الاسم')->required()->maxLength(120),
            Forms\Components\Select::make('parent_id')->label('تابع لـ')
                ->relationship('parent', 'name')->searchable()->preload(),
            Forms\Components\FileUpload::make('image')->label('الصورة')->image()->directory('locations'),
            Forms\Components\Textarea::make('description')->label('الوصف')->rows(3),
            Forms\Components\Toggle::make('is_featured')->label('مميزة (تظهر بالرئيسية)'),
            Forms\Components\TextInput::make('order')->label('الترتيب')->numeric()->default(0),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\ImageColumn::make('image')->label('')->circular(),
                Tables\Columns\TextColumn::make('name')->label('الاسم')->searchable()->sortable(),
                Tables\Columns\TextColumn::make('tours_count')->label('الرحلات')->counts('tours'),
                Tables\Columns\IconColumn::make('is_featured')->label('مميزة')->boolean(),
                Tables\Columns\TextColumn::make('order')->label('الترتيب')->sortable(),
            ])
            ->defaultSort('order')
            ->actions([Tables\Actions\EditAction::make(), Tables\Actions\DeleteAction::make()])
            ->bulkActions([Tables\Actions\DeleteBulkAction::make()]);
    }

    public static function getPages(): array
    {
        return [
            'index'  => Pages\ListLocations::route('/'),
            'create' => Pages\CreateLocation::route('/create'),
            'edit'   => Pages\EditLocation::route('/{record}/edit'),
        ];
    }
}
