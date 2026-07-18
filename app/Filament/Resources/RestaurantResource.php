<?php

namespace App\Filament\Resources;

use App\Filament\Resources\RestaurantResource\Pages;
use App\Models\Restaurant;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;

class RestaurantResource extends Resource
{
    protected static ?string $model = Restaurant::class;
    protected static ?string $navigationIcon = 'heroicon-o-cake';
    protected static ?string $navigationLabel = 'المطاعم';
    protected static ?string $modelLabel = 'مطعم';
    protected static ?string $pluralModelLabel = 'المطاعم';
    protected static ?string $navigationGroup = 'المحتوى';

    public static function form(Form $form): Form
    {
        return $form->schema([
            Forms\Components\Section::make('البيانات الأساسية')->columns(2)->schema([
                Forms\Components\TextInput::make('title')->label('اسم المطعم')->required()->maxLength(160)->columnSpanFull(),
                Forms\Components\Select::make('location_id')->label('المدينة')
                    ->relationship('location', 'name')->searchable()->preload(),
                Forms\Components\TextInput::make('address')->label('العنوان')->maxLength(255),
                Forms\Components\Select::make('price_range')->label('الفئة السعرية')
                    ->options(['$' => '$', '$$' => '$$', '$$$' => '$$$', '$$$$' => '$$$$'])->default('$$'),
                Forms\Components\Select::make('status')->label('الحالة')
                    ->options(['publish' => 'منشور', 'draft' => 'مسودة', 'pending' => 'قيد المراجعة'])->default('publish'),
            ]),
            Forms\Components\Section::make('التفاصيل')->schema([
                Forms\Components\TagsInput::make('cuisines')->label('المطبخ')->placeholder('مصري، شرقي، آسيوي…'),
                Forms\Components\Textarea::make('content')->label('الوصف')->rows(3),
                Forms\Components\FileUpload::make('image')->label('الصورة الرئيسية')->image()->directory('restaurants'),
            ]),
            Forms\Components\Section::make('خيارات')->columns(2)->schema([
                Forms\Components\Toggle::make('instant_booking')->label('حجز فوري')->default(true),
                Forms\Components\Toggle::make('is_featured')->label('مميز'),
            ]),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\ImageColumn::make('image')->label(''),
                Tables\Columns\TextColumn::make('title')->label('الاسم')->searchable()->limit(40),
                Tables\Columns\TextColumn::make('address')->label('العنوان')->limit(30)->toggleable(),
                Tables\Columns\TextColumn::make('price_range')->label('الفئة')->badge(),
                Tables\Columns\IconColumn::make('instant_booking')->label('حجز فوري')->boolean(),
                Tables\Columns\TextColumn::make('review_score')->label('التقييم')
                    ->formatStateUsing(fn ($state) => '★ ' . number_format((float) $state, 1)),
                Tables\Columns\TextColumn::make('status')->label('الحالة')->badge()
                    ->color(fn ($state) => match ($state) { 'publish' => 'success', 'pending' => 'warning', default => 'gray' }),
            ])
            ->filters([
                Tables\Filters\SelectFilter::make('location')->relationship('location', 'name')->label('المدينة'),
                Tables\Filters\TernaryFilter::make('instant_booking')->label('حجز فوري'),
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
