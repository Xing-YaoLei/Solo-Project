<?php

namespace App\Http\Controllers;

use App\Http\Requests\VehicleRequest;
use App\Models\Vehicle;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class VehicleController extends Controller
{
    public function index(Request $request): Response
    {
        $query = Vehicle::with([
            'appraiser:id,name',
            'sales:id,name',
            'creator:id,name',
        ]);

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('vin', 'like', "%{$search}%")
                    ->orWhere('plate_no', 'like', "%{$search}%")
                    ->orWhere('brand', 'like', "%{$search}%")
                    ->orWhere('model', 'like', "%{$search}%");
            });
        }

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        if ($brand = $request->input('brand')) {
            $query->where('brand', $brand);
        }

        if ($appraiserId = $request->input('appraiser_id')) {
            $query->where('appraiser_id', $appraiserId);
        }

        if ($dateFrom = $request->input('date_from')) {
            $query->whereDate('arrival_date', '>=', $dateFrom);
        }

        if ($dateTo = $request->input('date_to')) {
            $query->whereDate('arrival_date', '<=', $dateTo);
        }

        $sort = $request->input('sort', 'created_at');
        $dir = $request->input('dir', 'desc');
        $query->orderBy($sort, $dir);

        $vehicles = $query->paginate(20)->withQueryString();

        $vehicles->getCollection()->transform(function ($v) {
            return $v->append([
                'days_in_stock', 'status_label', 'preparation_cost',
                'total_cost', 'missing_documents_count',
            ]);
        });

        $brands = Vehicle::distinct()->orderBy('brand')->pluck('brand');
        $statuses = Vehicle::STATUS_LABELS;

        return Inertia::render('Vehicles/Index', [
            'vehicles' => $vehicles,
            'filters' => $request->only(['search', 'status', 'brand', 'appraiser_id', 'date_from', 'date_to']),
            'brands' => $brands,
            'statuses' => $statuses,
            'can' => [
                'create' => auth()->user()->can('create', Vehicle::class),
                'batch_update' => auth()->user()->can('batchUpdate', Vehicle::class),
                'export' => auth()->user()->can('export', Vehicle::class),
            ],
        ]);
    }

    public function create(): Response
    {
        $this->authorize('create', Vehicle::class);

        return Inertia::render('Vehicles/Create', [
            'statuses' => Vehicle::STATUS_LABELS,
        ]);
    }

    public function store(VehicleRequest $request): RedirectResponse
    {
        $this->authorize('create', Vehicle::class);

        $data = $request->validated();
        $data['created_by'] = auth()->id();

        $vehicle = Vehicle::create($data);

        $vehicle->logActivity('created', '创建了车辆档案');

        return redirect()->route('vehicles.show', $vehicle)
            ->with('success', '车辆档案创建成功');
    }

    public function show(Vehicle $vehicle): Response
    {
        $vehicle->load([
            'appraiser:id,name',
            'sales:id,name',
            'creator:id,name',
            'preparationItems.handler:id,name',
            'testDrives.accompanier:id,name',
            'quoteHistories.quoter:id,name',
            'quoteHistories.approver:id,name',
            'financeDocuments.verifier:id,name',
            'financeDocuments.handler:id,name',
            'anomalies.handler:id,name',
            'anomalies.reporter:id,name',
            'attachments.uploader:id,name',
            'activityLogs.user:id,name',
        ]);

        $vehicle->append([
            'days_in_stock', 'status_label', 'preparation_cost',
            'total_cost', 'profit', 'profit_margin', 'missing_documents_count',
        ]);

        return Inertia::render('Vehicles/Show', [
            'vehicle' => $vehicle,
            'can' => [
                'update' => auth()->user()->can('update', $vehicle),
                'delete' => auth()->user()->can('delete', $vehicle),
                'add_preparation' => auth()->user()->can('create', \App\Models\PreparationItem::class),
                'add_test_drive' => auth()->user()->can('create', \App\Models\TestDrive::class),
                'add_quote' => auth()->user()->can('create', \App\Models\QuoteHistory::class),
                'add_finance_doc' => auth()->user()->can('create', \App\Models\FinanceDocument::class),
                'report_anomaly' => auth()->user()->can('create', \App\Models\Anomaly::class),
            ],
        ]);
    }

    public function edit(Vehicle $vehicle): Response
    {
        $this->authorize('update', $vehicle);

        return Inertia::render('Vehicles/Edit', [
            'vehicle' => $vehicle,
            'statuses' => Vehicle::STATUS_LABELS,
        ]);
    }

    public function update(VehicleRequest $request, Vehicle $vehicle): RedirectResponse
    {
        $this->authorize('update', $vehicle);

        $vehicle->update($request->validated());

        return redirect()->route('vehicles.show', $vehicle)
            ->with('success', '车辆信息更新成功');
    }

    public function destroy(Vehicle $vehicle): RedirectResponse
    {
        $this->authorize('delete', $vehicle);

        $vehicle->delete();

        return redirect()->route('vehicles.index')
            ->with('success', '车辆档案已删除');
    }

    public function batchUpdate(Request $request): RedirectResponse
    {
        $this->authorize('batchUpdate', Vehicle::class);

        $ids = $request->input('ids', []);
        $updates = $request->input('updates', []);

        Vehicle::whereIn('id', $ids)->update($updates);

        return back()->with('success', sprintf('已批量更新 %d 条记录', count($ids)));
    }

    public function updateStatus(Request $request, Vehicle $vehicle): RedirectResponse
    {
        $this->authorize('update', $vehicle);

        $validated = $request->validate([
            'status' => 'required|in:' . implode(',', array_keys(Vehicle::STATUS_LABELS)),
            'remark' => 'nullable|string',
        ]);

        $oldStatus = $vehicle->status;
        $vehicle->update($validated);

        $vehicle->logActivity(
            'status_changed',
            sprintf('状态从 %s 变更为 %s', Vehicle::STATUS_LABELS[$oldStatus] ?? $oldStatus, Vehicle::STATUS_LABELS[$validated['status']]),
            ['status' => $oldStatus],
            ['status' => $validated['status'], 'remark' => $validated['remark'] ?? null]
        );

        return back()->with('success', '状态更新成功');
    }
}
