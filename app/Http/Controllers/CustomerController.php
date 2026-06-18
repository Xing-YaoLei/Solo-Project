<?php

namespace App\Http\Controllers;

use App\Enums\IntentLevel;
use App\Enums\TimelineCategory;
use App\Models\Customer;
use App\Models\TestDrive;
use App\Models\SalesFollowup;
use App\Models\Store;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;

class CustomerController extends Controller
{
    public function index(Request $request): Response
    {
        $filters = $request->only([
            'search', 'status', 'store_id', 'assigned_user_id',
            'intent_level', 'source_channel', 'city', 'has_test_drive',
            'followup_overdue', 'created_from', 'created_to',
        ]);

        $user = $request->user();
        $scopeStore = $user->hasRole('store_manager') || $user->hasRole('sales') ? $user->store_id : null;

        $query = Customer::with(['store:id,name', 'assignedUser:id,name'])
            ->withCount(['testDrives', 'followups'])
            ->when($scopeStore, fn($q) => $q->where('store_id', $scopeStore))
            ->when($filters['search'] ?? null, function ($q, $search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%")
                  ->orWhere('phone_secondary', 'like', "%{$search}%");
            })
            ->when($filters['status'] ?? null, fn($q, $s) => $q->where('status', $s))
            ->when($filters['store_id'] ?? null, fn($q, $s) => $q->where('store_id', $s))
            ->when($filters['assigned_user_id'] ?? null, fn($q, $u) => $q->where('assigned_user_id', $u))
            ->when($filters['intent_level'] ?? null, fn($q, $i) => $q->where('intent_level', $i))
            ->when($filters['source_channel'] ?? null, fn($q, $c) => $q->where('source_channel', $c))
            ->when($filters['city'] ?? null, fn($q, $c) => $q->where('city', $c))
            ->when(($filters['has_test_drive'] ?? null) !== null, function ($q) use ($filters) {
                $has = (bool) $filters['has_test_drive'];
                $has ? $q->whereHas('testDrives') : $q->whereDoesntHave('testDrives');
            })
            ->when(($filters['followup_overdue'] ?? null) == 1, function ($q) {
                $q->whereHas('followups', function ($fq) {
                    $fq->where('next_followup_at', '<', now())->where('status', 1);
                });
            })
            ->when($filters['created_from'] ?? null, fn($q, $d) => $q->whereDate('created_at', '>=', $d))
            ->when($filters['created_to'] ?? null, fn($q, $d) => $q->whereDate('created_at', '<=', $d))
            ->orderByDesc('created_at');

        $perPage = (int) ($request->input('per_page', 20));
        $customers = $query->paginate($perPage)->withQueryString();

        $aggregates = [
            'total' => (clone $query)->count(),
            'high_intent' => (clone $query)->whereIn('intent_level', [IntentLevel::HIGH->value, IntentLevel::VERY_HIGH->value, IntentLevel::DEPOSITED->value])->count(),
            'with_test_drive' => (clone $query)->whereHas('testDrives')->count(),
            'without_followup' => (clone $query)->whereDoesntHave('followups')->count(),
        ];

        $conversionStats = [
            'by_intent' => Customer::selectRaw('intent_level, COUNT(*) as count')
                ->groupBy('intent_level')
                ->when($scopeStore, fn($q) => $q->where('store_id', $scopeStore))
                ->get()
                ->map(function ($row) {
                    $level = IntentLevel::tryFrom($row->intent_level);
                    return ['level' => $row->intent_level, 'label' => $level?->label() ?? '未知', 'count' => $row->count];
                }),
            'by_channel' => Customer::selectRaw('source_channel, COUNT(*) as count')
                ->whereNotNull('source_channel')
                ->groupBy('source_channel')
                ->when($scopeStore, fn($q) => $q->where('store_id', $scopeStore))
                ->limit(10)
                ->get(),
            'test_drive_conversion' => [
                'total' => (clone $query)->count(),
                'booked' => (clone $query)->whereHas('testDrives')->count(),
                'completed' => (clone $query)->whereHas('testDrives', fn($q) => $q->where('status', \App\Enums\TestDriveStatus::COMPLETED->value))->count(),
            ],
        ];

        return Inertia::render('Customers/Index', [
            'customers' => $customers,
            'filters' => $filters,
            'aggregates' => $aggregates,
            'conversionStats' => $conversionStats,
            'filterOptions' => [
                'intentLevels' => collect(IntentLevel::cases())->map(fn($i) => ['value' => $i->value, 'label' => $i->label()]),
                'stores' => Store::select('id', 'name')->where('status', 1)->get(),
                'assignedUsers' => User::select('id', 'name')->where('status', 1)->when($scopeStore, fn($q) => $q->where('store_id', $scopeStore))->get(),
            ],
        ]);
    }

