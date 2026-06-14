<?php

namespace App\Http\Controllers;

use App\Models\TimeSlot;
use App\Models\CapacityRule;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TimeSlotController extends Controller
{
    public function index(Request $request)
    {
        $timeSlots = TimeSlot::with('capacityRules')
            ->orderBy('start_time')
            ->paginate(20);

        return Inertia::render('TimeSlots/Index', [
            'timeSlots' => $timeSlots,
        ]);
    }

    public function create()
    {
        return Inertia::render('TimeSlots/Create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'required|date_format:H:i|after:start_time',
            'default_capacity' => 'required|integer|min:1',
            'day_of_week' => 'nullable|integer|min:0|max:6',
            'is_active' => 'boolean',
            'remark' => 'nullable|string',
        ]);

        $timeSlot = TimeSlot::create($validated);

        return redirect()->route('time-slots.index')
            ->with('success', '时段创建成功');
    }

    public function edit(TimeSlot $timeSlot)
    {
        return Inertia::render('TimeSlots/Edit', [
            'timeSlot' => $timeSlot->load('capacityRules'),
        ]);
    }

    public function update(Request $request, TimeSlot $timeSlot)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'required|date_format:H:i|after:start_time',
            'default_capacity' => 'required|integer|min:1',
            'day_of_week' => 'nullable|integer|min:0|max:6',
            'is_active' => 'boolean',
            'remark' => 'nullable|string',
        ]);

        $timeSlot->update($validated);

        return redirect()->route('time-slots.index')
            ->with('success', '时段更新成功');
    }

    public function destroy(TimeSlot $timeSlot)
    {
        $timeSlot->delete();

        return redirect()->route('time-slots.index')
            ->with('success', '时段已删除');
    }

    public function addRule(Request $request, TimeSlot $timeSlot)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'rule_type' => 'required|in:default,special,holiday',
            'apply_date' => 'nullable|date',
            'day_of_week' => 'nullable|integer|min:0|max:6',
            'max_capacity' => 'required|integer|min:1',
            'warn_capacity' => 'nullable|integer|min:0',
            'is_active' => 'boolean',
            'remark' => 'nullable|string',
        ]);

        $rule = new CapacityRule($validated);
        $timeSlot->capacityRules()->save($rule);

        return redirect()->route('time-slots.edit', $timeSlot)
            ->with('success', '容量规则添加成功');
    }

    public function updateRule(Request $request, CapacityRule $rule)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'rule_type' => 'required|in:default,special,holiday',
            'apply_date' => 'nullable|date',
            'day_of_week' => 'nullable|integer|min:0|max:6',
            'max_capacity' => 'required|integer|min:1',
            'warn_capacity' => 'nullable|integer|min:0',
            'is_active' => 'boolean',
            'remark' => 'nullable|string',
        ]);

        $rule->update($validated);

        return redirect()->route('time-slots.edit', $rule->time_slot_id)
            ->with('success', '容量规则更新成功');
    }

    public function deleteRule(CapacityRule $rule)
    {
        $timeSlotId = $rule->time_slot_id;
        $rule->delete();

        return redirect()->route('time-slots.edit', $timeSlotId)
            ->with('success', '容量规则已删除');
    }
}
