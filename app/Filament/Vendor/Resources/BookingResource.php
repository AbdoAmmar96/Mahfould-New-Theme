<?php

namespace App\Filament\Vendor\Resources;

use App\Filament\Vendor\Resources\BookingResource\Pages;
use App\Models\Booking;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Auth;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;

class BookingResource extends Resource
{
    protected static ?string $model = Booking::class;
    protected static ?string $navigationIcon = 'heroicon-o-ticket';
    protected static ?string $navigationLabel = 'حجوزاتي';
    protected static ?string $modelLabel = 'حجز';
    protected static ?string $pluralModelLabel = 'الحجوزات';

    /** حجوزات خدمات البائع فقط */
    public static function getEloquentQuery(): Builder
    {
        $q = parent::getEloquentQuery();
        $user = Auth::user();

        if ($user && $user->role !== 'admin') {
            $q->whereHasMorph('bookable', ['App\Models\Tour', 'App\Models\Hotel', 'App\Models\Car', 'App\Models\Restaurant'],
                fn (Builder $qq) => $qq->where('user_id', $user->id));
        }

        return $q;
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('code')->label('رقم الحجز')->searchable()->weight('bold'),
                Tables\Columns\TextColumn::make('customer_name')->label('العميل')->searchable(),
                Tables\Columns\TextColumn::make('bookable.title')->label('الخدمة')->limit(30),
                Tables\Columns\TextColumn::make('total')->label('الإجمالي')->money('EGP')->sortable(),
                Tables\Columns\TextColumn::make('commission_amount')->label('عمولة المنصة')->money('EGP')->color('gray'),
                Tables\Columns\TextColumn::make('vendor_earnings')->label('صافيك')->money('EGP')->weight('bold')->color('success')
                    ->state(fn (Booking $r) => $r->vendor_earnings),
                Tables\Columns\TextColumn::make('status')->label('الحالة')->badge()
                    ->color(fn ($state) => match ($state) { 'confirmed', 'completed' => 'success', 'pending' => 'warning', 'cancelled' => 'danger', default => 'gray' })
                    ->formatStateUsing(fn ($state) => match ($state) { 'pending' => 'انتظار', 'confirmed' => 'مؤكّد', 'completed' => 'مكتمل', 'cancelled' => 'ملغي', default => $state }),
                Tables\Columns\TextColumn::make('created_at')->label('التاريخ')->dateTime('Y-m-d')->sortable(),
            ])
            ->defaultSort('created_at', 'desc')
            ->filters([
                Tables\Filters\SelectFilter::make('status')->label('الحالة')->options([
                    'pending' => 'انتظار', 'confirmed' => 'مؤكّد', 'completed' => 'مكتمل', 'cancelled' => 'ملغي',
                ]),
            ]);
    }

    public static function canCreate(): bool
    {
        return false; // البائع ميعملش حجوزات — بس يشوفها
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListBookings::route('/'),
        ];
    }
}
