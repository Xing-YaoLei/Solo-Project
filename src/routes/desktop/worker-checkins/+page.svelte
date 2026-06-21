<script lang="ts">
	import DataTable from '$lib/components/DataTable.svelte';
	import { trpc } from '$lib/trpc/client';

	interface WorkerCheckin {
		id: string;
		projectId: string;
		projectName: string;
		workerId: string;
		workerName: string;
		checkinTime: string;
		checkoutTime: string | null;
		workHours: number;
		workContent: string;
		verified: boolean;
		createdAt: string;
	}

	let viewMode: 'list' | 'calendar' = 'list';
	let projectFilter = '';
	let workerFilter = '';
	let dateFilter = new Date().toISOString().split('T')[0];
	let currentPage = 1;
	let sortKey = 'checkinTime';
	let sortOrder: 'asc' | 'desc' = 'desc';

	const projects = [
		{ id: '1', name: '阳光花园别墅装修' },
		{ id: '2', name: '万达广场商铺装修' }
	];

	const workers = [
		{ id: '1', name: '张三' },
		{ id: '2', name: '李四' },
		{ id: '3', name: '王五' },
		{ id: '4', name: '赵六' }
	];

	const mockCheckins: WorkerCheckin[] = [
		{
			id: '1',
			projectId: '1',
			projectName: '阳光花园别墅装修',
			workerId: '1',
			workerName: '张三',
			checkinTime: '2024-02-26 08:00',
			checkoutTime: '2024-02-26 17:00',
			workHours: 8,
			workContent: '客厅吊顶安装',
			verified: true,
			createdAt: '2024-02-26'
		},
		{
			id: '2',
			projectId: '1',
			projectName: '阳光花园别墅装修',
			workerId: '2',
			workerName: '李四',
			checkinTime: '2024-02-26 08:15',
			checkoutTime: '2024-02-26 17:30',
			workHours: 8.5,
			workContent: '墙面抹灰',
			verified: false,
			createdAt: '2024-02-26'
		},
		{
			id: '3',
			projectId: '2',
			projectName: '万达广场商铺装修',
			workerId: '3',
			workerName: '王五',
			checkinTime: '2024-02-26 07:30',
			checkoutTime: '2024-02-26 16:30',
			workHours: 8,
			workContent: '水电改造',
			verified: true,
			createdAt: '2024-02-26'
		},
		{
			id: '4',
			projectId: '1',
			projectName: '阳光花园别墅装修',
			workerId: '4',
			workerName: '赵六',
			checkinTime: '2024-02-26 09:00',
			checkoutTime: null,
			workHours: 0,
			workContent: '地砖铺设',
			verified: false,
			createdAt: '2024-02-26'
		},
		{
			id: '5',
			projectId: '2',
			projectName: '万达广场商铺装修',
			workerId: '1',
			workerName: '张三',
			checkinTime: '2024-02-25 08:00',
			checkoutTime: '2024-02-25 17:00',
			workHours: 8,
			workContent: '龙骨安装',
			verified: true,
			createdAt: '2024-02-25'
		}
	];

	const filteredCheckins = $derived(mockCheckins.filter((c) => {
		const matchesProject = !projectFilter || c.projectId === projectFilter;
		const matchesWorker = !workerFilter || c.workerId === workerFilter;
		const matchesDate = !dateFilter || c.createdAt === dateFilter;
		return matchesProject && matchesWorker && matchesDate;
	}));

	const sortedCheckins = $derived([...filteredCheckins].sort((a, b) => {
		const aVal = a[sortKey as keyof WorkerCheckin];
		const bVal = b[sortKey as keyof WorkerCheckin];
		if (typeof aVal === 'string' && typeof bVal === 'string') {
			return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
		}
		return 0;
	}));

	const totalItems = $derived(sortedCheckins.length);
	const totalPages = $derived(Math.ceil(totalItems / 10));
	const paginatedCheckins = $derived(sortedCheckins.slice((currentPage - 1) * 10, currentPage * 10));
	const totalWorkHours = $derived(filteredCheckins.reduce((sum, c) => sum + c.workHours, 0));

	const columns = [
		{ key: 'workerName', label: '工人', sortable: true, width: '100px' },
		{ key: 'projectName', label: '项目', sortable: true },
		{ key: 'checkinTime', label: '签到时间', sortable: true },
		{ key: 'checkoutTime', label: '签退时间', sortable: true, render: (item: WorkerCheckin) => item.checkoutTime || '未签退' },
		{ key: 'workHours', label: '工时', sortable: true, render: (item: WorkerCheckin) => `${item.workHours}小时` },
		{ key: 'workContent', label: '工作内容', sortable: true },
		{
			key: 'verified',
			label: '状态',
			sortable: true,
			render: (item: WorkerCheckin) => `<span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${item.verified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}">${item.verified ? '已审核' : '待审核'}</span>`
		}
	];

	function handleSort(key: string, order: 'asc' | 'desc') {
		sortKey = key;
		sortOrder = order;
	}

	async function handleExport() {
		try {
			const result = await trpc.common.exportData.query({
				type: 'worker_checkin',
				filters: { project: projectFilter, worker: workerFilter, date: dateFilter }
			});
			
			const blob = new Blob([result.csvContent], { type: 'text/csv;charset=utf-8;' });
			const link = document.createElement('a');
			link.href = URL.createObjectURL(blob);
			link.download = result.fileName;
			link.click();
		} catch (e) {
			console.error('Export failed:', e);
		}
	}

	const calendarDays = $derived(Array.from({ length: 31 }, (_, i) => {
		const d = new Date();
		d.setDate(i + 1);
		const dayStr = d.toISOString().split('T')[0];
		const dayCheckins = mockCheckins.filter((c) => c.createdAt === dayStr);
		return {
			date: d,
			day: d.getDate(),
			weekday: d.toLocaleDateString('zh-CN', { weekday: 'short' }),
			checkins: dayCheckins,
			totalHours: dayCheckins.reduce((sum, c) => sum + c.workHours, 0)
		};
	}));
