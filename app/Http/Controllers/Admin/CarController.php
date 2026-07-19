<?php

namespace App\Http\Controllers\Admin;

use App\Models\Car;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CarController extends CrudController
{
    protected string $model = Car::class;

    protected string $key = 'cars';

    protected string $label = 'السيارات';

    protected string $singular = 'سيارة';

    protected string $icon = '🚗';

    protected function with(): array
    {
        return ['location:id,name'];
    }

    protected function columns(): array
    {
        return [
            ['key' => 'image', 'label' => '', 'type' => 'image'],
            ['key' => 'title', 'label' => 'السيارة'],
            ['key' => 'location.name', 'label' => 'الوجهة'],
            ['key' => 'transmission', 'label' => 'ناقل الحركة', 'type' => 'badge'],
            ['key' => 'seats', 'label' => 'المقاعد'],
            ['key' => 'with_driver', 'label' => 'بسائق', 'type' => 'bool'],
            ['key' => 'price', 'label' => 'سعر اليوم', 'type' => 'money'],
            ['key' => 'status', 'label' => 'الحالة', 'type' => 'badge'],
        ];
    }

    protected function filters(): array
    {
        return [
            ['name' => 'transmission', 'label' => 'ناقل الحركة', 'options' => [['automatic', 'أوتوماتيك'], ['manual', 'مانيوال']]],
            ['name' => 'status', 'label' => 'الحالة', 'options' => self::STATUS_OPTIONS],
        ];
    }

    protected function formSections(): array
    {
        return [
            ['title' => 'البيانات الأساسية', 'fields' => [
                ['name' => 'title', 'label' => 'اسم السيارة', 'type' => 'text', 'required' => true, 'full' => true, 'placeholder' => 'هيونداي إلنترا 2023'],
                ['name' => 'brand', 'label' => 'الماركة', 'type' => 'text'],
                ['name' => 'location_id', 'label' => 'الوجهة', 'type' => 'select', 'options' => self::locationOptions()],
                ['name' => 'price', 'label' => 'سعر اليوم', 'type' => 'number', 'required' => true, 'prefix' => 'ج.م'],
                ['name' => 'sale_price', 'label' => 'سعر العرض', 'type' => 'number', 'prefix' => 'ج.م'],
            ]],
            ['title' => 'المواصفات', 'fields' => [
                ['name' => 'transmission', 'label' => 'ناقل الحركة', 'type' => 'select', 'options' => [['automatic', 'أوتوماتيك'], ['manual', 'مانيوال']]],
                ['name' => 'seats', 'label' => 'عدد المقاعد', 'type' => 'number'],
                ['name' => 'status', 'label' => 'الحالة', 'type' => 'select', 'options' => self::STATUS_OPTIONS],
                ['name' => 'content', 'label' => 'الوصف', 'type' => 'textarea', 'rows' => 3, 'full' => true],
                ['name' => 'image', 'label' => 'رابط صورة الغلاف', 'type' => 'text', 'full' => true, 'placeholder' => 'https://...'],
            ]],
            ['title' => 'خيارات', 'fields' => [
                ['name' => 'with_driver', 'label' => 'متاحة بسائق', 'type' => 'toggle'],
                ['name' => 'is_featured', 'label' => 'مميّزة (VIP)', 'type' => 'toggle'],
                ['name' => 'is_guaranteed', 'label' => 'مكفولة (ضمان المنصة)', 'type' => 'toggle'],
            ]],
        ];
    }

    protected function rules(Request $request, ?Model $record): array
    {
        return [
            'title' => ['required', 'string', 'max:160'],
            'brand' => ['nullable', 'string', 'max:120'],
            'location_id' => ['nullable', 'exists:locations,id'],
            'price' => ['required', 'numeric', 'min:0'],
            'sale_price' => ['nullable', 'numeric', 'min:0'],
            'transmission' => ['nullable', Rule::in(['automatic', 'manual'])],
            'seats' => ['nullable', 'integer', 'min:1'],
            'status' => ['required', Rule::in(['publish', 'draft', 'pending'])],
            'content' => ['nullable', 'string'],
            'image' => ['nullable', 'string', 'max:2048'],
        ];
    }
}
