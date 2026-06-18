<?php

namespace App\Http\Controllers;

use App\Enums\TimelineCategory;
use App\Models\Vehicle;
use App\Models\Store;
use App\Models\TestDrive;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;

class VehicleController extends Controller
{
    public function index(Request $request): Response
    {
        $filters = $request->only([
            'search', 'status', 'store_id', 'brand', 'fuel_type', 'transmission',
            'is_test_drive_eligible', 'price_from', 'price_to', 'mileage_from', 'mileage_to',
        ]);

        $user = $request->user();
        $scopeStore = $user->hasRole('store_manager') || $user->hasRole('sales') ? $user->store_id : null;

        $query = Vehicle::with(['store:id,name'])
            ->withCount('testDrives')
            ->when($scopeStore, fn($q) => $q->where('store_id', $scopeStore))
            ->when($filters['search'] ?? null, function ($q, $search) {
                $q->where('vin', 'like', "%{$search}%")
                  ->orWhere('plate_number', 'like', "%{$search}%")
                  ->orWhere('brand', 'like', "%{$search}%")
                  ->orWhere('model', 'like', "%{$search}%")
                  ->orWhere('series', 'like', "%{$search}%");
            })
            ->when($filters['status'] ?? null, fn($q, $s) => $q->where('status', $s))
            ->when($filters['store_id'] ?? null, fn($q, $s) => $q->where('store_id', $s))
            ->when($filters['brand'] ?? null, fn($q, $b) => $q->where('brand', $b))
            ->when($filters['fuel_type'] ?? null, fn($q, $f) => $q->where('fuel_type', $f))
            ->when($filters['transmission'] ?? null, fn($q, $t) => $q->where('transmission', $t))
            ->when(($filters['is_test_drive_eligible'] ?? null) !== null, fn($q) => $q->where('is_test_drive_eligible', (bool)$filters['is_test_drive_eligible']))
            ->when($filters['price_from'] ?? null, fn($q, $p) => $q->where('price', '>=', $p))
            ->when($filters['price_to'] ?? null, fn($q, $p) => $q->where('price', '<=', $p))
            ->when($filters['mileage_from'] ?? null, fn($q, $m) => $q->where('mileage', '>=', $m))
            ->when($filters['mileage_to'] ?? null, fn($q, $m) => $q->where('mileage', '<=', $m))
            ->orderByDesc('created_at');

        $perPage = (int) ($request->input('per_page', 20));
        $vehicles = $query->paginate($perPage)->withQueryString();

        return Inertia::render('Vehicles/Index', [
            'vehicles' => $vehicles,
            'filters' => $filters,
            'filterOptions' => [
                'stores' => Store::select('id', 'name')->where('status', 1)->get(),
                'brands' => Vehicle::selectRaw('brand, COUNT(*) as count')
                    ->groupBy('brand')->orderByDesc('count')->limit(20)->get(),
                'fuelTypes' => Vehicle::whereNotNull('fuel_type')->distinct()->pluck('fuel_type'),
                'transmissions' => Vehicle::whereNotNull('transmission')->distinct()->pluck('transmission'),
            ],
        ]);
    }

    public function create(Request $request): Response
    {
        $storeId = $request->user()->store_id;
        return Inertia::render('Vehicles/Create', [
            'options' => [
                'stores' => Store::select('id', 'name')->where('status', 1)->get(),
                'defaultStore' => $storeId,
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'vin' => 'required|string|unique:vehicles,vin|max:50',
            'plate_number' => 'nullable|string|max:20',
            'brand' => 'required|string|max:50',
            'series' => 'nullable|string|max:50',
            'model' => 'required|string|max:100',
            'year' => 'nullable|digits:4',
            'color' => 'nullable|string|max:20',
            'mileage' => 'nullable|integer',
            'displacement' => 'nullable|string|max:20',
            'transmission' => 'nullable|string|max:20',
            'fuel_type' => 'nullable|string|max:20',
            'seats' => 'nullable|integer',
            'price' => 'nullable|numeric',
            'first_register_date' => 'nullable|date',
            'emission_standard' => 'nullable|integer',
            'condition_level' => 'nullable|integer',
            'is_test_drive_eligible' => 'nullable|boolean',
            'features' => 'nullable|array',
            'remark' => 'nullable|string',
            'store_id' => 'nullable|exists:stores,id',
        ]);

        $validated['created_by'] = $request->user()->id;
        $validated['updated_by'] = $request->user()->id;
        $validated['status'] = 1;

        $vehicle = Vehicle::create($validated);

        $vehicle->addTimeline(
            TimelineCategory::FIELD_CHANGE,
            0,
            '创建车辆档案',
            $request->input('remark') ?? '车辆档案建立'
        );

        return redirect()->route('vehicles.show', $vehicle)->with('success', '车辆档案创建成功');
    }

    public function show(Request $request, Vehicle $vehicle): Response
    {
        $vehicle->load([
            'store',
            'testDrives.customer', 'testDrives.salesUser', 'testDrives.assignedUser',
            'attachments.creator',
            'notes.creator',
            'timelines.user', 'timelines.reviewMaterials',
        ]);

        return Inertia::render('Vehicles/Show', [
            'vehicle' => $vehicle,
        ]);
    }

    public function update(Request $request, Vehicle $vehicle): RedirectResponse
    {
        $validated = $request->validate([
            'plate_number' => 'nullable|string|max:20',
            'brand' => 'nullable|string|max:50',
            'series' => 'nullable|string|max:50',
            'model' => 'nullable|string|max:100',
            'year' => 'nullable|digits:4',
            'color' => 'nullable|string|max:20',
            'mileage' => 'nullable|integer',
            'displacement' => 'nullable|string|max:20',
            'transmission' => 'nullable|string|max:20',
            'fuel_type' => 'nullable|string|max:20',
            'seats' => 'nullable|integer',
            'price' => 'nullable|numeric',
            'first_register_date' => 'nullable|date',
            'emission_standard' => 'nullable|integer',
            'condition_level' => 'nullable|integer',
            'status' => 'nullable|integer',
            'is_test_drive_eligible' => 'nullable|boolean',
            'features' => 'nullable|array',
            'remark' => 'nullable|string',
            'store_id' => 'nullable|exists:stores,id',
        ]);

        $original = $vehicle->getOriginal();
        $vehicle->fill($validated);
        $dirty = $vehicle->getDirty();

        if (!empty($dirty)) {
            $vehicle->updated_by = $request->user()->id;
            $vehicle->save();

            foreach ($dirty as $field => $newValue) {
                if (in_array($field, ['updated_by', 'updated_at'])) continue;
                $vehicle->addTimeline(
                    TimelineCategory::FIELD_CHANGE,
                    2,
                    sprintf('修改字段：%s', $field),
                    null,
                    $field,
                    $original[$field] ?? null,
                    $newValue
                );
            }
        }

        return back()->with('success', '车辆档案已更新');
    }
}
