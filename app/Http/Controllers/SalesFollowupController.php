<?php

namespace App\Http\Controllers;

use App\Enums\TimelineCategory;
use App\Enums\IntentLevel;
use App\Models\SalesFollowup;
use App\Models\Customer;
use App\Models\TestDrive;
use App\Models\Vehicle;
use App\Models\Store;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;

class SalesFollowupController extends Controller
{
    public function index(Request $request): Response
    {
        $filters = $request->only([
            'search', 'status', 'store_id', 'user_id', 'customer_id',
            'test_drive_id', 'type', 'channel', 'date_from', 'date_to',
            'is_overdue', 'need_followup',
        ]);

        $user = $request->user();
        $scopeStore = $user->hasRole('store_manager') || $user->hasRole('sales') ? $user->store_id : null;
        $scopeUser = $user->hasRole('sales') ? $user->id : null;

        $query = SalesFollowup::with([
            'customer:id,name,phone,intent_level',
            'testDrive:id,code,status,appointment_at',
            'vehicle:id,brand,model',
            'user:id,name',
            'store:id,name',
        ])->when($scopeStore, fn($q) => $q->where('store_id', $scopeStore))
          ->when($scopeUser, fn($q) => $q->where('user_id', $scopeUser))
          ->when($filters['search'] ?? null, function ($q, $search) {
              $q->whereHas('customer', fn($cq) => $cq->where('name', 'like', "%{$search}%")->orWhere('phone', 'like', "%{$search}%"))
                ->orWhere('content_summary', 'like', "%{$search}%")
                ->orWhere('code', 'like', "%{$search}%");
          })
          ->when($filters['status'] ?? null, fn($q, $s) => $q->where('status', $s))
          ->when($filters['store_id'] ?? null, fn($q, $s) => $q->where('store_id', $s))
          ->when($filters['user_id'] ?? null, fn($q, $u) => $q->where('user_id', $u))
          ->when($filters['customer_id'] ?? null, fn($q, $c) => $q->where('customer_id', $c))
          ->when($filters['test_drive_id'] ?? null, fn($q, $t) => $q->where('test_drive_id', $t))
          ->when($filters['type'] ?? null, fn($q, $t) => $q->where('type', $t))
          ->when($filters['channel'] ?? null, fn($q, $c) => $q->where('channel', $c))
          ->when($filters['date_from'] ?? null, fn($q, $d) => $q->whereDate('followup_at', '>=', $d))
          ->when($filters['date_to'] ?? null, fn($q, $d) => $q->whereDate('followup_at', '<=', $d))
          ->when(($filters['is_overdue'] ?? null) == 1, function ($q) {
              $q->where('next_followup_at', '<', now())->where('status', 1);
          })
          ->when(($filters['need_followup'] ?? null) == 1, function ($q) {
              $q->whereBetween('next_followup_at', [now(), now()->addDays(3)])->where('status', 1);
          })
          ->orderByDesc('followup_at');

        $perPage = (int) ($request->input('per_page', 20));
        $followups = $query->paginate($perPage)->withQueryString();

        $aggregates = [
            'total' => (clone $query)->count(),
            'today' => (clone $query)->whereDate('followup_at', today())->count(),
            'overdue' => (clone $query)->where('next_followup_at', '<', now())->where('status', 1)->count(),
            'upcoming' => (clone $query)->whereBetween('next_followup_at', [now(), now()->addDays(3)])->where('status', 1)->count(),
        ];

        return Inertia::render('Followups/Index', [
            'followups' => $followups,
            'filters' => $filters,
            'aggregates' => $aggregates,
            'filterOptions' => [
                'types' => [
                    ['value' => 1, 'label' => '首次跟进'],
                    ['value' => 2, 'label' => '日常跟进'],
                    ['value' => 3, 'label' => '试驾后跟进'],
                    ['value' => 4, 'label' => '异议处理'],
                    ['value' => 5, 'label' => '成交跟进'],
                    ['value' => 6, 'label' => '售后回访'],
                ],
                'channels' => [
                    ['value' => 1, 'label' => '电话'],
                    ['value' => 2, 'label' => '微信'],
                    ['value' => 3, 'label' => '短信'],
                    ['value' => 4, 'label' => '到店'],
                    ['value' => 5, 'label' => '上门'],
                    ['value' => 6, 'label' => '邮件'],
                    ['value' => 7, 'label' => '其他'],
                ],
                'stores' => Store::select('id', 'name')->where('status', 1)->get(),
                'users' => User::select('id', 'name')->where('status', 1)
                    ->when($scopeStore, fn($q) => $q->where('store_id', $scopeStore))->get(),
            ],
        ]);
    }

