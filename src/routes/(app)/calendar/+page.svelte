<script lang="ts">
	import { trpcClient } from '$lib/trpc/client';
	import { onMount } from 'svelte';
	import {
		startOfMonth, endOfMonth, eachDayOfInterval, format, addMonths, subMonths,
		isToday, startOfDay
	} from 'date-fns';
	import { ROOM_STATUS_LABELS, type RoomStatusType } from '$lib/types';

	// ===== 状态（State）=====
	let properties: any[] = [];
	let calendars: any[] = [];
	let loading = true;
	let currentMonth = startOfMonth(new Date());
	let selectedPropertyIds: string[] = [];
	let propertiesLoaded = false;
	let autoSelectedDone = false;

	let editingCell: any = null;
	let editStatus: RoomStatusType = 'available';
	let editNotes = '';
	let editPrice: number | null = null;

	// ===== 派生（Derived）=====
	let visibleProps: any[];
	$: visibleProps = properties.filter((p) => selectedPropertyIds.includes(p.id));

	let daysInMonth: Date[];
	$: daysInMonth = eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) });

	const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

	let calendarMap: Map<string, any>;
	$: {
		calendarMap = new Map();
		for (const cal of calendars) {
			const key = `${cal.propertyId}_${startOfDay(new Date(cal.date)).getTime()}`;
			calendarMap.set(key, cal);
		}
	}

	function getCal(propId: string, day: Date) {
		return calendarMap.get(`${propId}_${startOfDay(day).getTime()}`);
	}

	const statusColors: Record<string, string> = {
		available: 'bg-green-50 text-green-800 border-green-200',
		booked: 'bg-red-50 text-red-800 border-red-200',
		occupied: 'bg-orange-50 text-orange-800 border-orange-200',
		cleaning: 'bg-purple-50 text-purple-800 border-purple-200',
		maintenance: 'bg-gray-100 text-gray-700 border-gray-300',
		blocked: 'bg-slate-700 text-white border-slate-800'
	};

	// ===== 响应式副作用（Reactive Effects）=====
	$: if (propertiesLoaded && properties.length > 0 && !autoSelectedDone) {
		autoSelectedDone = true;
		selectedPropertyIds = properties.map((p) => p.id);
	}

	$: if (propertiesLoaded && selectedPropertyIds.length > 0 && autoSelectedDone) {
		loadCalendar(currentMonth, selectedPropertyIds);
	}

	// ===== 动作（Actions）=====
	function prevMonth() { currentMonth = subMonths(currentMonth, 1); }
	function nextMonth() { currentMonth = addMonths(currentMonth, 1); }
	function today() { currentMonth = startOfMonth(new Date()); }

	function toggleProperty(id: string) {
		if (selectedPropertyIds.includes(id)) {
			selectedPropertyIds = selectedPropertyIds.filter((x) => x !== id);
		} else {
			selectedPropertyIds = [...selectedPropertyIds, id];
		}
	}

	function selectAll() {
		selectedPropertyIds = properties.map((p) => p.id);
	}

	function clearSelection() {
		selectedPropertyIds = [];
	}

	async function loadProperties() {
		properties = await trpcClient.property.list.query({ status: 'active' });
		propertiesLoaded = true;
	}

	async function loadCalendar(month: Date, propIds: string[]) {
		if (propIds.length === 0) {
			calendars = [];
			return;
		}
		loading = true;
		try {
			calendars = await trpcClient.property.getCalendar.query({
				propertyIds: propIds,
				startDate: startOfDay(new Date(startOfMonth(month).getTime() - 7 * 86400000)),
				endDate: startOfDay(new Date(endOfMonth(month).getTime() + 7 * 86400000))
			});
		} finally {
			loading = false;
		}
	}

	function refreshCalendar() {
		loadCalendar(currentMonth, selectedPropertyIds);
	}

	async function loadAll() {
		loading = true;
		try {
			await loadProperties();
		} finally {
			loading = false;
		}
	}

	onMount(loadAll);

	function openEdit(propId: string, day: Date, existing: any) {
		editingCell = { propId, day };
		editStatus = existing?.status ?? 'available';
		editNotes = existing?.notes ?? '';
		editPrice = existing?.price ?? null;
	}

	async function saveEdit() {
		if (!editingCell) return;
		await trpcClient.property.updateCalendarStatus.mutate({
			propertyId: editingCell.propId,
			date: editingCell.day,
			status: editStatus,
			notes: editNotes || undefined,
			price: editPrice ?? undefined
		});
		editingCell = null;
		refreshCalendar();
	}

	function cancelEdit() { editingCell = null; }

	function roomStatusLabel(s: any) { return (ROOM_STATUS_LABELS as any)[s]; }
