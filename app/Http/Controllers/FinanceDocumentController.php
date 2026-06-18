<?php

namespace App\Http\Controllers;

use App\Http\Requests\FinanceDocumentRequest;
use App\Models\Anomaly;
use App\Models\FinanceDocument;
use App\Models\Vehicle;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class FinanceDocumentController extends Controller
{
    public function store(FinanceDocumentRequest $request, Vehicle $vehicle): RedirectResponse
    {
        $this->authorize('create', FinanceDocument::class);

        $data = $request->validated();
        $data['handled_by'] = auth()->id();

        $document = $vehicle->financeDocuments()->create($data);

        $this->handleAttachments($request, $document);

        $vehicle->logActivity(
            'finance_doc_added',
            sprintf('添加金融资料: %s - %s', $document->typeLabel(), $document->title)
        );

        return back()->with('success', '金融资料添加成功');
    }

    public function update(FinanceDocumentRequest $request, Vehicle $vehicle, FinanceDocument $document): RedirectResponse
    {
        $this->authorize('update', $document);

        $data = $request->validated();

        if ($data['status'] === FinanceDocument::STATUS_MISSING && $document->status !== FinanceDocument::STATUS_MISSING) {
            $this->createMissingDocAnomaly($vehicle, $document);
        }

        if ($data['status'] === FinanceDocument::STATUS_VERIFIED && $document->status !== FinanceDocument::STATUS_VERIFIED) {
            $data['verified_by'] = auth()->id();
            $data['verified_at'] = now();
        }

        $document->update($data);

        $this->handleAttachments($request, $document);

        return back()->with('success', '金融资料更新成功');
    }

    public function destroy(Vehicle $vehicle, FinanceDocument $document): RedirectResponse
    {
        $this->authorize('delete', $document);

        $document->delete();

        return back()->with('success', '金融资料已删除');
    }

    public function verify(Request $request, Vehicle $vehicle, FinanceDocument $document): RedirectResponse
    {
        $this->authorize('verify', $document);

        $validated = $request->validate([
            'verification_notes' => 'nullable|string',
        ]);

        $document->update([
            'status' => FinanceDocument::STATUS_VERIFIED,
            'verified_by' => auth()->id(),
            'verified_at' => now(),
            'verification_notes' => $validated['verification_notes'] ?? null,
        ]);

        $vehicle->logActivity(
            'finance_doc_verified',
            sprintf('核验通过: %s - %s', $document->typeLabel(), $document->title)
        );

        return back()->with('success', '资料核验通过');
    }

    private function handleAttachments(Request $request, FinanceDocument $document): void
    {
        if ($request->hasFile('attachments')) {
            foreach ($request->file('attachments') as $file) {
                $document->addAttachment($file, 'document', null, auth()->id());
            }
        }
    }

    private function createMissingDocAnomaly(Vehicle $vehicle, FinanceDocument $document): void
    {
        $anomaly = Anomaly::create([
            'vehicle_id' => $vehicle->id,
            'type' => 'missing_doc',
            'title' => sprintf('资料缺失: %s', $document->typeLabel()),
            'description' => sprintf('资料类型: %s, 标题: %s. 需要尽快补充相关资料。', $document->typeLabel(), $document->title),
            'severity' => 'normal',
            'status' => Anomaly::STATUS_OPEN,
            'source' => 'system',
            'reported_by' => auth()->id(),
            'before_snapshot' => $document->toArray(),
        ]);

        $vehicle->logActivity(
            'anomaly_created',
            sprintf('系统检测到资料缺失，已创建异常记录 #%d', $anomaly->id)
        );
    }
}