    public function create(Request $request): Response
    {
        $storeId = $request->user()->store_id;
        $customerId = $request->query('customer_id');
        $testDriveId = $request->query('test_drive_id');

        return Inertia::render('Followups/Create', [
            'preselected' => [
                'customer_id' => $customerId,
                'test_drive_id' => $testDriveId,
                'store_id' => $storeId,
                'user_id' => $request->user()->id,
            ],
            'options' => [
                'types' => [
                    ['value' => 1, 'label' => '首次跟进'],
                    ['value' => 2, 'label' => '日常跟进'],
                    ['value' => 3, 'label' => '试驾后跟进'],
                    ['value' => 4, 'label' => '异议处理'],
                    ['value' => 5, 'label' => '成交跟进'],
                    ['value' => 6, 'label' => '售后回访'],
                ],
                'channels' => [
                    ['value' => 1, 'label' => '电话'],
                    ['value' => 2, 'label' => '微信'],
                    ['value' => 3, 'label' => '短信'],
                    ['value' => 4, 'label' => '到店'],
                    ['value' => 5, 'label' => '上门'],
                    ['value' => 6, 'label' => '邮件'],
                    ['value' => 7, 'label' => '其他'],
                ],
                'stores' => Store::select('id', 'name')->where('status', 1)->get(),
                'users' => User::select('id', 'name')->where('status', 1)
                    ->when($storeId, fn($q) => $q->where('store_id', $storeId))->get(),
                'customers' => Customer::select('id', 'name', 'phone')
                    ->when($storeId, fn($q) => $q->where('store_id', $storeId))
                    ->limit(50)->orderByDesc('created_at')->get(),
                'vehicles' => Vehicle::select('id', 'brand', 'model', 'plate_number')
                    ->when($storeId, fn($q) => $q->where('store_id', $storeId))
                    ->where('status', 1)->limit(50)->get(),
                'testDrives' => $testDriveId ? TestDrive::with('customer:id,name,phone')->where('id', $testDriveId)->get() : [],
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'customer_id' => 'required|exists:customers,id',
            'test_drive_id' => 'nullable|exists:test_drives,id',
            'vehicle_id' => 'nullable|exists:vehicles,id',
            'store_id' => 'nullable|exists:stores,id',
            'user_id' => 'nullable|exists:users,id',
            'type' => 'nullable|integer',
            'channel' => 'nullable|integer',
            'followup_at' => 'nullable|date',
            'next_followup_at' => 'nullable|date',
            'intent_change' => 'nullable|integer',
            'content_summary' => 'nullable|string|max:500',
            'content_detail' => 'nullable|string',
            'customer_question' => 'nullable|string',
            'objection' => 'nullable|string',
            'solution' => 'nullable|string',
            'remark' => 'nullable|string',
        ]);

        $validated['followup_at'] = $validated['followup_at'] ?? now()->toDateTimeString();
        $validated['status'] = 1;

        $followup = SalesFollowup::create($validated);

        if ($followup->intent_change && $followup->customer) {
            $customer = $followup->customer;
            $oldIntent = $customer->intent_level;
            $customer->intent_level = $followup->intent_change;
            $customer->save();

            $customer->addTimeline(
                TimelineCategory::CUSTOMER,
                6,
                '意向等级变更',
                sprintf('跟进记录触发变更：%s', $followup->code),
                'intent_level',
                $oldIntent?->value,
                $followup->intent_change
            );
        }

        $followup->addTimeline(
            TimelineCategory::CUSTOMER,
            7,
            '创建跟进记录',
            $followup->content_summary
        );

        if ($followup->test_drive_id && $followup->customer) {
            $testDrive = TestDrive::find($followup->test_drive_id);
            if ($testDrive) {
                $testDrive->addTimeline(
                    TimelineCategory::CUSTOMER,
                    8,
                    '新增销售跟进',
                    sprintf('渠道：%s；摘要：%s', $followup->channel, $followup->content_summary ?? '无')
                );
            }
        }

        return redirect()->route('followups.show', $followup)->with('success', '跟进记录创建成功');
    }

    public function show(Request $request, SalesFollowup $followup): Response
    {
        $followup->load([
            'customer', 'testDrive', 'vehicle', 'store', 'user',
            'attachments.creator',
            'notes.creator',
            'timelines.user', 'timelines.reviewMaterials',
        ]);

        return Inertia::render('Followups/Show', [
            'followup' => $followup,
        ]);
    }

    public function update(Request $request, SalesFollowup $followup): RedirectResponse
    {
        $validated = $request->validate([
            'type' => 'nullable|integer',
            'channel' => 'nullable|integer',
            'followup_at' => 'nullable|date',
            'next_followup_at' => 'nullable|date',
            'status' => 'nullable|integer',
            'intent_change' => 'nullable|integer',
            'content_summary' => 'nullable|string|max:500',
            'content_detail' => 'nullable|string',
            'customer_question' => 'nullable|string',
            'objection' => 'nullable|string',
            'solution' => 'nullable|string',
            'remark' => 'nullable|string',
        ]);

        $original = $followup->getOriginal();
        $followup->fill($validated);
        $dirty = $followup->getDirty();

        if (!empty($dirty)) {
            $followup->updated_by = $request->user()->id;
            $followup->save();

            foreach ($dirty as $field => $newValue) {
                if (in_array($field, ['updated_by', 'updated_at'])) continue;
                $followup->addTimeline(
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

        return back()->with('success', '跟进记录已更新');
    }

    public function batchComplete(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'ids' => 'required|array|min:1',
            'ids.*' => 'exists:sales_followups,id',
        ]);

        $userId = $request->user()->id;
        SalesFollowup::whereIn('id', $validated['ids'])->get()->each(function (SalesFollowup $f) use ($userId) {
            $f->status = 2;
            $f->updated_by = $userId;
            $f->save();
            $f->addTimeline(
                TimelineCategory::STATUS_CHANGE,
                1,
                '批量完成跟进',
                null,
                'status', 1, 2
            );
        });

        return back()->with('success', sprintf('已完成 %d 条跟进', count($validated['ids'])));
    }
}
