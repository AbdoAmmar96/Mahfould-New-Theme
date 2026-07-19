<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Location;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * كنترولر CRUD عام معتمد على المخطط (schema-driven).
 * كل مورد بيورّث ده ويصرّح بالأعمدة + حقول الفورم + قواعد التحقق فقط.
 * الواجهة صفحتين React عامتين: Admin/Crud/Index و Admin/Crud/Form.
 */
abstract class CrudController extends Controller
{
    /** موديل المورد (FQCN) */
    protected string $model;

    /** مفتاح المسار/الرابط: tours, hotels... */
    protected string $key;

    /** اسم اللوحة: admin | vendor */
    protected string $panel = 'admin';

    /** التسمية بالجمع والمفرد */
    protected string $label;

    protected string $singular;

    /** أيقونة (emoji بسيط للقائمة الجانبية) */
    protected string $icon = '•';

    protected bool $canCreate = true;

    protected bool $canEdit = true;

    protected bool $canDelete = true;

    protected bool $hasImage = true;

    /** خيارات حالة المحتوى الموحّدة */
    public const STATUS_OPTIONS = [
        ['publish', 'منشور'],
        ['draft', 'مسودة'],
        ['pending', 'قيد المراجعة'],
    ];

    /** قائمة الوجهات كخيارات [[id, name]] */
    protected static function locationOptions(): array
    {
        return Location::orderBy('name')->get(['id', 'name'])
            ->map(fn ($l) => [$l->id, $l->name])->all();
    }

    /** أعمدة الجدول */
    abstract protected function columns(): array;

    /** أقسام الفورم (title + fields) */
    abstract protected function formSections(): array;

    /** قواعد التحقق */
    abstract protected function rules(Request $request, ?Model $record): array;

    /** فلاتر الجدول [['name'=>, 'label'=>, 'options'=>[[val,label]]]] */
    protected function filters(): array
    {
        return [];
    }

    /** أعمدة البحث النصي */
    protected function searchable(): array
    {
        return ['title'];
    }

    /** علاقات تُحمّل مسبقاً */
    protected function with(): array
    {
        return [];
    }

    /** نطاق الاستعلام (البائع بيقصره على بياناته) */
    protected function scope(Builder $query): Builder
    {
        return $query;
    }

    /** تعديل البيانات قبل الحفظ (البائع بيربط user_id) */
    protected function beforeSave(array $data, Request $request, ?Model $record): array
    {
        return $data;
    }

    // ── دورة الحياة ─────────────────────────────────────────────

    public function index(Request $request): Response
    {
        $query = $this->scope($this->model::query()->with($this->with()));

        if ($term = trim((string) $request->query('q', ''))) {
            $query->where(function ($w) use ($term) {
                foreach ($this->searchable() as $col) {
                    $w->orWhere($col, 'like', "%{$term}%");
                }
            });
        }

        foreach ($this->filters() as $filter) {
            $value = $request->query($filter['name']);
            if ($value !== null && $value !== '') {
                $query->where($filter['name'], $value);
            }
        }

        $page = $query->latest()->paginate(15)->withQueryString();

        return Inertia::render('Admin/Crud/Index', [
            'meta' => $this->meta(),
            'columns' => $this->columns(),
            'filters' => $this->filters(),
            'rows' => $page->through(fn (Model $m) => $this->row($m)),
            'query' => $request->only(array_merge(['q'], array_column($this->filters(), 'name'))),
        ]);
    }

    public function create(): Response
    {
        abort_unless($this->canCreate, 403);

        return Inertia::render('Admin/Crud/Form', [
            'meta' => $this->meta(),
            'sections' => $this->formSections(),
            'record' => null,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        abort_unless($this->canCreate, 403);

        $data = $this->payload($request, null);
        $this->model::create($data);

        return redirect($this->base())->with('success', "تمت إضافة {$this->singular} بنجاح");
    }

    public function edit(int $id): Response
    {
        abort_unless($this->canEdit, 403);
        $record = $this->find($id);

        return Inertia::render('Admin/Crud/Form', [
            'meta' => $this->meta(),
            'sections' => $this->formSections(),
            'record' => $this->recordData($record),
        ]);
    }

    public function update(Request $request, int $id): RedirectResponse
    {
        abort_unless($this->canEdit, 403);
        $record = $this->find($id);

        $record->update($this->payload($request, $record));

        return redirect($this->base())->with('success', "تم تعديل {$this->singular} بنجاح");
    }

    public function destroy(int $id): RedirectResponse
    {
        abort_unless($this->canDelete, 403);
        $this->find($id)->delete();

        return redirect($this->base())->with('success', "تم حذف {$this->singular}");
    }

    // ── مساعدات ─────────────────────────────────────────────────

    protected function find(int $id): Model
    {
        return $this->scope($this->model::query())->findOrFail($id);
    }

    protected function base(): string
    {
        return "/{$this->panel}/{$this->key}";
    }

    protected function meta(): array
    {
        return [
            'key' => $this->key,
            'panel' => $this->panel,
            'base' => $this->base(),
            'label' => $this->label,
            'singular' => $this->singular,
            'canCreate' => $this->canCreate,
            'canEdit' => $this->canEdit,
            'canDelete' => $this->canDelete,
        ];
    }

    /** كل الحقول (مسطّحة من الأقسام) */
    protected function fields(): array
    {
        return array_merge(...array_map(fn ($s) => $s['fields'], $this->formSections()));
    }

    /** يبني بيانات الصف من تعريف الأعمدة */
    protected function row(Model $m): array
    {
        $data = ['id' => $m->getKey()];

        foreach ($this->columns() as $col) {
            $data[$col['key']] = data_get($m, $col['key']);
        }

        if ($this->hasImage) {
            $data['image_url'] = $m->image_url;
        }

        return $data;
    }

    /** بيانات السجل للفورم (edit) */
    protected function recordData(Model $m): array
    {
        $data = ['id' => $m->getKey()];
        foreach ($this->fields() as $field) {
            $data[$field['name']] = $m->{$field['name']};
        }

        return $data;
    }

    /** يبني الحمولة النهائية بعد التحقق وضبط الأنواع */
    protected function payload(Request $request, ?Model $record): array
    {
        $data = $request->validate($this->rules($request, $record));

        foreach ($this->fields() as $field) {
            $name = $field['name'];
            $type = $field['type'] ?? 'text';

            if ($type === 'toggle') {
                $data[$name] = $request->boolean($name);
            } elseif ($type === 'tags') {
                $data[$name] = array_values(array_filter((array) $request->input($name, [])));
            } elseif (array_key_exists($name, $data) && $data[$name] === '') {
                $data[$name] = null;
            }
        }

        return $this->beforeSave($data, $request, $record);
    }
}
