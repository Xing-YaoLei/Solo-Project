<?php

namespace App\Http\Controllers;

use App\Http\Requests\AnomalyRequest;
use App\Models\Anomaly;
use App\Models\Vehicle;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AnomalyController extends Controller
{
    public function index(Request $request): Response
    {
        $query = Anomaly::with([
            'vehicle:id,brand,model,plate_no,vin',
            'reporter:id,name',
            'handler:id,name',
            'approver:id,name',
        ]);

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        if ($type = $request->input('type')) {
            $query->where('type', $type);
        }

        if ($severity = $request->input('severity')) {
            $query->where('severity', $severity);
        }

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        $anomalies = $query->latest()->paginate(20)->withQueryString();
        $anomalies->getCollection()->transform(fn ($a) => $a->append(['status_label', 'severity_label', 'type_label', 'source_label']));

        return Inertia::render('Anomalies/Index', [
            'anomalies' => $anomalies,
            'filters' => $request->only(['status', 'type', 'severity', 'search']),
            'statuses' => Anomaly::STATUS_LABELS,
            'types' => Anomaly::TYPE_LABELS,
            'severities' => Anomaly::SEVERITY_LABELS,
            'can' => [
                'create' => auth()->user()->can('create', Anomaly::class),
                'handle' => auth()->user()->can('handle', Anomaly::class),
                'approve' => auth()->user()->can('approve', Anomaly::class),
            ],
        ]);
    }

    public function store(AnomalyRequest $request, Vehicle $vehicle): RedirectResponse
    {
        $this->authorize('create', Anomaly::class);

        $data = $request->validated();
        $data['reported_by'] = auth()->id();
        $data['before_snapshot'] = $vehicle->toArray();
        if (empty($data['source'])) {
            $data['source'] = $this->determineSource();
        }

        $anomaly = $vehicle->anomalies()->create($data);

        $this->handleAttachments($request, $anomaly);

        $vehicle->logActivity(
            'anomaly_created',
            sprintf('上报异常 #%d: %s - %s', $anomaly->id, $anomaly->typeLabel(), $anomaly->title)
        );

        return back()->with('success', '异常已上报');
    }

    public function handle(AnomalyRequest $request, Anomaly $anomaly): RedirectResponse
    {
        $this->authorize('handle', $anomaly);

        $data = $request->validated();
        $data['handled_by'] = auth()->id();

        if (in_array($data['status'], [Anomaly::STATUS_RESOLVED, Anomaly::STATUS_CLOSED]) &&
            !in_array($anomaly->status, [Anomaly::STATUS_RESOLVED, Anomaly::STATUS_CLOSED])) {
            $data['resolved_at'] = now();
            $data['after_snapshot'] = $anomaly->vehicle ? $anomaly->vehicle->toArray() : null;
        }

        $anomaly->update($data);

        $this->handleAttachments($request, $anomaly);

        if ($anomaly->vehicle) {
            $anomaly->vehicle->logActivity(
                'anomaly_handled',
                sprintf('处理异常 #%d: 状态变更为 %s', $anomaly->id, $anomaly->statusLabel())
            );
        }

        return back()->with('success', '异常处理记录已更新');
    }

    public function approve(Request $request, Anomaly $anomaly): RedirectResponse
    {
        $this->authorize('approve', $anomaly);

        $validated = $request->validate([
            'conclusion' => 'required|string',
        ]);

        $anomaly->update([
            'status' => Anomaly::STATUS_CLOSED,
            'approved_by' => auth()->id(),
            'resolved_at' => now(),
            'conclusion' => $validated['conclusion'],
            'after_snapshot' => $anomaly->vehicle ? $anomaly->vehicle->toArray() : null,
        ]);

        if ($anomaly->vehicle) {
            $anomaly->vehicle->logActivity(
                'anomaly_approved',
                sprintf('店长审批通过异常 #%d', $anomaly->id)
            );
        }

        return back()->with('success', '异常已审批关闭');
    }

    public function escalate(Anomaly $anomaly): RedirectResponse
    {
        $this->authorize('handle', $anomaly);

        $anomaly->update([
            'status' => Anomaly::STATUS_ESCALATED,
        ]);

        return back()->with('success', '异常已升级，需店长介入处理');
    }

    public function show(Anomaly $anomaly): Response
    {
        $anomaly->load([
            'vehicle:id,brand,model,plate_no,vin',
            'reporter:id,name',
            'handler:id,name',
            'approver:id,name',
            'attachments.uploader:id,name',
        ]);

        $anomaly->append(['status_label', 'severity_label', 'type_label', 'source_label']);

        return Inertia::render('Anomalies/Show', [
            'anomaly' => $anomaly,
            'can' => [
                'handle' => auth()->user()->can('handle', $anomaly),
                'approve' => auth()->user()->can('approve', $anomaly),
                'escalate' => auth()->user()->can('handle', $anomaly) && $anomaly->isOpen(),
            ],
        ]);
    }

    private function handleAttachments(Request $request, Anomaly $anomaly): void
    {
        if ($request->hasFile('attachments')) {
            foreach ($request->file('attachments') as $file) {
                $anomaly->addAttachment($file, 'document', null, auth()->id());
            }
        }
    }

    private function determineSource(): string
    {
        $user = auth()->user();
        if ($user->isAppraiser()) return 'appraiser';
        if ($user->isSales()) return 'sales';
        if ($user->isFinance()) return 'finance';
        if ($user->isManager()) return 'manager';
        return 'system';
    }
}
