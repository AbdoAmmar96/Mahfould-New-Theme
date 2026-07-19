<?php

namespace App\Http\Controllers\Admin;

use App\Models\Page;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class PageController extends CrudController
{
    protected string $model = Page::class;

    protected string $key = 'pages';

    protected string $label = 'الصفحات';

    protected string $singular = 'صفحة';

    protected string $icon = '📄';

    protected bool $hasImage = false;

    protected function searchable(): array
    {
        return ['title', 'slug'];
    }

    protected function columns(): array
    {
        return [
            ['key' => 'title', 'label' => 'العنوان', 'type' => 'strong'],
            ['key' => 'slug', 'label' => 'الرابط'],
            ['key' => 'is_published', 'label' => 'منشورة', 'type' => 'bool'],
            ['key' => 'order', 'label' => 'الترتيب'],
        ];
    }

    protected function formSections(): array
    {
        return [
            ['title' => 'محتوى الصفحة', 'fields' => [
                ['name' => 'title', 'label' => 'العنوان', 'type' => 'text', 'required' => true, 'full' => true],
                ['name' => 'slug', 'label' => 'الرابط (slug)', 'type' => 'text', 'placeholder' => 'terms'],
                ['name' => 'order', 'label' => 'ترتيب العرض', 'type' => 'number'],
                ['name' => 'excerpt', 'label' => 'وصف مختصر', 'type' => 'text', 'full' => true],
                ['name' => 'body', 'label' => 'المحتوى (HTML مسموح)', 'type' => 'textarea', 'rows' => 12, 'full' => true],
                ['name' => 'is_published', 'label' => 'منشورة', 'type' => 'toggle'],
            ]],
        ];
    }

    protected function rules(Request $request, ?Model $record): array
    {
        $id = $record?->id;

        return [
            'title' => ['required', 'string', 'max:160'],
            'slug' => ['nullable', 'string', 'max:160', Rule::unique('pages', 'slug')->ignore($id)],
            'order' => ['nullable', 'integer', 'min:0'],
            'excerpt' => ['nullable', 'string', 'max:255'],
            'body' => ['nullable', 'string'],
        ];
    }
}
