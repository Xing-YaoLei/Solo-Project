<?php

namespace App\Http\Controllers;

use App\Models\Note;
use App\Models\Attachment;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Storage;

class CommonController extends Controller
{
    public function addNote(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'notable_type' => 'required|string|max:100',
            'notable_id' => 'required|integer|min:1',
            'content' => 'required|string',
            'type' => 'nullable|integer',
            'priority' => 'nullable|integer',
            'is_internal' => 'nullable|boolean',
        ]);

        $modelClass = $this->resolveModelClass($validated['notable_type']);
        if (!$modelClass || !class_exists($modelClass)) {
            return back()->withErrors(['notable_type' => '无效的实体类型'])->withInput();
        }

        $model = $modelClass::findOrFail($validated['notable_id']);

        $note = $model->addNote(
            $validated['content'],
            $validated['type'] ?? 1,
            $validated['priority'] ?? 2,
            $validated['is_internal'] ?? true
        );

        if (method_exists($model, 'addTimeline')) {
            $model->addTimeline(
                \App\Enums\TimelineCategory::NOTE,
                3,
                '新增备注',
                mb_substr($validated['content'], 0, 200),
                'note_id', null, $note->id
            );
        }

        return back()->with('success', '备注已添加');
    }

    public function updateNote(Request $request, Note $note): RedirectResponse
    {
        $this->authorize('update', $note);

        $validated = $request->validate([
            'content' => 'required|string',
            'type' => 'nullable|integer',
            'priority' => 'nullable|integer',
            'is_internal' => 'nullable|boolean',
        ]);

        $note->fill($validated);
        $note->updated_by = $request->user()->id;
        $note->save();

        return back()->with('success', '备注已更新');
    }

    public function deleteNote(Request $request, Note $note): RedirectResponse
    {
        $this->authorize('delete', $note);

        $notable = $note->notable;
        $note->delete();

        if ($notable && method_exists($notable, 'addTimeline')) {
            $notable->addTimeline(
                \App\Enums\TimelineCategory::NOTE,
                3,
                '删除备注',
                null, 'note_id', $note->id, null
            );
        }

        return back()->with('success', '备注已删除');
    }

    public function uploadAttachment(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'attachable_type' => 'required|string|max:100',
            'attachable_id' => 'required|integer|min:1',
            'file' => 'required|file|max:20480',
            'category' => 'nullable|integer',
            'description' => 'nullable|string|max:500',
        ]);

        $modelClass = $this->resolveModelClass($validated['attachable_type']);
        if (!$modelClass || !class_exists($modelClass)) {
            return back()->withErrors(['attachable_type' => '无效的实体类型'])->withInput();
        }

        $model = $modelClass::findOrFail($validated['attachable_id']);

        $attachment = $model->addAttachment(
            $request->file('file'),
            $validated['category'] ?? 1,
            $validated['description'] ?? null
        );

        if (method_exists($model, 'addTimeline')) {
            $model->addTimeline(
                \App\Enums\TimelineCategory::ATTACHMENT,
                3,
                '上传附件',
                sprintf('文件名：%s；大小：%s', $attachment->original_name, $attachment->size_formatted),
                'attachment_id', null, $attachment->id
            );
        }

        return back()->with('success', '附件已上传');
    }

    public function deleteAttachment(Request $request, Attachment $attachment): RedirectResponse
    {
        $this->authorize('delete', $attachment);

        $attachable = $attachment->attachable;

        try {
            Storage::disk($attachment->disk)->delete($attachment->path);
        } catch (\Exception $e) {}

        $attachment->delete();

        if ($attachable && method_exists($attachable, 'addTimeline')) {
            $attachable->addTimeline(
                \App\Enums\TimelineCategory::ATTACHMENT,
                3,
                '删除附件',
                sprintf('文件名：%s', $attachment->original_name),
                'attachment_id', $attachment->id, null
            );
        }

        return back()->with('success', '附件已删除');
    }

    private function resolveModelClass(string $type): ?string
    {
        $map = [
            'test_drive' => \App\Models\TestDrive::class,
            'App\\Models\\TestDrive' => \App\Models\TestDrive::class,
            'customer' => \App\Models\Customer::class,
            'App\\Models\\Customer' => \App\Models\Customer::class,
            'vehicle' => \App\Models\Vehicle::class,
            'App\\Models\\Vehicle' => \App\Models\Vehicle::class,
            'sales_followup' => \App\Models\SalesFollowup::class,
            'App\\Models\\SalesFollowup' => \App\Models\SalesFollowup::class,
            'review_material' => \App\Models\ReviewMaterial::class,
            'App\\Models\\ReviewMaterial' => \App\Models\ReviewMaterial::class,
        ];

        return $map[$type] ?? null;
    }
}
