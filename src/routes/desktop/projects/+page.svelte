<script lang="ts">
	import DataTable from '$lib/components/DataTable.svelte';
	import Modal from '$lib/components/Modal.svelte';

	interface Project {
		id: string;
		name: string;
		address: string;
		clientName: string;
		clientPhone: string;
		budget: number;
		status: string;
		startDate: string;
		expectedEndDate: string;
		createdAt: string;
	}

	let searchQuery = '';
	let statusFilter = '';
	let currentPage = 1;
	let sortKey = 'createdAt';
	let sortOrder: 'asc' | 'desc' = 'desc';
	let modalOpen = false;
	let editingProject: Project | null = null;

	let formData = {
		name: '',
		address: '',
		clientName: '',
		clientPhone: '',
		budget: 0,
		startDate: '',
		expectedEndDate: ''
	};

	const mockProjects: Project[] = [
		{
			id: '1',
			name: '阳光花园别墅装修',
			address: '北京市朝阳区阳光花园12号',
			clientName: '张先生',
			clientPhone: '138****1234',
			budget: 1200000,
			status: 'processing',
			startDate: '2024-01-15',
			expectedEndDate: '2024-06-30',
			createdAt: '2024-01-10'
		},
		{
			id: '2',
			name: '万达广场商铺装修',
			address: '上海市浦东新区万达广场3层',
			clientName: '李女士',
			clientPhone: '139****5678',
			budget: 800000,
			status: 'pending',
			startDate: '2024-02-01',
			expectedEndDate: '2024-05-01',
			createdAt: '2024-01-20'
		},
		{
			id: '3',
			name: '滨江公寓翻新',
			address: '广州市天河区滨江公寓5栋1801',
			clientName: '王先生',
			clientPhone: '137****9012',
			budget: 450000,
			status: 'completed',
			startDate: '2023-10-01',
			expectedEndDate: '2024-01-15',
			createdAt: '2023-09-25'
		},
		{
			id: '4',
			name: '科技园办公楼改造',
			address: '深圳市南山区科技园A座10层',
			clientName: '科技有限公司',
			clientPhone: '0755****8888',
			budget: 3500000,
			status: 'processing',
			startDate: '2024-01-01',
			expectedEndDate: '2024-08-30',
			createdAt: '2023-12-20'
		},
		{
			id: '5',
			name: '西湖酒店装修',
			address: '杭州市西湖区西湖路88号',
			clientName: '酒店管理集团',
			clientPhone: '0571****6666',
			budget: 8000000,
			status: 'pending',
			startDate: '2024-03-01',
			expectedEndDate: '2024-12-31',
			createdAt: '2024-02-15'
		}
	];

	const filteredProjects = $derived(mockProjects.filter((p) => {
		const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
			p.clientName.toLowerCase().includes(searchQuery.toLowerCase());
		const matchesStatus = !statusFilter || p.status === statusFilter;
		return matchesSearch && matchesStatus;
	}));

	const sortedProjects = $derived([...filteredProjects].sort((a, b) => {
		const aVal = a[sortKey as keyof Project];
		const bVal = b[sortKey as keyof Project];
		if (typeof aVal === 'string' && typeof bVal === 'string') {
			return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
		}
		return 0;
	}));

	const totalItems = $derived(sortedProjects.length);
	const totalPages = $derived(Math.ceil(totalItems / 10));
	const paginatedProjects = $derived(sortedProjects.slice((currentPage - 1) * 10, currentPage * 10));

	const columns = [
		{ key: 'name', label: '项目名称', sortable: true },
		{ key: 'clientName', label: '客户', sortable: true },
		{ key: 'budget', label: '预算', sortable: true, render: (item: Project) => `¥${item.budget.toLocaleString()}` },
		{
			key: 'status',
			label: '状态',
			sortable: true,
			render: (item: Project) =>
				`<span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusClass(item.status)}">${getStatusLabel(item.status)}</span>`
		},
		{ key: 'startDate', label: '开始日期', sortable: true },
		{ key: 'expectedEndDate', label: '预计完成', sortable: true },
		{
			key: 'actions',
			label: '操作',
			render: (item: Project) => `
				<div class="flex gap-2">
					<button class="text-primary-600 hover:text-primary-800 text-sm" onclick="window.editProject('${item.id}')">编辑</button>
					<button class="text-red-600 hover:text-red-800 text-sm" onclick="window.deleteProject('${item.id}')">删除</button>
				</div>
			`
		}
	];

	function getStatusClass(status: string) {
		switch (status) {
			case 'pending':
				return 'bg-yellow-100 text-yellow-800';
			case 'processing':
				return 'bg-blue-100 text-blue-800';
			case 'completed':
				return 'bg-green-100 text-green-800';
			default:
				return 'bg-gray-100 text-gray-800';
		}
	}

	function getStatusLabel(status: string) {
		switch (status) {
			case 'pending':
				return '待开始';
			case 'processing':
				return '进行中';
			case 'completed':
				return '已完成';
			default:
				return status;
		}
	}

	function handleSort(key: string, order: 'asc' | 'desc') {
		sortKey = key;
		sortOrder = order;
	}

	function openAddModal() {
		editingProject = null;
		formData = {
			name: '',
			address: '',
			clientName: '',
			clientPhone: '',
			budget: 0,
			startDate: '',
			expectedEndDate: ''
		};
		modalOpen = true;
	}

	function openEditModal(project: Project) {
		editingProject = project;
		formData = {
			name: project.name,
			address: project.address,
			clientName: project.clientName,
			clientPhone: project.clientPhone,
			budget: project.budget,
			startDate: project.startDate,
			expectedEndDate: project.expectedEndDate
		};
		modalOpen = true;
	}

	function handleSubmit(e: Event) {
		e.preventDefault();
		modalOpen = false;
	}

	function handleDelete(id: string) {
		if (confirm('确定要删除这个项目吗？')) {
			console.log('Delete project:', id);
		}
	}

	(window as any).editProject = openEditModal;
	(window as any).deleteProject = handleDelete;