    public function create(Request $request): Response
    {
        $storeId = $request->user()->store_id;
        return Inertia::render('Customers/Create', [
            'options' => [
                'intentLevels' => collect(IntentLevel::cases())->map(fn($i) => ['value' => $i->value, 'label' => $i->label()]),
                'stores' => Store::select('id', 'name')->where('status', 1)->get(),
                'assignedUsers' => User::select('id', 'name')->where('status', 1)
                    ->when($storeId, fn($q) => $q->where('store_id', $storeId))->get(),
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:50',
            'phone' => 'required|string|max:20',
            'phone_secondary' => 'nullable|string|max:20',
            'gender' => 'nullable|integer',
            'age' => 'nullable|integer',
            'occupation' => 'nullable|string|max:50',
            'city' => 'nullable|string|max:50',
            'district' => 'nullable|string|max:50',
            'source_channel' => 'nullable|string|max:50',
            'intent_level' => 'nullable|integer',
            'tags' => 'nullable|array',
            'remark' => 'nullable|string',
            'store_id' => 'nullable|exists:stores,id',
            'assigned_user_id' => 'nullable|exists:users,id',
        ]);

        $validated['created_by'] = $request->user()->id;
        $validated['updated_by'] = $request->user()->id;
        $validated['intent_level'] = $validated['intent_level'] ?? IntentLevel::LOW->value;

        $customer = Customer::create($validated);

        $customer->addTimeline(
            TimelineCategory::CUSTOMER,
            0,
            '创建客户线索',
            $request->input('remark') ?? '客户档案创建'
        );

        return redirect()->route('customers.show', $customer)->with('success', '客户创建成功');
    }

    public function show(Request $request, Customer $customer): Response
    {
        $customer->load([
            'store', 'assignedUser',
            'testDrives.customer', 'testDrives.vehicle', 'testDrives.salesUser', 'testDrives.assignedUser',
            'followups.testDrive', 'followups.vehicle', 'followups.user',
            'reviewMaterials.creator',
            'attachments.creator',
            'notes.creator',
            'timelines.user', 'timelines.reviewMaterials',
        ]);

        return Inertia::render('Customers/Show', [
            'customer' => $customer,
            'intentOptions' => collect(IntentLevel::cases())->map(fn($i) => ['value' => $i->value, 'label' => $i->label()]),
            'statusOptions' => [
                ['value' => 1, 'label' => '有效'],
                ['value' => 2, 'label' => '已成交'],
                ['value' => 3, 'label' => '无效'],
                ['value' => 4, 'label' => '暂停跟进'],
            ],
        ]);
    }

    public function update(Request $request, Customer $customer): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'nullable|string|max:50',
            'phone' => 'nullable|string|max:20',
            'phone_secondary' => 'nullable|string|max:20',
            'gender' => 'nullable|integer',
            'age' => 'nullable|integer',
            'occupation' => 'nullable|string|max:50',
            'city' => 'nullable|string|max:50',
            'district' => 'nullable|string|max:50',
            'source_channel' => 'nullable|string|max:50',
            'intent_level' => 'nullable|integer',
            'status' => 'nullable|integer',
            'tags' => 'nullable|array',
            'remark' => 'nullable|string',
            'store_id' => 'nullable|exists:stores,id',
            'assigned_user_id' => 'nullable|exists:users,id',
        ]);

        $original = $customer->getOriginal();
        $customer->fill($validated);
        $dirty = $customer->getDirty();

        if (!empty($dirty)) {
            $customer->updated_by = $request->user()->id;
            $customer->save();

            foreach ($dirty as $field => $newValue) {
                if (in_array($field, ['updated_by', 'updated_at'])) continue;
                $customer->addTimeline(
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

        return back()->with('success', '客户信息已更新');
    }

    public function batchAssign(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'ids' => 'required|array|min:1',
            'ids.*' => 'exists:customers,id',
            'assigned_user_id' => 'required|exists:users,id',
        ]);

        $userId = $request->user()->id;
        Customer::whereIn('id', $validated['ids'])->get()->each(function (Customer $c) use ($validated, $userId) {
            $oldAssigned = $c->assigned_user_id;
            $c->assigned_user_id = $validated['assigned_user_id'];
            $c->updated_by = $userId;
            $c->save();
            $c->addTimeline(
                TimelineCategory::ASSIGNMENT,
                4,
                '批量分配销售',
                null,
                'assigned_user_id',
                $oldAssigned,
                $validated['assigned_user_id']
            );
        });

        return back()->with('success', sprintf('已批量分配 %d 个客户', count($validated['ids'])));
    }
}
