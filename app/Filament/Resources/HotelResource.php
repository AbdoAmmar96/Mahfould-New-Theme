<?php

namespace App\Filament\Resources;

use App\Filament\Resources\HotelResource\Pages;
use App\Models\Hotel;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;

class HotelResource extends Resource
{
    protected static ?string $model = Hotel::class;
    protected static ?string $navigationIcon = 'heroicon-o-building-office-2';
    protected static ?string $navigationLabel = 'الفنادق';
    protected static ?string $modelLabel = 'فندق';
    protected static ?string $pluralModelLabel = 'الفنادق';
    protected static ?string $navigationGroup = 'المحتوى';

    public static function form(Form $form): Form
    {
        return $form->schema([
            Forms\Components\Section::make('البيانات الأساسية')->columns(2)->schema([
                Forms\Components\TextInput::make('title')->label('اسم الفندق')->required()->maxLength(160)->columnSpanFull(),
                Forms\Components\Select::make('location_id')->label('المدينة')
                    ->relationship('location', 'name')->searchable()->preload()->required(),
                Forms\Components\Select::make('star_rating')->label('التصنيف')
                    ->options([3 => '⭐⭐⭐', 4 => '⭐⭐⭐⭐', 5 => '⭐⭐⭐⭐⭐'])->default(5),
                Forms\Components\TextInput::make('price')->label('سعر الليلة')->numeric()->prefix('ج.م')->required(),
                Forms\Components\TextInput::make('sale_price')->label('سعر العرض')->numeric()->prefix('ج.م'),
                Forms\Components\Select::make('status')->label('الحالة')
                    ->options(['publish' => 'منشور', 'draft' => 'مسودة', 'pending' => 'قيد المراجعة'])->default('publish'),
            ]),
            Forms\Components\Section::make('التفاصيل')->schema([
                Forms\Components\TextInput::make('short_desc')->label('وصف مختصر')->maxLength(255),
                Forms\Components\Textarea::make('content')->label('الوصف الكامل')->rows(4),
                Forms\Components\FileUpload::make('image')->label('الصورة الرئيسية')->image()->directory('hotels'),
            ]),
            Forms\Components\Section::make('خيارات')->columns(2)->schema([
                Forms\Components\Toggle::make('is_featured')->label('مميز (بالرئيسية)'),
                Forms\Components\Toggle::make('is_guaranteed')->label('مكفول')->default(true),
            ]),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\ImageColumn::make('image')->label(''),
                Tables\Columns\TextColumn::make('title')->label('الاسم')->searchable()->limit(40),
                Tables\Columns\TextColumn::make('location.name')->label('المدينة')->sortable(),
                Tables\Columns\TextColumn::make('star_rating')->label('التصنيف')
                    ->formatStateUsing(fn ($state) => str_repeat('⭐', (int) $state)),
                Tables\Columns\TextColumn::make('price')->label('سعر الليلة')->money('EGP')->sortable(),
                Tables\Columns\IconColumn::make('is_featured')->label('مميز')->boolean(),
                Tables\Columns\TextColumn::make('status')->label('الحالة')->badge()
                    ->color(fn ($state) => match ($state) { 'publish' => 'success', 'pending' => 'warning', default => 'gray' }),
            ])
            ->filters([
                Tables\Filters\SelectFilter::make('location')->relationship('location', 'name')->label('المدينة'),
                Tables\Filters\TernaryFilter::make('is_featured')->label('مميز'),
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
