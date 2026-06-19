<script lang="ts">
	import { trpc } from '$lib/trpc';
	import { onMount } from 'svelte';
	import {
		formatDate,
		formatDateTime,
		getBookingStatusLabel,
		getBookingStatusBadge,
		getTaskTypeLabel,
		getTaskStatusLabel,
		getStatusBadge,
		getPropertyTypeLabel
	} from '$lib/utils';

	type Property = {
		id: string;
		name: string;
		address: string;
		type: string;
		status: string;
	};

	type CalendarEvent = {
		id: string;
		propertyId: string;
		title: string;
		type: string;
		referenceId?: string | null;
		startDate: number | Date;
		endDate: number | Date;
		isAllDay: boolean;
		color?: string | null;
		notes?: string | null;
		createdAt: number | Date;
		updatedAt: number | Date;
		source?: string;
		sourceData?: any;
	};

	type DayEvents = {
		date: Date;
		events: CalendarEvent[];
	};

	let properties: Property[] = [];
	let selectedPropertyId = '';
	let events: CalendarEvent[] = [];
	let loading = true;

	let currentDate = new Date();
	let calendarDays: DayEvents[] = [];

	let showCreateModal = false;
	let showDetailModal = false;
	let selectedEvent: CalendarEvent | null = null;

	let newEventForm = {
		propertyId: '',
		title: '',
		type: 'other' as 'booking' | 'cleaning' | 'maintenance' | 'other',
		startDate: '',
		endDate: '',
		color: '#8b5cf6',
		notes: ''
	};

	let submitting = false;
	let errorMsg = '';

	const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
	const monthNames = [
		'一月', '二月', '三月', '四月', '五月', '六月',
		'七月', '八月', '九月', '十月', '十一月', '十二月'
	];

	const eventColors: Record<string, string> = {
		booking: '#3b82f6',
		cleaning: '#10b981',
		maintenance: '#f59e0b',
		other: '#8b5cf6'
	};

	const eventTypeLabels: Record<string, string> = {
		booking: '预订',
		cleaning: '保洁',
		maintenance: '维修',
		other: '其他'
	};

	const colorOptions = [
		{ label: '紫色', value: '#8b5cf6' },
		{ label: '蓝色', value: '#3b82f6' },
		{ label: '绿色', value: '#10b981' },
		{ label: '黄色', value: '#f59e0b' },
		{ label: '红色', value: '#ef4444' },
		{ label: '粉色', value: '#ec4899' },
		{ label: '青色', value: '#06b6d4' },
		{ label: '橙色', value: '#f97316' }
	];

	async function loadData() {
		loading = true;
		try {
			properties = await trpc().property.listAll.query() as Property[];

			const year = currentDate.getFullYear();
			const month = currentDate.getMonth();
			const start = new Date(year, month, 1);
			const end = new Date(year, month + 1, 0, 23, 59, 59, 999);

			const res = await trpc().calendar.getEvents.query({
				start,
				end,
				propertyIds: selectedPropertyId ? [selectedPropertyId] : undefined
			});
			events = res.all as CalendarEvent[];
			buildCalendar();
		} finally {
			loading = false;
		}
	}

	function buildCalendar() {
		const year = currentDate.getFullYear();
		const month = currentDate.getMonth();
		const firstDay = new Date(year, month, 1);
		const lastDay = new Date(year, month + 1, 0);
		const startOffset = firstDay.getDay();
		const totalDays = lastDay.getDate();

		const days: DayEvents[] = [];
		const prevMonthLastDay = new Date(year, month, 0).getDate();

		for (let i = startOffset - 1; i >= 0; i--) {
			const d = new Date(year, month - 1, prevMonthLastDay - i);
			days.push({ date: d, events: [] });
		}

		for (let i = 1; i <= totalDays; i++) {
			const d = new Date(year, month, i);
			const dayEvents = events.filter((e) => {
				const s = typeof e.startDate === 'number' ? new Date(e.startDate) : e.startDate;
				const en = typeof e.endDate === 'number' ? new Date(e.endDate) : e.endDate;
				const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
				const dayEnd = dayStart + 24 * 60 * 60 * 1000 - 1;
				return s.getTime() <= dayEnd && en.getTime() >= dayStart;
			});
			days.push({ date: d, events: dayEvents });
		}

		const remaining = 42 - days.length;
		for (let i = 1; i <= remaining; i++) {
			const d = new Date(year, month + 1, i);
			days.push({ date: d, events: [] });
		}

		calendarDays = days;
	}

	onMount(() => {
		loadData();
	});

	function goToPrevMonth() {
		currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
		loadData();
	}

	function goToNextMonth() {
		currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
		loadData();
	}

	function goToToday() {
		currentDate = new Date();
		loadData();
	}

	function handlePropertyChange() {
		loadData();
	}

	function isCurrentMonth(date: Date): boolean {
		return date.getMonth() === currentDate.getMonth();
	}

	function isToday(date: Date): boolean {
		const today = new Date();
		return (
			date.getFullYear() === today.getFullYear() &&
			date.getMonth() === today.getMonth() &&
			date.getDate() === today.getDate()
		);
	}

	function getEventColor(e: CalendarEvent): string {
		if (e.color) return e.color;
		return eventColors[e.type] || '#6b7280';
	}

	function getEventSourceLabel(e: CalendarEvent): string {
		if (e.source === 'booking') return '预订系统';
		if (e.source === 'task') return '保洁任务';
		return '自定义';
	}

	function openCreateModal(date?: Date) {
		const d = date || new Date();
		const dateStr = formatDateForInput(d);
		newEventForm = {
			propertyId: selectedPropertyId || (properties[0]?.id || ''),
			title: '',
			type: 'other',
			startDate: dateStr,
			endDate: dateStr,
			color: '#8b5cf6',
			notes: ''
		};
		errorMsg = '';
		showCreateModal = true;
	}

	function formatDateForInput(d: Date): string {
		const y = d.getFullYear();
		const m = String(d.getMonth() + 1).padStart(2, '0');
		const day = String(d.getDate()).padStart(2, '0');
		return `${y}-${m}-${day}`;
	}

	function closeCreateModal() {
		showCreateModal = false;
	}

	async function handleCreateEvent() {
		if (!newEventForm.propertyId) {
			errorMsg = '请选择房源';
			return;
		}
		if (!newEventForm.title.trim()) {
			errorMsg = '请输入事件标题';
			return;
		}
		if (!newEventForm.startDate || !newEventForm.endDate) {
			errorMsg = '请选择起止日期';
			return;
		}
		submitting = true;
		errorMsg = '';
		try {
			const start = new Date(newEventForm.startDate);
			const end = new Date(newEventForm.endDate);
			end.setHours(23, 59, 59, 999);

			await trpc().calendar.createEvent.mutate({
				propertyId: newEventForm.propertyId,
				title: newEventForm.title.trim(),
				type: newEventForm.type,
				startDate: start,
				endDate: end,
				isAllDay: true,
				color: newEventForm.color,
				notes: newEventForm.notes.trim() || undefined
			});

			showCreateModal = false;
			loadData();
		} catch (e: any) {
			errorMsg = e.message || '创建失败';
		} finally {
			submitting = false;
		}
	}

	function openEventDetail(e: CalendarEvent) {
		selectedEvent = e;
		showDetailModal = true;
	}

	function closeDetailModal() {
		showDetailModal = false;
		selectedEvent = null;
	}

	async function handleDeleteEvent() {
		if (!selectedEvent || selectedEvent.source !== 'custom') return;
		if (!confirm('确定要删除该事件吗？')) return;
		try {
			await trpc().calendar.deleteEvent.mutate({ id: selectedEvent.id });
			closeDetailModal();
			loadData();
		} catch (e: any) {
			alert(e.message || '删除失败');
		}
	}

	function getPropertyName(id: string): string {
		const p = properties.find((x) => x.id === id);
		return p?.name || '-';
	}
