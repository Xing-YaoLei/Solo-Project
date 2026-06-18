<?php

namespace App\Http\Controllers;

use App\Enums\TestDriveStatus;
use App\Enums\ResponsibilityRole;
use App\Enums\TimelineCategory;
use App\Enums\IntentLevel;
use App\Models\TestDrive;
use App\Models\Customer;
use App\Models\Vehicle;
use App\Models\Store;
use App\Models\User;
use App\Models\ReviewMaterial;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;

class TestDriveController extends Controller
{
    public function index(Request $request): Response
    {
        $filters = $request->only([
            'search', 'status', 'store_id', 'sales_user_id', 'assigned_user_id',
            'vehicle_id', 'customer_id', 'date_from', 'date_to', 'is_no_show',
            'responsibility_role', 'intent_level',
        ]);

        $user = $request->user();
        $scopeStore = $user->hasRole('store_manager') || $user->hasRole('sales') ? $user->store_id : null;

        $query = TestDrive::with([
            'customer:id,name,phone,intent_level',
            'vehicle:id,brand,model,plate_number',
            'salesUser:id,name',
            'assignedUser:id,name',
            'store:id,name',
        ])->when($scopeStore, fn($q) => $q->where('store_id', $scopeStore))
          ->when($filters['search'] ?? null, function ($q, $search) {
              $q->whereHas('customer', fn($cq) => $cq->where('name', 'like', "%{$search}%")->orWhere('phone', 'like', "%{$search}%"))
                ->orWhereHas('vehicle', fn($vq) => $vq->where('brand', 'like', "%{$search}%")->orWhere('model', 'like', "%{$search}%")->orWhere('plate_number', 'like', "%{$search}%"))
                ->orWhere('code', 'like', "%{$search}%");
          })
          ->when($filters['status'] ?? null, fn($q, $s) => $q->where('status', $s))
          ->when($filters['store_id'] ?? null, fn($q, $s) => $q->where('store_id', $s))
          ->when($filters['sales_user_id'] ?? null, fn($q, $u) => $q->where('sales_user_id', $u))
          ->when($filters['assigned_user_id'] ?? null, fn($q, $u) => $q->where('assigned_user_id', $u))
          ->when($filters['vehicle_id'] ?? null, fn($q, $v) => $q->where('vehicle_id', $v))
          ->when($filters['customer_id'] ?? null, fn($q, $c) => $q->where('customer_id', $c))
          ->when($filters['date_from'] ?? null, fn($q, $d) => $q->where('appointment_at', '>=', $d))
          ->when($filters['date_to'] ?? null, fn($q, $d) => $q->where('appointment_at', '<=', $d . ' 23:59:59'))
          ->when(($filters['is_no_show'] ?? null) !== null, fn($q) => $q->where('is_no_show', (bool)$filters['is_no_show']))
          ->when($filters['responsibility_role'] ?? null, fn($q, $r) => $q->where('responsibility_role', $r))
          ->orderBy('appointment_at', 'desc');

        $perPage = (int) ($request->input('per_page', 20));
        $testDrives = $query->paginate($perPage)->withQueryString();

        $aggregates = [
            'total' => (clone $query)->count(),
            'pending' => (clone $query)->where('status', TestDriveStatus::PENDING->value)->count(),
            'completed' => (clone $query)->where('status', TestDriveStatus::COMPLETED->value)->count(),
            'no_show' => (clone $query)->where('is_no_show', true)->count(),
        ];

        return Inertia::render('TestDrives/Index', [
            'testDrives' => $testDrives,
            'filters' => $filters,
            'aggregates' => $aggregates,
            'filterOptions' => [
                'statuses' => collect(TestDriveStatus::cases())->map(fn($s) => ['value' => $s->value, 'label' => $s->label(), 'color' => $s->color()]),
                'responsibilities' => collect(ResponsibilityRole::cases())->map(fn($r) => ['value' => $r->value, 'label' => $r->label()]),
                'responsibilityRoles' => collect(ResponsibilityRole::cases())->map(fn($r) => ['value' => $r->value, 'label' => $r->label()]),
                'intentLevels' => collect(IntentLevel::cases())->map(fn($i) => ['value' => $i->value, 'label' => $i->label()]),
                'stores' => Store::select('id', 'name')->where('status', 1)->get(),
                'salesUsers' => User::select('id', 'name')->where('status', 1)->when($scopeStore, fn($q) => $q->where('store_id', $scopeStore))->get(),
                'assignedUsers' => User::select('id', 'name')->where('status', 1)->when($scopeStore, fn($q) => $q->where('store_id', $scopeStore))->get(),
            ],
        ]);
    }

