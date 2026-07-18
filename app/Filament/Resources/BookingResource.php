<?php

namespace App\Filament\Resources;

use App\Filament\Resources\BookingResource\Pages;
use App\Models\Booking;
use App\Services\Payments\PaymentManager;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Notifications\Notification;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;

class BookingResource extends Resource
{
    protected static ?string $model = Booking::class;
    protected static ?string $navigationIcon = 'heroicon-o-ticket';
    protected static ?string $navigationLabel = 'الحجوزات';
    protected static ?string $modelLabel = 'حجز';
    protected static ?string $pluralModelLabel = 'الحجوزات';
    protected static ?string $navigationGroup = 'المبيعات';

    public static function getNavigationBadge(): ?string
    {
        return (string) static::getModel()::where('status', 'pending')->count() ?: null;
    }

    public static function form(Form $form): Form
    {
        return $form->schema([
            Forms\Components\Section::make('بيانات الحجز')->columns(2)->schema([
                Forms\Components\TextInput::make('code')->label('رقم الحجز')->disabled(),
                Forms\Components\TextInput::make('customer_name')->label('اسم العميل')->required(),
                Forms\Components\TextInput::make('customer_phone')->label('الموبايل')->required(),
                Forms\Components\TextInput::make('customer_email')->label('الإيميل')->email(),
                Forms\Components\DatePicker::make('start_date')->label('تاريخ الرحلة'),
                Forms\Components\TextInput::make('guests')->label('عدد الأفراد')->numeric(),
            ]),
            Forms\Components\Section::make('الحالة والدفع')->columns(2)->schema([
                Forms\Components\Select::make('status')->label('الحالة')->options([
                    'pending' => 'في الانتظار', 'confirmed' => 'مؤكّد', 'processing' => 'قيد المعالجة',
                    'completed' => 'مكتمل', 'cancelled' => 'ملغي',
                ])->required(),
                Forms\Components\Select::make('payment_status')->label('حالة الدفع')->options([
                    'unpaid' => 'غير مدفوع', 'paid' => 'مدفوع', 'refunded' => 'مسترجع',
                ])->required(),
                Forms\Components\TextInput::make('total')->label('الإجمالي')->numeric()->prefix('ج.م')->disabled(),
            ]),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('code')->label('رقم الحجز')->searchable()->weight('bold'),
                Tables\Columns\TextColumn::make('customer_name')->label('العميل')->searchable(),
                Tables\Columns\TextColumn::make('customer_phone')->label('الموبايل'),
                Tables\Columns\TextColumn::make('bookable_type')->label('النوع')
                    ->formatStateUsing(fn ($state) => match (class_basename($state)) {
                        'Tour' => 'رحلة', 'Hotel' => 'فندق', 'Restaurant' => 'مطعم', 'SahbPackage' => 'صاحب السعادة', default => $state,
                    })->badge(),
                Tables\Columns\TextColumn::make('total')->label('الإجمالي')->money('EGP')->sortable(),
                Tables\Columns\TextColumn::make('status')->label('الحالة')->badge()
                    ->color(fn ($state) => match ($state) {
                        'confirmed', 'completed' => 'success', 'pending' => 'warning', 'cancelled' => 'danger', default => 'gray',
                    })
                    ->formatStateUsing(fn ($state) => match ($state) {
                        'pending' => 'في الانتظار', 'confirmed' => 'مؤكّد', 'processing' => 'معالجة', 'completed' => 'مكتمل', 'cancelled' => 'ملغي', default => $state,
                    }),
                Tables\Columns\TextColumn::make('payment_status')->label('الدفع')->badge()
                    ->color(fn ($state) => $state === 'paid' ? 'success' : ($state === 'refunded' ? 'gray' : 'warning')),
                Tables\Columns\TextColumn::make('created_at')->label('التاريخ')->dateTime('Y-m-d')->sortable(),
            ])
            ->defaultSort('created_at', 'desc')
            ->filters([
                Tables\Filters\SelectFilter::make('status')->label('الحالة')->options([
                    'pending' => 'في الانتظار', 'confirmed' => 'مؤكّد', 'completed' => 'مكتمل', 'cancelled' => 'ملغي',
                ]),
                Tables\Filters\SelectFilter::make('payment_status')->label('الدفع')->options([
                    'unpaid' => 'غير مدفوع', 'paid' => 'مدفوع', 'refunded' => 'مسترجع',
                ]),
            ])
            ->actions([
                Tables\Actions\EditAction::make(),
                Tables\Actions\Action::make('refund')
                    ->label('استرجاع')
                    ->icon('heroicon-o-arrow-uturn-left')
                    ->color('danger')
                    ->requiresConfirmation()
                    ->modalHeading('تأكيد الاسترجاع')
                    ->modalDescription(fn (Booking $record) => "هيتم استرجاع {$record->total} ج.م للعميل عبر {$record->payment_gateway}. متأكد؟")
                    ->visible(fn (Booking $record) => $record->payment_status === 'paid' && $record->payment_gateway)
                    ->action(function (Booking $record, PaymentManager $payments) {
                        $ok = $payments->refund($record);
                        if ($ok) {
                            $record->update(['payment_status' => 'refunded', 'status' => 'cancelled']);
                            Notification::make()->title('تم الاسترجاع بنجاح')->success()->send();
                        } else {
                            Notification::make()->title('فشل الاسترجاع')
                                ->body('راجع مفاتيح البوابة ومرجع الدفع.')->danger()->send();
                        }
                    }),
            ]);
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListBookings::route('/'),
            'edit'  => Pages\EditBooking::route('/{record}/edit'),
        ];
    }
}
