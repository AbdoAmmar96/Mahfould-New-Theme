<?php

namespace App\Filament\Resources;

use App\Filament\Resources\SahbPackageResource\Pages;
use App\Models\SahbPackage;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;

class SahbPackageResource extends Resource
{
    protected static ?string $model = SahbPackage::class;
    protected static ?string $navigationIcon = 'heroicon-o-gift';
    protected static ?string $navigationLabel = 'صاحب السعادة';
    protected static ?string $modelLabel = 'باكدج';
    protected static ?string $pluralModelLabel = 'باكدجات صاحب السعادة';
    protected static ?string $navigationGroup = 'المحتوى';

    public static function form(Form $form): Form
    {
        return $form->schema([
            Forms\Components\TextInput::make('title')->label('اسم الباكدج')->required()->maxLength(160),
            Forms\Components\TextInput::make('occasion')->label('المناسبة')->placeholder('عيد ميلاد / خطوبة / عيد جواز'),
            Forms\Components\TextInput::make('price')->label('السعر')->numeric()->prefix('ج.م'),
            Forms\Components\Toggle::make('price_from')->label('يبدأ من (يظهر "من X ج.م")')->default(true),
            Forms\Components\TextInput::make('badge')->label('شارة')->placeholder('الأكثر طلباً / VIP / مكفول'),
            Forms\Components\TextInput::make('short_desc')->label('وصف مختصر')->maxLength(255)->columnSpanFull(),
            Forms\Components\Textarea::make('content')->label('التفاصيل')->rows(3)->columnSpanFull(),
            Forms\Components\FileUpload::make('image')->label('الصورة')->image()->directory('sahb'),
            Forms\Components\TagsInput::make('includes')->label('يشمل')->placeholder('أضف عنصر'),
            Forms\Components\TextInput::make('order')->label('الترتيب')->numeric()->default(0),
            Forms\Components\Toggle::make('is_featured')->label('مميز'),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\ImageColumn::make('image')->label(''),
                Tables\Columns\TextColumn::make('title')->label('الاسم')->searchable(),
                Tables\Columns\TextColumn::make('occasion')->label('المناسبة')->badge(),
                Tables\Columns\TextColumn::make('price')->label('السعر')->money('EGP'),
                Tables\Columns\TextColumn::make('badge')->label('الشارة'),
                Tables\Columns\TextColumn::make('order')->label('الترتيب')->sortable(),
            ])
            ->defaultSort('order')
            ->actions([Tables\Actions\EditAction::make(), Tables\Actions\DeleteAction::make()])
            ->bulkActions([Tables\Actions\DeleteBulkAction::make()]);
    }

    public static function getPages(): array
    {
        return [
            'index'  => Pages\ListSahbPackages::route('/'),
            'create' => Pages\CreateSahbPackage::route('/create'),
            'edit'   => Pages\EditSahbPackage::route('/{record}/edit'),
        ];
    }
}