</script>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold text-gray-900">工人签到管理</h1>
			<p class="mt-1 text-sm text-gray-500">管理工人考勤记录</p>
		</div>
		<div class="flex gap-3">
			<button
				type="button"
				class="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
				onclick={handleExport}
			>
				<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" d="M12 10.5v6m3-3H9m4.06-7.19-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" />
				</svg>
				导出考勤报表
			</button>
		</div>
	</div>

	<div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
		<div class="rounded-lg bg-white p-4 shadow-sm ring-1 ring-gray-900/5">
			<p class="text-sm font-medium text-gray-500">今日签到人数</p>
			<p class="mt-2 text-2xl font-bold text-gray-900">{filteredCheckins.length} 人</p>
		</div>
		<div class="rounded-lg bg-white p-4 shadow-sm ring-1 ring-gray-900/5">
			<p class="text-sm font-medium text-gray-500">今日总工时</p>
			<p class="mt-2 text-2xl font-bold text-gray-900">{totalWorkHours.toFixed(1)} 小时</p>
		</div>
		<div class="rounded-lg bg-white p-4 shadow-sm ring-1 ring-gray-900/5">
			<p class="text-sm font-medium text-gray-500">待审核</p>
			<p class="mt-2 text-2xl font-bold text-yellow-600">{filteredCheckins.filter(c => !c.verified).length} 条</p>
		</div>
	</div>

	<div class="rounded-lg bg-white p-4 shadow-sm ring-1 ring-gray-900/5">
		<div class="flex flex-wrap items-center justify-between gap-4">
			<div class="flex flex-wrap items-center gap-4 flex-1">
				<select
					bind:value={projectFilter}
					class="rounded-lg border-0 py-2 px-3 text-sm text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-primary-500"
				>
					<option value="">全部项目</option>
					{#each projects as project}
						<option value={project.id}>{project.name}</option>
					{/each}
				</select>
				<select
					bind:value={workerFilter}
					class="rounded-lg border-0 py-2 px-3 text-sm text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-primary-500"
				>
					<option value="">全部工人</option>
					{#each workers as worker}
						<option value={worker.id}>{worker.name}</option>
					{/each}
				</select>
				<input
					type="date"
					bind:value={dateFilter}
					class="rounded-lg border-0 py-2 px-3 text-sm text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-primary-500"
				/>
			</div>

			<div class="flex rounded-lg border border-gray-300 overflow-hidden">
				<button
					type="button"
					class="px-3 py-2 text-sm font-medium {viewMode === 'list' ? 'bg-primary-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}"
					onclick={() => (viewMode = 'list')}
				>
					列表
				</button>
				<button
					type="button"
					class="px-3 py-2 text-sm font-medium {viewMode === 'calendar' ? 'bg-primary-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}"
					onclick={() => (viewMode = 'calendar')}
				>
					日历
				</button>
			</div>
		</div>
	</div>

	{#if viewMode === 'list'}
		<DataTable
			data={paginatedCheckins}
			columns={columns}
			sortKey={sortKey}
			sortOrder={sortOrder}
			onSort={handleSort}
			currentPage={currentPage}
			totalPages={totalPages}
			totalItems={totalItems}
			onPageChange={(p) => (currentPage = p)}
		/>
	{:else}
		<div class="rounded-lg bg-white shadow-sm ring-1 ring-gray-900/5 overflow-hidden">
			<div class="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
				{#each ['日', '一', '二', '三', '四', '五', '六'] as day}
					<div class="py-2 text-center text-sm font-semibold text-gray-900">{day}</div>
				{/each}
			</div>
			<div class="grid grid-cols-7 gap-px bg-gray-200">
				{#each calendarDays as day}
					<div class="min-h-[120px] bg-white p-2">
						<div class="flex items-center justify-between">
							<span class="text-sm font-medium text-gray-900">{day.day}</span>
							{#if day.checkins.length > 0}
								<span class="text-xs text-gray-500">{day.totalHours.toFixed(1)}h</span>
							{/if}
						</div>
						<div class="mt-1 space-y-1">
							{#each day.checkins.slice(0, 2) as checkin}
								<div class="rounded bg-blue-50 px-1 py-0.5 text-xs text-blue-700 truncate">
									{checkin.workerName}
								</div>
							{/each}
							{#if day.checkins.length > 2}
								<div class="text-xs text-gray-500">+{day.checkins.length - 2} 更多</div>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		</div>
	{/if}
</div>
