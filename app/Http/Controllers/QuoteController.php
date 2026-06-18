<?php

namespace App\Http\Controllers;

use App\Http\Requests\QuoteRequest;
use App\Models\QuoteHistory;
use App\Models\Vehicle;
use Illuminate\Http\RedirectResponse;

class QuoteController extends Controller
{
    public function store(QuoteRequest $request, Vehicle $vehicle): RedirectResponse
    {
        $this->authorize('create', QuoteHistory::class);

        $data = $request->validated();
        $data['quoted_by'] = auth()->id();

        $quote = $vehicle->quoteHistories()->create($data);

        $vehicle->logActivity(
            'quote_added',
            sprintf('添加%s报价: ¥%s', $quote->stageLabel(), number_format($quote->quote_price, 2))
        );

        return back()->with('success', '报价记录添加成功');
    }

    public function update(QuoteRequest $request, Vehicle $vehicle, QuoteHistory $quote): RedirectResponse
    {
        $this->authorize('update', $quote);

        $data = $request->validated();

        if ($data['status'] === QuoteHistory::STATUS_ACCEPTED && $quote->status !== QuoteHistory::STATUS_ACCEPTED) {
            $data['responded_at'] = now();

            if ($data['final_price'] ?? false) {
                $vehicle->update(['purchase_price' => $data['final_price']]);
            }
        }

        $quote->update($data);

        return back()->with('success', '报价记录更新成功');
    }

    public function destroy(Vehicle $vehicle, QuoteHistory $quote): RedirectResponse
    {
        $this->authorize('delete', $quote);

        $quote->delete();

        return back()->with('success', '报价记录已删除');
    }

    public function approve(Vehicle $vehicle, QuoteHistory $quote): RedirectResponse
    {
        $this->authorize('approve', $quote);

        $quote->update([
            'approved_by' => auth()->id(),
        ]);

        return back()->with('success', '报价已审批');
    }
}
