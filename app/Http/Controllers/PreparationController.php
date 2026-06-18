<?php

namespace App\Http\Controllers;

use App\Http\Requests\PreparationItemRequest;
use App\Models\PreparationItem;
use App\Models\Vehicle;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class PreparationController extends Controller
{
    public function store(PreparationItemRequest $request, Vehicle $vehicle): RedirectResponse
    {
        $this->authorize('create', PreparationItem::class);

        $item = $vehicle->preparationItems()->create($request->validated());

        $this->handleAttachments($request, $item);

        if ($item->status === PreparationItem::STATUS_COMPLETED && !$item->completed_at) {
            $item->update(['completed_at' => now()]);
        }

        $vehicle->logActivity('preparation_added', sprintf('添加整备项目: %s', $item->name));

        return back()->with('success', '整备项目添加成功');
    }

    public function update(PreparationItemRequest $request, Vehicle $vehicle, PreparationItem $item): RedirectResponse
    {
        $this->authorize('update', $item);

        $data = $request->validated();

        if ($data['status'] === PreparationItem::STATUS_COMPLETED && $item->status !== PreparationItem::STATUS_COMPLETED) {
            $data['completed_at'] = now();
        }

        $item->update($data);

        $this->handleAttachments($request, $item);

        return back()->with('success', '整备项目更新成功');
    }

    public function destroy(Vehicle $vehicle, PreparationItem $item): RedirectResponse
    {
        $this->authorize('delete', $item);

        $item->delete();

        return back()->with('success', '整备项目已删除');
    }

    public function batchComplete(Request $request, Vehicle $vehicle): RedirectResponse
    {
        $this->authorize('batchUpdate', PreparationItem::class);

        $ids = $request->input('ids', []);

        PreparationItem::whereIn('id', $ids)
            ->where('vehicle_id', $vehicle->id)
            ->update([
                'status' => PreparationItem::STATUS_COMPLETED,
                'completed_at' => now(),
                'handled_by' => auth()->id(),
            ]);

        return back()->with('success', sprintf('已批量完成 %d 个整备项目', count($ids)));
    }

    private function handleAttachments(Request $request, PreparationItem $item): void
    {
        if ($request->hasFile('attachments')) {
            foreach ($request->file('attachments') as $file) {
                $item->addAttachment($file, 'document', null, auth()->id());
            }
        }
    }
}
