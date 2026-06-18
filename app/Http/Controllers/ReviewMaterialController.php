<?php

namespace App\Http\Controllers;

use App\Enums\TimelineCategory;
use App\Models\ReviewMaterial;
use App\Models\TestDrive;
use App\Models\Customer;
use App\Models\Store;
use App\Models\User;
use App\Models\Timeline;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;

class ReviewMaterialController extends Controller
{
    public function index(Request $request): Response
    {
        $filters = $request->only([
            'search', 'status', 'store_id', 'created_by', 'type', 'level',
            'test_drive_id', 'customer_id', 'date_from', 'date_to',
        ]);

        $user = $request->user();
        $scopeStore = $user->hasRole('store_manager') ? $user->store_id : null;

        $query = ReviewMaterial::with([
            'testDrive:id,code,appointment_at',
            'customer:id,name,phone',
            'store:id,name',
            'creator:id,name',
        ])->withCount('timelinesLinked')
          ->when($scopeStore, fn($q) => $q->where('store_id', $scopeStore))
          ->when($filters['search'] ?? null, function ($q, $search) {
              $q->where('title', 'like', "%{$search}%")
                ->orWhere('code', 'like', "%{$search}%")
                ->orWhere('summary', 'like', "%{$search}%");
          })
          ->when($filters['status'] ?? null, fn($q, $s) => $q->where('status', $s))
          ->when($filters['store_id'] ?? null, fn($q, $s) => $q->where('store_id', $s))
          ->when($filters['created_by'] ?? null, fn($q, $u) => $q->where('created_by', $u))
          ->when($filters['type'] ?? null, fn($q, $t) => $q->where('type', $t))
          ->when($filters['level'] ?? null, fn($q, $l) => $q->where('level', $l))
          ->when($filters['test_drive_id'] ?? null, fn($q, $t) => $q->where('test_drive_id', $t))
          ->when($filters['customer_id'] ?? null, fn($q, $c) => $q->where('customer_id', $c))
          ->when($filters['date_from'] ?? null, fn($q, $d) => $q->whereDate('created_at', '>=', $d))
          ->when($filters['date_to'] ?? null, fn($q, $d) => $q->whereDate('created_at', '<=', $d))
          ->orderByDesc('created_at');

        $perPage = (int) ($request->input('per_page', 20));
        $reviews = $query->paginate($perPage)->withQueryString();

        return Inertia::render('Reviews/Index', [
            'reviews' => $reviews,
            'filters' => $filters,
            'filterOptions' => [
                'types' => [
                    ['value' => 1, 'label' => '爽约复盘'],
                    ['value' => 2, 'label' => '投诉处理'],
                    ['value' => 3, 'label' => '事故复盘'],
                    ['value' => 4, 'label' => '优秀案例'],
                    ['value' => 5, 'label' => '日常复盘'],
                    ['value' => 9, 'label' => '其他'],
                ],
                'levels' => [
                    ['value' => 1, 'label' => '一般'],
                    ['value' => 2, 'label' => '重要'],
                    ['value' => 3, 'label' => '紧急'],
                    ['value' => 4, 'label' => '重大'],
                ],
                'statuses' => [
                    ['value' => 1, 'label' => '草稿'],
                    ['value' => 2, 'label' => '待审核'],
                    ['value' => 3, 'label' => '已审核'],
                    ['value' => 4, 'label' => '已归档'],
                ],
                'stores' => Store::select('id', 'name')->where('status', 1)->get(),
                'creators' => User::select('id', 'name')->where('status', 1)->get(),
            ],
        ]);
    }

