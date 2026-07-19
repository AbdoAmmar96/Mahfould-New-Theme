<?php

namespace App\Http\Controllers\Admin;

use App\Models\SahbPackage;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;

class SahbPackageController extends CrudController
{
    protected string $model = SahbPackage::class;

    protected string $key = 'sahb';

    protected string $label = 'صاحب السعادة';

    protected string $singular = 'باكدج';

    protected string $icon = '🎁';

    protected function columns(): array
    {
        return [
            ['key' => 'image', 'label' => '', 'type' => 'image'],
            ['key' => 'title', 'label' => 'الباكدج'],
            ['key' => 'occasion', 'label' => 'المناسبة', 'type' => 'badge'],
            ['key' => 'price', 'label' => 'السعر', 'type' => 'money'],
            ['key' => 'badge', 'label' => 'شارة'],
            ['key' => 'order', 'label' => 'الترتيب'],
        ];
    }

    protected function formSections(): array
    {
        return [
            ['title' => 'بيانات الباكدج', 'fields' => [
                ['name' => 'title', 'label' => 'اسم الباكدج', 'type' => 'text', 'required' => true, 'full' => true],
                ['name' => 'occasion', 'label' => 'المناسبة', 'type' => 'text', 'placeholder' => 'عيد ميلاد / خطوبة / عيد جواز'],
                ['name' => 'price', 'label' => 'السعر', 'type' => 'number', 'prefix' => 'ج.م'],
                ['name' => 'price_from', 'label' => 'السعر "يبدأ من"', 'type' => 'toggle'],
                ['name' => 'badge', 'label' => 'شارة', 'type' => 'text', 'placeholder' => 'الأكثر طلباً / VIP / مكفول'],
                ['name' => 'order', 'label' => 'ترتيب العرض', 'type' => 'number'],
            ]],
            ['title' => 'التفاصيل', 'fields' => [
                ['name' => 'short_desc', 'label' => 'وصف مختصر', 'type' => 'text', 'full' => true],
                ['name' => 'content', 'label' => 'الوصف الكامل', 'type' => 'textarea', 'rows' => 3, 'full' => true],
                ['name' => 'image', 'label' => 'رابط صورة الغلاف', 'type' => 'text', 'full' => true, 'placeholder' => 'https://...'],
                ['name' => 'includes', 'label' => 'الباكدج يشمل', 'type' => 'tags', 'full' => true],
                ['name' => 'is_featured', 'label' => 'باكدج مميّز', 'type' => 'toggle'],
            ]],
        ];
    }

    protected function rules(Request $request, ?Model $record): array
    {
        return [
            'title' => ['required', 'string', 'max:160'],
            'occasion' => ['nullable', 'string', 'max:120'],
            'price' => ['nullable', 'numeric', 'min:0'],
            'badge' => ['nullable', 'string', 'max:60'],
            'order' => ['nullable', 'integer', 'min:0'],
            'short_desc' => ['nullable', 'string', 'max:255'],
            'content' => ['nullable', 'string'],
            'image' => ['nullable', 'string', 'max:2048'],
            'includes' => ['nullable', 'array'],
        ];
    }
}