</script>

<div class="space-y-6">
	<div class="flex flex-wrap items-center justify-between gap-4">
		<div class="flex flex-wrap items-center gap-3">
			<!-- 月份切换 -->
			<div class="flex items-center gap-1 bg-white rounded-lg border border-gray-200 p-1">
				<button on:click={prevMonth} class="p-2 hover:bg-gray-100 rounded-md">
					<svg class="h-5 w-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
				</button>
				<div class="px-4 py-1.5 font-semibold text-gray-800 min-w-[140px] text-center">
					{format(currentMonth, 'yyyy年MM月')}
				</div>
				<button on:click={nextMonth} class="p-2 hover:bg-gray-100 rounded-md">
					<svg class="h-5 w-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
				</button>
				<button on:click={today} class="btn-secondary text-sm py-1 ml-1">今天</button>
			</div>

			<!-- 图例 -->
			<div class="flex flex-wrap gap-2 items-center text-xs">
				{#each Object.entries(ROOM_STATUS_LABELS) as [key, label]}
					<div class="flex items-center gap-1.5">
						<div class="h-3 w-3 rounded border {statusColors[key]?.split(' ').slice(0, 2).join(' ') ?? ''}"></div>
						<span class="text-gray-600">{label}</span>
					</div>
				{/each}
			</div>
		</div>
	</div>

	<!-- 房源筛选 -->
	<div class="card card-body">
		<div class="flex items-center justify-between mb-2">
			<div class="text-sm font-medium text-gray-700">选择房源显示</div>
			<div class="flex items-center gap-2 text-xs">
				<button on:click={selectAll} class="text-primary-600 hover:text-primary-700">全选</button>
				<span class="text-gray-300">|</span>
				<button on:click={clearSelection} class="text-gray-500 hover:text-gray-700">清空</button>
				<span class="text-gray-400 ml-1">({selectedPropertyIds.length}/{properties.length})</span>
			</div>
		</div>
		<div class="flex flex-wrap gap-2">
			{#each properties as p}
				<label class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border cursor-pointer text-sm transition-colors {selectedPropertyIds.includes(p.id) ? 'bg-primary-50 border-primary-200 text-primary-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}">
					<input type="checkbox" checked={selectedPropertyIds.includes(p.id)} on:change={() => toggleProperty(p.id)} class="w-3.5 h-3.5" />
					<span>{p.name}</span>
				</label>
			{/each}
		</div>
	</div>

	<!-- 日历网格 -->
	{#if loading}
		<div class="card card-body py-12 text-center text-gray-500">加载中...</div>
	{:else if visibleProps.length === 0}
		<div class="card card-body py-12 text-center text-gray-500">请先选择房源，或<a href="/properties" class="text-primary-600 mx-1">创建房源</a></div>
	{:else}
		<div class="card overflow-hidden">
			<div class="overflow-x-auto">
				<table class="min-w-full border-collapse">
					<thead>
						<tr>
							<th class="sticky left-0 z-10 bg-gray-50 w-48 min-w-[200px] text-left px-4 py-3 text-xs font-medium text-gray-500 border-b border-r border-gray-200">房源</th>
							{#each daysInMonth as day}
								<th class="px-2 py-3 text-center min-w-[70px] border-b border-gray-200 bg-gray-50">
									<div class="text-[10px] text-gray-400">{weekDays[day.getDay()]}</div>
									<div class="text-sm font-semibold {isToday(day) ? 'text-primary-600' : 'text-gray-700'}">
										{isToday(day) ? '今天' : format(day, 'd')}
									</div>
								</th>
							{/each}
						</tr>
					</thead>
					<tbody>
						{#each visibleProps as p, idx}
							<tr class="{idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'} hover:bg-primary-50/30 transition-colors">
								<td class="sticky left-0 z-10 {idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'} border-b border-r border-gray-200 px-4 py-3">
									<div class="font-medium text-sm text-gray-900 truncate max-w-[180px]">{p.name}</div>
									<div class="text-xs text-gray-500 mt-0.5">{p.bedrooms}室 · {p.maxGuests}人 · ¥{p.basePrice}</div>
								</td>
								{#each daysInMonth as day}
									{@const cell = { cal: getCal(p.id, day), isEditing: editingCell?.propId === p.id && editingCell?.day && startOfDay(editingCell.day).getTime() === startOfDay(day).getTime() }}
									<td class="border-b border-gray-100 px-1 py-1 align-top min-w-[70px]">
										{#if cell.isEditing}
											<div class="p-1.5 rounded-md border-2 border-primary-400 bg-white shadow-lg z-20">
												<select bind:value={editStatus} class="w-full text-xs mb-1 p-1 rounded border border-gray-200">
													{#each Object.entries(ROOM_STATUS_LABELS) as [key, label]}
														<option value={key}>{label}</option>
													{/each}
												</select>
												<input type="number" bind:value={editPrice} placeholder="价格" class="w-full text-xs mb-1 p-1 rounded border border-gray-200" />
												<input bind:value={editNotes} placeholder="备注" class="w-full text-xs mb-2 p-1 rounded border border-gray-200" />
												<div class="flex gap-1">
													<button on:click={saveEdit} class="flex-1 btn-primary text-xs py-1 px-2 !text-xs">保存</button>
													<button on:click={cancelEdit} class="flex-1 btn-secondary text-xs py-1 px-2 !text-xs">取消</button>
												</div>
											</div>
										{:else}
											<div on:dblclick={() => openEdit(p.id, day, cell.cal)} class="cursor-pointer rounded-md border p-1.5 text-[10px] min-h-[60px] transition-all hover:ring-2 hover:ring-primary-300 {cell.cal ? statusColors[cell.cal.status] ?? 'bg-white border-gray-200' : 'bg-white border-dashed border-gray-200'}">
												{#if cell.cal?.orderId}
													<div class="font-semibold truncate">{roomStatusLabel(cell.cal?.status)}</div>
													<div class="opacity-70 truncate">#{cell.cal.orderId?.slice(-6)}</div>
													{#if cell.cal.price}
														<div class="opacity-70 mt-0.5">¥{cell.cal.price}</div>
													{/if}
												{:else if cell.cal?.status && cell.cal.status !== 'available'}
													<div class="font-semibold truncate">{roomStatusLabel(cell.cal?.status)}</div>
													{#if cell.cal.notes}
														<div class="opacity-70 truncate">{cell.cal.notes}</div>
													{/if}
												{:else}
													<div class="opacity-40 text-center mt-3">双击编辑</div>
												{/if}
											</div>
										{/if}
									</td>
								{/each}
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
			<div class="px-6 py-3 border-t border-gray-200 bg-gray-50 text-xs text-gray-500 flex items-center justify-between">
				<div>提示：双击单元格可快速修改房态、价格和备注</div>
				<a href="/orders" class="text-primary-600 hover:text-primary-700">通过订单管理批量更新房态 →</a>
			</div>
		</div>
	{/if}
</div>