    public function create(Request $request): Response
    {
        $storeId = $request->user()->store_id;
        $testDriveId = $request->query('test_drive_id');
        $customerId = $request->query('customer_id');

        $sourceTimelines = [];
        if ($testDriveId) {
            $td = TestDrive::with('timelines.user')->find($testDriveId);
            if ($td) {
                $sourceTimelines = $td->timelines->map(fn($t) => [
                    'id' => $t->id, 'source' => 'test_drive',
                    'category' => $t->category?->value, 'action_name' => $t->action_name,
                    'content' => $t->content, 'created_at' => $t->created_at,
                    'user_name' => $t->user?->name,
                ])->toArray();
            }
        }
        if ($customerId) {
            $c = Customer::with('timelines.user')->find($customerId);
            if ($c) {
                foreach ($c->timelines as $t) {
                    $sourceTimelines[] = [
                        'id' => $t->id, 'source' => 'customer',
                        'category' => $t->category?->value, 'action_name' => $t->action_name,
                        'content' => $t->content, 'created_at' => $t->created_at,
                        'user_name' => $t->user?->name,
                    ];
                }
            }
        }

        return Inertia::render('Reviews/Create', [
            'preselected' => [
                'test_drive_id' => $testDriveId,
                'customer_id' => $customerId,
                'store_id' => $storeId,
                'created_by' => $request->user()->id,
            ],
            'sourceTimelines' => $sourceTimelines,
            'options' => [
                'types' => [
                    ['value' => 1, 'label' => '爽约复盘'],
                    ['value' => 2, 'label' => '投诉处理'],
                    ['value' => 3, 'label' => '事故复盘'],
                    ['value' => 4, 'label' => '优秀案例'],
                    ['value' => 5, 'label' => '日常复盘'],
                    ['value' => 9, 'label' => '其他'],
                ],
                'levels' => [
                    ['value' => 1, 'label' => '一般'],
                    ['value' => 2, 'label' => '重要'],
                    ['value' => 3, 'label' => '紧急'],
                    ['value' => 4, 'label' => '重大'],
                ],
                'stores' => Store::select('id', 'name')->where('status', 1)->get(),
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:200',
            'type' => 'nullable|integer',
            'level' => 'nullable|integer',
            'summary' => 'nullable|string',
            'background' => 'nullable|string',
            'process_description' => 'nullable|string',
            'problem_analysis' => 'nullable|string',
            'improvement_measures' => 'nullable|string',
            'lessons_learned' => 'nullable|string',
            'action_items' => 'nullable|array',
            'test_drive_id' => 'nullable|exists:test_drives,id',
            'customer_id' => 'nullable|exists:customers,id',
            'store_id' => 'nullable|exists:stores,id',
            'timeline_ids' => 'nullable|array',
            'timeline_ids.*' => 'exists:timelines,id',
        ]);

        $validated['status'] = 1;
        $timelineIds = $request->input('timeline_ids', []);
        unset($validated['timeline_ids']);

        $review = ReviewMaterial::create($validated);

        if (!empty($timelineIds)) {
            foreach ($timelineIds as $timelineId) {
                $timeline = Timeline::find($timelineId);
                if ($timeline) {
                    $review->linkTimeline($timeline, 1, '创建复盘时关联');
                }
            }
        }

        $linkedCount = $review->linkRelatedTimelinesFromSource();

        $review->addTimeline(
            TimelineCategory::REVIEW,
            0,
            '创建复盘材料',
            sprintf('关联处理记录 %d 条', count($timelineIds) + $linkedCount)
        );

        if ($review->testDrive) {
            $review->testDrive->addTimeline(
                TimelineCategory::REVIEW,
                9,
                '关联复盘材料创建',
                sprintf('复盘编号：%s；标题：%s', $review->code, $review->title),
                'review_material_id', null, $review->id
            );
        }

        return redirect()->route('reviews.show', $review)->with('success', '复盘材料创建成功');
    }

    public function show(Request $request, ReviewMaterial $review): Response
    {
        $review->load([
            'testDrive', 'customer', 'store',
            'creator', 'reviewer',
            'timelinesLinked.timelineable', 'timelinesLinked.user',
            'attachments.creator',
            'notes.creator',
            'timelines.user',
        ]);

        $linkedSources = $review->getLinkedSourceRecords();

        $availableTimelines = collect();
        if ($review->testDrive) {
            $existingIds = $review->timelinesLinked->pluck('id')->toArray();
            $tdTimelines = Timeline::where('timelineable_type', TestDrive::class)
                ->where('timelineable_id', $review->testDrive->id)
                ->whereNotIn('id', $existingIds)
                ->with('user')->latest()->limit(50)->get();
            $availableTimelines = $availableTimelines->merge($tdTimelines);
        }
        if ($review->customer) {
            $existingIds = $review->timelinesLinked->pluck('id')->toArray();
            $cTimelines = Timeline::where('timelineable_type', Customer::class)
                ->where('timelineable_id', $review->customer->id)
                ->whereNotIn('id', $existingIds)
                ->with('user')->latest()->limit(50)->get();
            $availableTimelines = $availableTimelines->merge($cTimelines);
        }

        return Inertia::render('Reviews/Show', [
            'review' => $review,
            'linkedSources' => $linkedSources,
            'availableTimelines' => $availableTimelines,
        ]);
    }

    public function update(Request $request, ReviewMaterial $review): RedirectResponse
    {
        $validated = $request->validate([
            'title' => 'nullable|string|max:200',
            'type' => 'nullable|integer',
            'level' => 'nullable|integer',
            'status' => 'nullable|integer',
            'summary' => 'nullable|string',
            'background' => 'nullable|string',
            'process_description' => 'nullable|string',
            'problem_analysis' => 'nullable|string',
            'improvement_measures' => 'nullable|string',
            'lessons_learned' => 'nullable|string',
            'action_items' => 'nullable|array',
            'review_opinion' => 'nullable|string',
        ]);

        $original = $review->getOriginal();
        $review->fill($validated);
        $dirty = $review->getDirty();

        if (!empty($dirty)) {
            $review->updated_by = $request->user()->id;
            if ($dirty['status'] ?? false && $dirty['status'] >= 3) {
                $review->reviewed_by = $request->user()->id;
                $review->reviewed_at = now();
            }
            $review->save();

            foreach ($dirty as $field => $newValue) {
                if (in_array($field, ['updated_by', 'updated_at', 'reviewed_by', 'reviewed_at'])) continue;
                $review->addTimeline(
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

        return back()->with('success', '复盘材料已更新');
    }

    public function linkTimeline(Request $request, ReviewMaterial $review): RedirectResponse
    {
        $validated = $request->validate([
            'timeline_id' => 'required|exists:timelines,id',
            'relation_type' => 'nullable|integer',
            'relation_note' => 'nullable|string',
        ]);

        $timeline = Timeline::findOrFail($validated['timeline_id']);

        if (!$review->timelinesLinked()->where('timeline_id', $timeline->id)->exists()) {
            $review->linkTimeline(
                $timeline,
                $validated['relation_type'] ?? 1,
                $validated['relation_note'] ?? null
            );
        }

        return back()->with('success', '已关联处理记录');
    }

    public function unlinkTimeline(Request $request, ReviewMaterial $review, int $timelineId): RedirectResponse
    {
        $review->timelinesLinked()->detach($timelineId);
        return back()->with('success', '已取消关联');
    }
}
