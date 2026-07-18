<?php

namespace App\Filament\Resources;

use App\Filament\Resources\TourResource\Pages;
use App\Models\Tour;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;

class TourResource extends Resource
{
    protected static ?string $model = Tour::class;
    protected static ?string $navigationIcon = 'heroicon-o-globe-alt';
    protected static ?string $navigationLabel = 'الرحلات';
    protected static ?string $modelLabel = 'رحلة';
    protected static ?string $pluralModelLabel = 'الرحلات';
    protected static ?string $navigationGroup = 'المحتوى';

    public static function form(Form $form): Form
    {
        return $form->schema([
            Forms\Components\Section::make('البيانات الأساسية')->columns(2)->schema([
                Forms\Components\TextInput::make('title')->label('عنوان الرحلة')->required()->maxLength(160)->columnSpanFull(),
                Forms\Components\Select::make('location_id')->label('الوجهة')
                    ->relationship('location', 'name')->searchable()->preload()->required(),
                Forms\Components\TextInput::make('duration_days')->label('عدد الأيام')->numeric()->default(1)->required(),
                Forms\Components\TextInput::make('price')->label('السعر')->numeric()->prefix('ج.م')->required(),
                Forms\Components\TextInput::make('sale_price')->label('سعر العرض')->numeric()->prefix('ج.م'),
                Forms\Components\TextInput::make('max_people')->label('أقصى عدد أفراد')->numeric()->default(10),
                Forms\Components\Select::make('status')->label('الحالة')
                    ->options(['publish' => 'منشور', 'draft' => 'مسودة', 'pending' => 'قيد المراجعة'])->default('publish'),
            ]),
            Forms\Components\Section::make('التفاصيل')->schema([
                Forms\Components\TextInput::make('short_desc')->label('وصف مختصر')->maxLength(255),
                Forms\Components\Textarea::make('content')->label('الوصف الكامل')->rows(4),
                Forms\Components\FileUpload::make('image')->label('الصورة الرئيسية')->image()->directory('tours'),
                Forms\Components\TagsInput::make('included')->label('الرحلة تشمل')->placeholder('أضف عنصر'),
            ]),
            Forms\Components\Section::make('خيارات')->columns(2)->schema([
                Forms\Components\Toggle::make('is_featured')->label('مميزة (بالرئيسية)'),
                Forms\Components\Toggle::make('is_guaranteed')->label('مكفولة')->default(true),
            ]),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\ImageColumn::make('image')->label(''),
                Tables\Columns\TextColumn::make('title')->label('العنوان')->searchable()->limit(40),
                Tables\Columns\TextColumn::make('location.name')->label('الوجهة')->sortable(),
                Tables\Columns\TextColumn::make('price')->label('السعر')->money('EGP')->sortable(),
                Tables\Columns\IconColumn::make('is_guaranteed')->label('مكفول')->boolean(),
                Tables\Columns\IconColumn::make('is_featured')->label('مميز')->boolean(),
                Tables\Columns\TextColumn::make('status')->label('الحالة')->badge()
                    ->color(fn ($state) => match ($state) { 'publish' => 'success', 'pending' => 'warning', default => 'gray' }),
            ])
            ->filters([
                Tables\Filters\SelectFilter::make('location')->relationship('location', 'name')->label('الوجهة'),
                Tables\Filters\TernaryFilter::make('is_featured')->label('مميزة'),
            ])
            ->actions([Tables\Actions\EditAction::make(), Tables\Actions\DeleteAction::make()])
            ->bulkActions([Tables\Actions\DeleteBulkAction::make()]);
    }

    public static function getPages(): array
    {
        return [
            'index'  => Pages\ListTours::route('/'),
            'create' => Pages\CreateTour::route('/create'),
            'edit'   => Pages\EditTour::route('/{record}/edit'),
        ];
    }
}
