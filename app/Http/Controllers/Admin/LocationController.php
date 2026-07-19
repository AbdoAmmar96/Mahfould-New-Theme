<?php

namespace App\Http\Controllers\Admin;

use App\Models\Location;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;

class LocationController extends CrudController
{
    protected string $model = Location::class;

    protected string $key = 'locations';

    protected string $label = 'الوجهات';

    protected string $singular = 'وجهة';

    protected string $icon = '📍';

    protected function searchable(): array
    {
        return ['name'];
    }

    protected function columns(): array
    {
        return [
            ['key' => 'image', 'label' => '', 'type' => 'image'],
            ['key' => 'name', 'label' => 'الاسم'],
            ['key' => 'parent.name', 'label' => 'تابعة لـ'],
            ['key' => 'is_featured', 'label' => 'مميّزة', 'type' => 'bool'],
            ['key' => 'order', 'label' => 'الترتيب'],
        ];
    }

    protected function with(): array
    {
        return ['parent:id,name'];
    }

    protected function formSections(): array
    {
        return [
            ['title' => 'بيانات الوجهة', 'fields' => [
                ['name' => 'name', 'label' => 'اسم الوجهة', 'type' => 'text', 'required' => true, 'full' => true],
                ['name' => 'parent_id', 'label' => 'تابعة لوجهة', 'type' => 'select', 'options' => self::parentOptions()],
                ['name' => 'order', 'label' => 'ترتيب العرض', 'type' => 'number'],
                ['name' => 'image', 'label' => 'رابط الصورة', 'type' => 'text', 'full' => true, 'placeholder' => 'https://...'],
                ['name' => 'description', 'label' => 'الوصف', 'type' => 'textarea', 'rows' => 3, 'full' => true],
                ['name' => 'is_featured', 'label' => 'وجهة مميّزة', 'type' => 'toggle'],
            ]],
        ];
    }

    protected function rules(Request $request, ?Model $record): array
    {
        return [
            'name' => ['required', 'string', 'max:120'],
            'parent_id' => ['nullable', 'exists:locations,id'],
            'order' => ['nullable', 'integer', 'min:0'],
            'image' => ['nullable', 'string', 'max:2048'],
            'description' => ['nullable', 'string'],
        ];
    }

    private static function parentOptions(): array
    {
        return Location::whereNull('parent_id')->orderBy('name')->get(['id', 'name'])
            ->map(fn ($l) => [$l->id, $l->name])->all();
    }
}
