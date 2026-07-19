<?php

namespace App\Http\Controllers\Admin;

use App\Models\Tour;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class TourController extends CrudController
{
    protected string $model = Tour::class;

    protected string $key = 'tours';

    protected string $label = 'الرحلات';

    protected string $singular = 'رحلة';

    protected string $icon = '🌍';

    protected function with(): array
    {
        return ['location:id,name'];
    }

    protected function columns(): array
    {
        return [
            ['key' => 'image', 'label' => '', 'type' => 'image'],
            ['key' => 'title', 'label' => 'العنوان'],
            ['key' => 'location.name', 'label' => 'الوجهة'],
            ['key' => 'price', 'label' => 'السعر', 'type' => 'money'],
            ['key' => 'is_guaranteed', 'label' => 'مكفول', 'type' => 'bool'],
            ['key' => 'is_featured', 'label' => 'مميّز', 'type' => 'bool'],
            ['key' => 'status', 'label' => 'الحالة', 'type' => 'badge'],
        ];
    }

    protected function filters(): array
    {
        return [
            ['name' => 'location_id', 'label' => 'الوجهة', 'options' => self::locationOptions()],
            ['name' => 'status', 'label' => 'الحالة', 'options' => self::STATUS_OPTIONS],
        ];
    }

    protected function formSections(): array
    {
        return [
            ['title' => 'البيانات الأساسية', 'fields' => [
                ['name' => 'title', 'label' => 'عنوان الرحلة', 'type' => 'text', 'required' => true, 'full' => true],
                ['name' => 'location_id', 'label' => 'الوجهة', 'type' => 'select', 'required' => true, 'options' => self::locationOptions()],
                ['name' => 'duration_days', 'label' => 'عدد الأيام', 'type' => 'number', 'required' => true],
                ['name' => 'price', 'label' => 'السعر', 'type' => 'number', 'required' => true, 'prefix' => 'ج.م'],
                ['name' => 'sale_price', 'label' => 'سعر العرض', 'type' => 'number', 'prefix' => 'ج.م'],
                ['name' => 'max_people', 'label' => 'أقصى عدد أفراد', 'type' => 'number'],
                ['name' => 'status', 'label' => 'الحالة', 'type' => 'select', 'options' => self::STATUS_OPTIONS],
            ]],
            ['title' => 'التفاصيل', 'fields' => [
                ['name' => 'short_desc', 'label' => 'وصف مختصر', 'type' => 'text', 'full' => true],
                ['name' => 'content', 'label' => 'الوصف الكامل', 'type' => 'textarea', 'rows' => 4, 'full' => true],
                ['name' => 'image', 'label' => 'رابط صورة الغلاف', 'type' => 'text', 'full' => true, 'placeholder' => 'https://...'],
                ['name' => 'included', 'label' => 'الرحلة تشمل', 'type' => 'tags', 'full' => true],
            ]],
            ['title' => 'خيارات', 'fields' => [
                ['name' => 'is_featured', 'label' => 'رحلة مميّزة (VIP)', 'type' => 'toggle'],
                ['name' => 'is_guaranteed', 'label' => 'مكفولة (ضمان المنصة)', 'type' => 'toggle'],
            ]],
        ];
    }

    protected function rules(Request $request, ?Model $record): array
    {
        return [
            'title' => ['required', 'string', 'max:160'],
            'location_id' => ['required', 'exists:locations,id'],
            'duration_days' => ['required', 'integer', 'min:1'],
            'price' => ['required', 'numeric', 'min:0'],
            'sale_price' => ['nullable', 'numeric', 'min:0'],
            'max_people' => ['nullable', 'integer', 'min:1'],
            'status' => ['required', Rule::in(['publish', 'draft', 'pending'])],
            'short_desc' => ['nullable', 'string', 'max:255'],
            'content' => ['nullable', 'string'],
            'image' => ['nullable', 'string', 'max:2048'],
            'included' => ['nullable', 'array'],
        ];
    }
}
