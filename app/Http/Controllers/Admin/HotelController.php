<?php

namespace App\Http\Controllers\Admin;

use App\Models\Hotel;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class HotelController extends CrudController
{
    protected string $model = Hotel::class;

    protected string $key = 'hotels';

    protected string $label = 'الفنادق';

    protected string $singular = 'فندق';

    protected string $icon = '🏨';

    protected function with(): array
    {
        return ['location:id,name'];
    }

    protected function columns(): array
    {
        return [
            ['key' => 'image', 'label' => '', 'type' => 'image'],
            ['key' => 'title', 'label' => 'الاسم'],
            ['key' => 'location.name', 'label' => 'الوجهة'],
            ['key' => 'star_rating', 'label' => 'التصنيف', 'type' => 'stars'],
            ['key' => 'price', 'label' => 'سعر الليلة', 'type' => 'money'],
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
                ['name' => 'title', 'label' => 'اسم الفندق', 'type' => 'text', 'required' => true, 'full' => true],
                ['name' => 'location_id', 'label' => 'الوجهة', 'type' => 'select', 'required' => true, 'options' => self::locationOptions()],
                ['name' => 'star_rating', 'label' => 'تصنيف النجوم', 'type' => 'select', 'options' => [[3, '⭐⭐⭐'], [4, '⭐⭐⭐⭐'], [5, '⭐⭐⭐⭐⭐']]],
                ['name' => 'price', 'label' => 'سعر الليلة', 'type' => 'number', 'required' => true, 'prefix' => 'ج.م'],
                ['name' => 'sale_price', 'label' => 'سعر العرض', 'type' => 'number', 'prefix' => 'ج.م'],
                ['name' => 'status', 'label' => 'الحالة', 'type' => 'select', 'options' => self::STATUS_OPTIONS],
            ]],
            ['title' => 'التفاصيل', 'fields' => [
                ['name' => 'short_desc', 'label' => 'وصف مختصر', 'type' => 'text', 'full' => true],
                ['name' => 'content', 'label' => 'الوصف الكامل', 'type' => 'textarea', 'rows' => 4, 'full' => true],
                ['name' => 'image', 'label' => 'رابط صورة الغلاف', 'type' => 'text', 'full' => true, 'placeholder' => 'https://...'],
            ]],
            ['title' => 'خيارات', 'fields' => [
                ['name' => 'is_featured', 'label' => 'فندق مميّز (VIP)', 'type' => 'toggle'],
                ['name' => 'is_guaranteed', 'label' => 'مكفول (ضمان المنصة)', 'type' => 'toggle'],
            ]],
        ];
    }

    protected function rules(Request $request, ?Model $record): array
    {
        return [
            'title' => ['required', 'string', 'max:160'],
            'location_id' => ['required', 'exists:locations,id'],
            'star_rating' => ['nullable', Rule::in([3, 4, 5])],
            'price' => ['required', 'numeric', 'min:0'],
            'sale_price' => ['nullable', 'numeric', 'min:0'],
            'status' => ['required', Rule::in(['publish', 'draft', 'pending'])],
            'short_desc' => ['nullable', 'string', 'max:255'],
            'content' => ['nullable', 'string'],
            'image' => ['nullable', 'string', 'max:2048'],
        ];
    }
}