</script>

<div class="p-8">
	<div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
		<div>
			<h1 class="text-2xl font-bold text-gray-900">房源日历</h1>
			<p class="text-gray-500 mt-1">查看预订、保洁任务及自定义事件</p>
		</div>
		<button class="btn-primary" on:click={() => openCreateModal()}>
			<span class="mr-2">+</span>新增事件
		</button>
	</div>

	<div class="card mb-6">
		<div class="card-body">
			<div class="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
				<div class="md:col-span-2">
					<label class="label">筛选房源</label>
					<select class="input" bind:value={selectedPropertyId} on:change={handlePropertyChange}>
						<option value="">全部房源</option>
						{#each properties as p}
							<option value={p.id}>{p.name}</option>
						{/each}
					</select>
				</div>
				<div>
					<label class="label">图例说明</label>
					<div class="flex flex-wrap gap-2">
						<span class="inline-flex items-center text-xs">
							<span class="w-3 h-3 rounded mr-1" style="background: {eventColors.booking}"></span>预订
						</span>
						<span class="inline-flex items-center text-xs">
							<span class="w-3 h-3 rounded mr-1" style="background: {eventColors.cleaning}"></span>保洁
						</span>
						<span class="inline-flex items-center text-xs">
							<span class="w-3 h-3 rounded mr-1" style="background: {eventColors.maintenance}"></span>维修
						</span>
						<span class="inline-flex items-center text-xs">
							<span class="w-3 h-3 rounded mr-1" style="background: {eventColors.other}"></span>自定义
						</span>
					</div>
				</div>
				<div class="md:col-span-2 flex gap-2">
					<button class="btn-secondary flex-1" on:click={goToToday}>今天</button>
					<button class="btn-secondary" on:click={goToPrevMonth}>←</button>
					<button class="btn-secondary" on:click={goToNextMonth}>→</button>
				</div>
			</div>
		</div>
	</div>

	{#if loading}
		<div class="flex items-center justify-center py-20">
			<div class="text-gray-500">加载数据中...</div>
		</div>
	{:else}
		<div class="card overflow-hidden">
			<div class="card-header text-center border-b-2">
				<h2 class="text-xl font-semibold text-gray-900">
					{currentDate.getFullYear()}年 {monthNames[currentDate.getMonth()]}
				</h2>
			</div>
			<div class="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
				{#each weekDays as wd, i}
					<div
						class="py-3 text-center text-sm font-medium {
							i === 0 || i === 6 ? 'text-red-500' : 'text-gray-600'
						}"
					>
						{wd}
					</div>
				{/each}
			</div>
			<div class="grid grid-cols-7">
				{#each calendarDays as day, idx}
					{@const cm = isCurrentMonth(day.date)}
					{@const t = isToday(day.date)}
					{@const weekend = day.date.getDay() === 0 || day.date.getDay() === 6}
					<div
						class="min-h-[120px] border-b border-r border-gray-100 p-2 relative cursor-pointer hover:bg-gray-50 transition-colors {
							!cm ? 'bg-gray-50/50' : ''
						}"
						on:click={() => cm && openCreateModal(day.date)}
					>
						<div class="flex items-start justify-between mb-1">
							<span
								class="text-sm font-medium inline-flex items-center justify-center w-7 h-7 rounded-full {
									t
										? 'bg-brand-600 text-white'
										: !cm
											? 'text-gray-400'
											: weekend
												? 'text-red-500'
												: 'text-gray-700'
								}"
							>
								{day.date.getDate()}
							</span>
							{#if day.events.length > 3}
								<span class="text-xs text-gray-400">+{day.events.length - 3}</span>
							{/if}
						</div>
						<div class="space-y-1">
							{#each day.events.slice(0, 3) as e}
								<div
									class="text-xs px-2 py-1 rounded truncate cursor-pointer text-white transition-transform hover:scale-[1.02]"
									style="background: {getEventColor(e)}"
									on:click|stopPropagation={() => openEventDetail(e)}
									title={e.title}
								>
									{e.title}
								</div>
							{/each}
						</div>
					</div>
				{/each}
			</div>
		</div>
	{/if}
</div>

{#if showCreateModal}
	<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
		<div class="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
			<div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
				<h2 class="text-lg font-semibold text-gray-900">新增自定义事件</h2>
				<button
					class="text-gray-400 hover:text-gray-600 text-2xl leading-none"
					on:click={closeCreateModal}
				>
					×
				</button>
			</div>
			<div class="flex-1 overflow-y-auto p-6">
				{#if errorMsg}
					<div class="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
						{errorMsg}
					</div>
				{/if}
				<div class="space-y-4">
					<div>
						<label class="label">房源 <span class="text-red-500">*</span></label>
						<select class="input" bind:value={newEventForm.propertyId}>
							<option value="">请选择房源</option>
							{#each properties as p}
								<option value={p.id}>{p.name}</option>
							{/each}
						</select>
					</div>
					<div>
						<label class="label">事件标题 <span class="text-red-500">*</span></label>
						<input
							type="text"
							class="input"
							placeholder="例如：业主看房、设备检修等"
							bind:value={newEventForm.title}
						/>
					</div>
					<div>
						<label class="label">事件类型</label>
						<select class="input" bind:value={newEventForm.type}>
							<option value="other">其他</option>
							<option value="maintenance">维修</option>
							<option value="cleaning">保洁</option>
							<option value="booking">预订</option>
						</select>
					</div>
					<div class="grid grid-cols-2 gap-4">
						<div>
							<label class="label">开始日期 <span class="text-red-500">*</span></label>
							<input type="date" class="input" bind:value={newEventForm.startDate} />
						</div>
						<div>
							<label class="label">结束日期 <span class="text-red-500">*</span></label>
							<input type="date" class="input" bind:value={newEventForm.endDate} />
						</div>
					</div>
					<div>
						<label class="label">标记颜色</label>
						<div class="flex flex-wrap gap-2">
							{#each colorOptions as c}
								<button
									type="button"
									class="w-8 h-8 rounded-full border-2 transition-all {
										newEventForm.color === c.value
											? 'border-gray-800 scale-110'
											: 'border-white hover:scale-105'
									}"
									style="background: {c.value}"
									title={c.label}
									on:click={() => (newEventForm.color = c.value)}
								></button>
							{/each}
						</div>
					</div>
					<div>
						<label class="label">备注说明</label>
						<textarea
							class="input"
							rows="3"
							placeholder="可选，补充事件详情"
							bind:value={newEventForm.notes}
						></textarea>
					</div>
				</div>
			</div>
			<div class="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
				<button class="btn-secondary" on:click={closeCreateModal} disabled={submitting}>取消</button>
				<button class="btn-primary" on:click={handleCreateEvent} disabled={submitting}>
					{submitting ? '创建中...' : '创建事件'}
				</button>
			</div>
		</div>
	</div>
{/if}

{#if showDetailModal && selectedEvent}
	<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
		<div class="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
			<div
				class="px-6 py-4 flex items-center justify-between"
				style="background: {getEventColor(selectedEvent)}"
			>
				<h2 class="text-lg font-semibold text-white">{selectedEvent.title}</h2>
				<button
					class="text-white/80 hover:text-white text-2xl leading-none"
					on:click={closeDetailModal}
				>
					×
				</button>
			</div>
			<div class="flex-1 overflow-y-auto p-6 space-y-4">
				<div class="flex items-center gap-2">
					<span
						class="badge"
						style="background: {getEventColor(selectedEvent)}20; color: {getEventColor(selectedEvent)}"
					>
						{eventTypeLabels[selectedEvent.type] || selectedEvent.type}
					</span>
					<span class="badge badge-info">{getEventSourceLabel(selectedEvent)}</span>
				</div>

				<div class="space-y-3 text-sm">
					<div class="flex">
						<span class="w-20 text-gray-500 shrink-0">房源</span>
						<span class="text-gray-900 font-medium">{getPropertyName(selectedEvent.propertyId)}</span>
					</div>
					<div class="flex">
						<span class="w-20 text-gray-500 shrink-0">开始</span>
						<span class="text-gray-900">{formatDateTime(selectedEvent.startDate)}</span>
					</div>
					<div class="flex">
						<span class="w-20 text-gray-500 shrink-0">结束</span>
						<span class="text-gray-900">{formatDateTime(selectedEvent.endDate)}</span>
					</div>
					{#if selectedEvent.notes}
						<div>
							<p class="text-gray-500 mb-1">备注</p>
							<p class="text-gray-900 bg-gray-50 p-3 rounded-md">{selectedEvent.notes}</p>
						</div>
					{/if}
				</div>

				{#if selectedEvent.source === 'booking' && selectedEvent.sourceData}
					<div class="border-t border-gray-100 pt-4 space-y-3 text-sm">
						<h3 class="font-semibold text-gray-900">预订详情</h3>
						<div class="flex">
							<span class="w-20 text-gray-500 shrink-0">客人</span>
							<span class="text-gray-900">{selectedEvent.sourceData.guestName}</span>
						</div>
						<div class="flex">
							<span class="w-20 text-gray-500 shrink-0">电话</span>
							<span class="text-gray-900">{selectedEvent.sourceData.guestPhone}</span>
						</div>
						<div class="flex">
							<span class="w-20 text-gray-500 shrink-0">入住</span>
							<span class="text-gray-900">{formatDate(selectedEvent.sourceData.checkInDate)}</span>
						</div>
						<div class="flex">
							<span class="w-20 text-gray-500 shrink-0">退房</span>
							<span class="text-gray-900">{formatDate(selectedEvent.sourceData.checkOutDate)}</span>
						</div>
						<div class="flex">
							<span class="w-20 text-gray-500 shrink-0">人数</span>
							<span class="text-gray-900">
								{selectedEvent.sourceData.adults || 0}成人
								{#if selectedEvent.sourceData.children > 0}
									，{selectedEvent.sourceData.children}儿童
								{/if}
							</span>
						</div>
						<div class="flex items-center">
							<span class="w-20 text-gray-500 shrink-0">状态</span>
							<span class="badge badge-{getBookingStatusBadge(selectedEvent.sourceData.status)}">
								{getBookingStatusLabel(selectedEvent.sourceData.status)}
							</span>
						</div>
					</div>
				{/if}

				{#if selectedEvent.source === 'task' && selectedEvent.sourceData}
					<div class="border-t border-gray-100 pt-4 space-y-3 text-sm">
						<h3 class="font-semibold text-gray-900">保洁任务详情</h3>
						<div class="flex">
							<span class="w-20 text-gray-500 shrink-0">类型</span>
							<span class="text-gray-900">{getTaskTypeLabel(selectedEvent.sourceData.type)}</span>
						</div>
						<div class="flex items-center">
							<span class="w-20 text-gray-500 shrink-0">状态</span>
							<span class="badge badge-{getStatusBadge(selectedEvent.sourceData.status)}">
								{getTaskStatusLabel(selectedEvent.sourceData.status)}
							</span>
						</div>
						<div class="flex">
							<span class="w-20 text-gray-500 shrink-0">计划</span>
							<span class="text-gray-900">{formatDate(selectedEvent.sourceData.scheduledDate)}</span>
						</div>
						{#if selectedEvent.sourceData.description}
							<div>
								<p class="text-gray-500 mb-1">任务说明</p>
								<p class="text-gray-900 bg-gray-50 p-3 rounded-md">
									{selectedEvent.sourceData.description}
								</p>
							</div>
						{/if}
					</div>
				{/if}
			</div>
			<div class="px-6 py-4 border-t border-gray-200 flex justify-between">
				{#if selectedEvent.source === 'custom'}
					<button
						class="btn-danger"
						on:click={handleDeleteEvent}
					>
						删除事件
					</button>
				{:else}
					<div></div>
				{/if}
				<button class="btn-primary" on:click={closeDetailModal}>关闭</button>
			</div>
		</div>
	</div>
{/if}

<script lang="ts" context="module">
	export const ssr = false;
</script>
