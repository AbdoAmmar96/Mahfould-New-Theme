<?php

namespace App\Filament\Resources;

use App\Filament\Resources\CarResource\Pages;
use App\Models\Car;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;

class CarResource extends Resource
{
    protected static ?string $model = Car::class;
    protected static ?string $navigationIcon = 'heroicon-o-truck';
    protected static ?string $navigationLabel = 'السيارات';
    protected static ?string $modelLabel = 'سيارة';
    protected static ?string $pluralModelLabel = 'السيارات';
    protected static ?string $navigationGroup = 'المحتوى';

    public static function form(Form $form): Form
    {
        return $form->schema([
            Forms\Components\Section::make('البيانات الأساسية')->columns(2)->schema([
                Forms\Components\TextInput::make('title')->label('اسم السيارة')->placeholder('هيونداي إلنترا 2023')->required()->maxLength(160)->columnSpanFull(),
                Forms\Components\TextInput::make('brand')->label('الماركة'),
                Forms\Components\Select::make('location_id')->label('المدينة')
                    ->relationship('location', 'name')->searchable()->preload(),
                Forms\Components\TextInput::make('price')->label('سعر اليوم')->numeric()->prefix('ج.م')->required(),
                Forms\Components\TextInput::make('sale_price')->label('سعر العرض')->numeric()->prefix('ج.م'),
                Forms\Components\Select::make('transmission')->label('ناقل الحركة')
                    ->options(['automatic' => 'أوتوماتيك', 'manual' => 'مانيوال'])->default('automatic'),
                Forms\Components\TextInput::make('seats')->label('عدد الركاب')->numeric()->default(5),
                Forms\Components\Select::make('status')->label('الحالة')
                    ->options(['publish' => 'منشور', 'draft' => 'مسودة', 'pending' => 'قيد المراجعة'])->default('publish'),
            ]),
            Forms\Components\Section::make('التفاصيل')->schema([
                Forms\Components\Textarea::make('content')->label('الوصف')->rows(3),
                Forms\Components\FileUpload::make('image')->label('الصورة الرئيسية')->image()->directory('cars'),
            ]),
            Forms\Components\Section::make('خيارات')->columns(3)->schema([
                Forms\Components\Toggle::make('with_driver')->label('مع سائق'),
                Forms\Components\Toggle::make('is_featured')->label('مميزة'),
                Forms\Components\Toggle::make('is_guaranteed')->label('مكفولة')->default(true),
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
                Tables\Columns\TextColumn::make('transmission')->label('الناقل')->badge()
                    ->formatStateUsing(fn ($state) => $state === 'automatic' ? 'أوتوماتيك' : 'مانيوال'),
                Tables\Columns\TextColumn::make('seats')->label('ركاب'),
                Tables\Columns\IconColumn::make('with_driver')->label('بسائق')->boolean(),
                Tables\Columns\TextColumn::make('price')->label('سعر اليوم')->money('EGP')->sortable(),
                Tables\Columns\TextColumn::make('status')->label('الحالة')->badge()
                    ->color(fn ($state) => match ($state) { 'publish' => 'success', 'pending' => 'warning', default => 'gray' }),
            ])
            ->filters([
                Tables\Filters\SelectFilter::make('transmission')->label('الناقل')
                    ->options(['automatic' => 'أوتوماتيك', 'manual' => 'مانيوال']),
                Tables\Filters\TernaryFilter::make('with_driver')->label('بسائق'),
            ])
            ->actions([Tables\Actions\EditAction::make(), Tables\Actions\DeleteAction::make()])
            ->bulkActions([Tables\Actions\DeleteBulkAction::make()]);
    }

    public static function getPages(): array
    {
        return [
            'index'  => Pages\ListCars::route('/'),
            'create' => Pages\CreateCar::route('/create'),
            'edit'   => Pages\EditCar::route('/{record}/edit'),
        ];
    }
}