    public function create(Request $request): Response
    {
        $storeId = $request->user()->store_id;

        return Inertia::render('TestDrives/Create', [
            'options' => [
                'statuses' => collect(TestDriveStatus::cases())->map(fn($s) => ['value' => $s->value, 'label' => $s->label()]),
                'stores' => Store::select('id', 'name')->where('status', 1)->get(),
                'vehicles' => Vehicle::select('id', 'brand', 'model', 'plate_number')
                    ->where('status', 1)
                    ->where('is_test_drive_eligible', true)
                    ->when($storeId, fn($q) => $q->where('store_id', $storeId))
                    ->get(),
                'salesUsers' => User::select('id', 'name')->where('status', 1)
                    ->when($storeId, fn($q) => $q->where('store_id', $storeId))->get(),
                'defaultStatus' => TestDriveStatus::PENDING->value,
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'customer_id' => 'required|exists:customers,id',
            'vehicle_id' => 'required|exists:vehicles,id',
            'store_id' => 'nullable|exists:stores,id',
            'type' => 'nullable|integer|min:1',
            'appointment_at' => 'required|date',
            'appointment_end_at' => 'nullable|date|after:appointment_at',
            'planned_duration' => 'nullable|integer|min:10|max:480',
            'sales_user_id' => 'nullable|exists:users,id',
            'companion_user_id' => 'nullable|exists:users,id',
            'assigned_user_id' => 'nullable|exists:users,id',
            'pickup_location' => 'nullable|string|max:255',
            'return_location' => 'nullable|string|max:255',
            'planned_route' => 'nullable|string',
            'remark' => 'nullable|string',
        ]);

        $validated['status'] = TestDriveStatus::PENDING->value;
        $validated['created_by'] = $request->user()->id;
        $validated['updated_by'] = $request->user()->id;

        $testDrive = TestDrive::create($validated);

        $testDrive->addTimeline(
            TimelineCategory::STATUS_CHANGE,
            0,
            '创建试驾预约',
            $request->input('remark') ?? '预约创建成功'
        );

        return redirect()->route('test-drives.show', $testDrive)->with('success', '试驾预约创建成功');
    }

    public function show(Request $request, TestDrive $testDrive): Response
    {
        $testDrive->load([
            'customer', 'vehicle', 'store', 'salesUser', 'companionUser', 'assignedUser',
            'followups.customer', 'followups.user',
            'responsibilityAdjustments.submitter', 'responsibilityAdjustments.approver',
            'responsibilityAdjustments.oldAssignedUser', 'responsibilityAdjustments.newAssignedUser',
            'reviewMaterials.creator', 'reviewMaterials.timelinesLinked',
            'attachments.creator',
            'notes.creator',
            'timelines.user', 'timelines.reviewMaterials',
        ]);

        $scopeStore = $request->user()->hasRole('store_manager') || $request->user()->hasRole('sales') ? $request->user()->store_id : null;

        return Inertia::render('TestDrives/Show', [
            'testDrive' => $testDrive,
            'statusOptions' => collect(TestDriveStatus::cases())->map(fn($s) => ['value' => $s->value, 'label' => $s->label(), 'color' => $s->color()]),
            'responsibilityOptions' => collect(ResponsibilityRole::cases())->map(fn($r) => ['value' => $r->value, 'label' => $r->label()]),
            'options' => [
                'salesUsers' => User::select('id', 'name')->where('status', 1)->when($scopeStore, fn($q) => $q->where('store_id', $scopeStore))->get(),
                'assignedUsers' => User::select('id', 'name')->where('status', 1)->when($scopeStore, fn($q) => $q->where('store_id', $scopeStore))->get(),
                'companionUsers' => User::select('id', 'name')->where('status', 1)->when($scopeStore, fn($q) => $q->where('store_id', $scopeStore))->get(),
                'responsibilityRoles' => collect(ResponsibilityRole::cases())->map(fn($r) => ['value' => $r->value, 'label' => $r->label()]),
                'reviewMaterials' => ReviewMaterial::select('id', 'title', 'code')
                    ->where(function ($q) use ($testDrive) {
                        $q->where('test_drive_id', $testDrive->id)
                            ->orWhere('customer_id', $testDrive->customer_id);
                    })
                    ->latest()
                    ->limit(50)
                    ->get(),
            ],
            'canEdit' => $request->user()->can('update', $testDrive),
            'canAdjustResponsibility' => $request->user()->can('adjustResponsibility', $testDrive),
            'canClose' => $request->user()->can('close', $testDrive),
            'isMobile' => (bool) preg_match('/(iphone|android|mobile)/i', $request->userAgent() ?? ''),
        ]);
    }

    public function update(Request $request, TestDrive $testDrive): RedirectResponse
    {
        $validated = $request->validate([
            'type' => 'nullable|integer|min:1',
            'appointment_at' => 'nullable|date',
            'appointment_end_at' => 'nullable|date|after:appointment_at',
            'planned_duration' => 'nullable|integer|min:10|max:480',
            'actual_start_at' => 'nullable|date',
            'actual_end_at' => 'nullable|date|after:actual_start_at',
            'sales_user_id' => 'nullable|exists:users,id',
            'companion_user_id' => 'nullable|exists:users,id',
            'assigned_user_id' => 'nullable|exists:users,id',
            'pickup_location' => 'nullable|string|max:255',
            'return_location' => 'nullable|string|max:255',
            'planned_route' => 'nullable|string',
            'start_mileage' => 'nullable|numeric',
            'end_mileage' => 'nullable|numeric',
            'start_fuel_level' => 'nullable|numeric|max:100',
            'end_fuel_level' => 'nullable|numeric|max:100',
            'customer_satisfaction' => 'nullable|integer|min:1|max:5',
            'customer_feedback' => 'nullable|string',
            'accident_record' => 'nullable|string',
            'violation_record' => 'nullable|string',
            'remark' => 'nullable|string',
        ]);

        $original = $testDrive->getOriginal();
        $testDrive->fill($validated);
        $dirty = $testDrive->getDirty();

        if (!empty($dirty)) {
            $testDrive->updated_by = $request->user()->id;
            $testDrive->save();

            foreach ($dirty as $field => $newValue) {
                if (in_array($field, ['updated_by', 'updated_at'])) continue;
                $testDrive->addTimeline(
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

        return back()->with('success', '更新成功');
    }

    public function confirm(Request $request, TestDrive $testDrive): RedirectResponse
    {
        $testDrive->confirm($request->user()->id);
        return back()->with('success', '已确认试驾预约');
    }

    public function supplement(Request $request, TestDrive $testDrive): RedirectResponse
    {
        $data = $request->validate([
            'pickup_location' => 'nullable|string|max:255',
            'return_location' => 'nullable|string|max:255',
            'planned_route' => 'nullable|string',
            'remark' => 'nullable|string',
            'companion_user_id' => 'nullable|exists:users,id',
        ]);

        $testDrive->supplement($data, $request->user()->id);
        return back()->with('success', '已补充资料');
    }

    public function close(Request $request, TestDrive $testDrive): RedirectResponse
    {
        $closeNote = $request->input('close_note');
        $testDrive->close($closeNote, $request->user()->id);
        return back()->with('success', '已关闭流程');
    }

    public function markNoShow(Request $request, TestDrive $testDrive): RedirectResponse
    {
        $validated = $request->validate([
            'no_show_reason' => 'required|integer',
            'no_show_impact_scope' => 'nullable|string',
            'responsibility_role' => 'nullable|integer',
            'responsibility_note' => 'nullable|string',
        ]);

        $testDrive->markNoShow(
            $validated['no_show_reason'],
            $validated['no_show_impact_scope'] ?? null,
            $validated['responsibility_role'] ?? null,
            $validated['responsibility_note'] ?? null,
            $request->user()->id
        );

        return back()->with('success', '已标记为爽约');
    }

    public function adjustResponsibility(Request $request, TestDrive $testDrive): RedirectResponse
    {
        $validated = $request->validate([
            'new_responsibility_role' => 'nullable|integer',
            'new_assigned_user_id' => 'nullable|exists:users,id',
            'reason' => 'required|string|min:5',
            'impacted_areas' => 'nullable|string',
            'supplement_note' => 'nullable|string',
            'review_material_id' => 'nullable|exists:review_materials,id',
        ]);

        $adjustment = $testDrive->adjustResponsibility(
            $validated['new_responsibility_role'] ?? null,
            $validated['new_assigned_user_id'] ?? null,
            $validated['reason'],
            $validated['impacted_areas'] ?? null,
            $validated['supplement_note'] ?? null,
            $request->user()->id
        );

        if (!empty($validated['review_material_id'])) {
            $adjustment->review_material_id = $validated['review_material_id'];
            $adjustment->save();

            $review = ReviewMaterial::find($validated['review_material_id']);
            if ($review) {
                foreach ($testDrive->timelines as $tl) {
                    if (!$review->timelinesLinked()->where('timeline_id', $tl->id)->exists()) {
                        $review->linkTimeline($tl, 3, '关联自责任调整流程');
                    }
                }
            }
        }

        return back()->with('success', '责任归属已调整');
    }

    public function batchUpdate(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'ids' => 'required|array|min:1',
            'ids.*' => 'exists:test_drives,id',
            'action' => 'required|string|in:confirm,close,assign',
            'assigned_user_id' => 'nullable|exists:users,id',
        ]);

        $ids = $validated['ids'];
        $action = $validated['action'];
        $userId = $request->user()->id;

        TestDrive::whereIn('id', $ids)->get()->each(function (TestDrive $td) use ($action, $validated, $userId) {
            switch ($action) {
                case 'confirm':
                    $td->confirm($userId);
                    break;
                case 'close':
                    $td->close('批量关闭', $userId);
                    break;
                case 'assign':
                    if (!empty($validated['assigned_user_id'])) {
                        $oldAssigned = $td->assigned_user_id;
                        $td->assigned_user_id = $validated['assigned_user_id'];
                        $td->save();
                        $td->addTimeline(
                            TimelineCategory::ASSIGNMENT,
                            4,
                            '批量分配处理人',
                            sprintf('从 ID:%s 变更为 ID:%s', $oldAssigned ?? '空', $validated['assigned_user_id']),
                            'assigned_user_id',
                            $oldAssigned,
                            $validated['assigned_user_id']
                        );
                    }
                    break;
            }
        });

        return back()->with('success', sprintf('已批量处理 %d 条记录', count($ids)));
    }
}
