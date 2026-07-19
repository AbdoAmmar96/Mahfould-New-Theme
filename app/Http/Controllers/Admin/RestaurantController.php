<?php

namespace App\Http\Controllers\Admin;

use App\Models\Restaurant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class RestaurantController extends CrudController
{
    protected string $model = Restaurant::class;

    protected string $key = 'restaurants';

    protected string $label = 'المطاعم';

    protected string $singular = 'مطعم';

    protected string $icon = '🍽️';

    protected function with(): array
    {
        return ['location:id,name'];
    }

    protected function columns(): array
    {
        return [
            ['key' => 'image', 'label' => '', 'type' => 'image'],
            ['key' => 'title', 'label' => 'الاسم'],
            ['key' => 'address', 'label' => 'العنوان'],
            ['key' => 'price_range', 'label' => 'الفئة', 'type' => 'badge'],
            ['key' => 'instant_booking', 'label' => 'حجز فوري', 'type' => 'bool'],
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
                ['name' => 'title', 'label' => 'اسم المطعم', 'type' => 'text', 'required' => true, 'full' => true],
                ['name' => 'location_id', 'label' => 'الوجهة', 'type' => 'select', 'options' => self::locationOptions()],
                ['name' => 'address', 'label' => 'العنوان', 'type' => 'text'],
                ['name' => 'price_range', 'label' => 'فئة الأسعار', 'type' => 'select', 'options' => [['$', '$'], ['$$', '$$'], ['$$$', '$$$'], ['$$$$', '$$$$']]],
                ['name' => 'status', 'label' => 'الحالة', 'type' => 'select', 'options' => self::STATUS_OPTIONS],
            ]],
            ['title' => 'التفاصيل', 'fields' => [
                ['name' => 'cuisines', 'label' => 'أنواع المطبخ', 'type' => 'tags', 'full' => true],
                ['name' => 'content', 'label' => 'الوصف', 'type' => 'textarea', 'rows' => 3, 'full' => true],
                ['name' => 'image', 'label' => 'رابط صورة الغلاف', 'type' => 'text', 'full' => true, 'placeholder' => 'https://...'],
            ]],
            ['title' => 'خيارات', 'fields' => [
                ['name' => 'instant_booking', 'label' => 'يقبل حجز فوري', 'type' => 'toggle'],
                ['name' => 'is_featured', 'label' => 'مطعم مميّز (VIP)', 'type' => 'toggle'],
            ]],
        ];
    }

    protected function rules(Request $request, ?Model $record): array
    {
        return [
            'title' => ['required', 'string', 'max:160'],
            'location_id' => ['nullable', 'exists:locations,id'],
            'address' => ['nullable', 'string', 'max:255'],
            'price_range' => ['nullable', Rule::in(['$', '$$', '$$$', '$$$$'])],
            'status' => ['required', Rule::in(['publish', 'draft', 'pending'])],
            'cuisines' => ['nullable', 'array'],
            'content' => ['nullable', 'string'],
            'image' => ['nullable', 'string', 'max:2048'],
        ];
    }
}