</script>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold text-gray-900">项目管理</h1>
			<p class="mt-1 text-sm text-gray-500">管理所有装修工程项目</p>
		</div>
		<button
			type="button"
			class="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500"
			onclick={openAddModal}
		>
			<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
			</svg>
			新增项目
		</button>
	</div>

	<div class="flex flex-wrap items-center gap-4 rounded-lg bg-white p-4 shadow-sm ring-1 ring-gray-900/5">
		<div class="relative flex-1 min-w-[200px]">
			<div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
				<svg class="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
					<path
						fill-rule="evenodd"
						d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
						clip-rule="evenodd"
					/>
				</svg>
			</div>
			<input
				type="text"
				bind:value={searchQuery}
				placeholder="搜索项目名称、客户..."
				class="block w-full rounded-lg border-0 py-2 pl-10 pr-3 text-sm text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-500"
			/>
		</div>

		<select
			bind:value={statusFilter}
			class="rounded-lg border-0 py-2 px-3 text-sm text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-primary-500"
		>
			<option value="">全部状态</option>
			<option value="pending">待开始</option>
			<option value="processing">进行中</option>
			<option value="completed">已完成</option>
		</select>
	</div>

	<DataTable
		data={paginatedProjects}
		columns={columns}
		sortKey={sortKey}
		sortOrder={sortOrder}
		onSort={handleSort}
		currentPage={currentPage}
		totalPages={totalPages}
		totalItems={totalItems}
		onPageChange={(p) => (currentPage = p)}
		onRowClick={openEditModal}
	/>
</div>

<Modal open={modalOpen} title={editingProject ? '编辑项目' : '新增项目'} onClose={() => (modalOpen = false)}>
	<form onsubmit={handleSubmit} class="space-y-4">
		<div>
			<label class="block text-sm font-medium text-gray-700">项目名称</label>
			<input
				type="text"
				bind:value={formData.name}
				required
				class="mt-1 block w-full rounded-lg border-0 py-2 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-500 sm:text-sm"
			/>
		</div>
		<div>
			<label class="block text-sm font-medium text-gray-700">项目地址</label>
			<input
				type="text"
				bind:value={formData.address}
				required
				class="mt-1 block w-full rounded-lg border-0 py-2 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-500 sm:text-sm"
			/>
		</div>
		<div class="grid grid-cols-2 gap-4">
			<div>
				<label class="block text-sm font-medium text-gray-700">客户名称</label>
				<input
					type="text"
					bind:value={formData.clientName}
					required
					class="mt-1 block w-full rounded-lg border-0 py-2 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-500 sm:text-sm"
				/>
			</div>
			<div>
				<label class="block text-sm font-medium text-gray-700">联系电话</label>
				<input
					type="text"
					bind:value={formData.clientPhone}
					required
					class="mt-1 block w-full rounded-lg border-0 py-2 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-500 sm:text-sm"
				/>
			</div>
		</div>
		<div>
			<label class="block text-sm font-medium text-gray-700">预算金额 (元)</label>
			<input
				type="number"
				bind:value={formData.budget}
				required
				class="mt-1 block w-full rounded-lg border-0 py-2 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-500 sm:text-sm"
			/>
		</div>
		<div class="grid grid-cols-2 gap-4">
			<div>
				<label class="block text-sm font-medium text-gray-700">开始日期</label>
				<input
					type="date"
					bind:value={formData.startDate}
					required
					class="mt-1 block w-full rounded-lg border-0 py-2 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-500 sm:text-sm"
				/>
			</div>
			<div>
				<label class="block text-sm font-medium text-gray-700">预计完成日期</label>
				<input
					type="date"
					bind:value={formData.expectedEndDate}
					required
					class="mt-1 block w-full rounded-lg border-0 py-2 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-500 sm:text-sm"
				/>
			</div>
		</div>
		<div class="flex justify-end gap-3 pt-4">
			<button
				type="button"
				class="rounded-lg px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-100"
				onclick={() => (modalOpen = false)}
			>
				取消
			</button>
			<button
				type="submit"
				class="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500"
			>
				{editingProject ? '保存修改' : '创建项目'}
			</button>
		</div>
	</form>
</Modal>
