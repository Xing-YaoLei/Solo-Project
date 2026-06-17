<script lang="ts">
	import { goto } from '$app/navigation';
	import { trpc } from '$lib/trpc';
	import {
		Archive,
		RefreshCw,
		Loader2,
		Building2,
		LayoutGrid,
		Home,
		ChevronRight,
		Users,
		FileText,
		DollarSign,
		Eye,
		X
	} from 'lucide-svelte';

	let loading = $state(true);
	let buildings = $state<any[]>([]);
	let selectedBuilding = $state<any>(null);
	let selectedRoom = $state<any>(null);
	let showRoomDetail = $state(false);

	const roomStatusLabels: Record<string, string> = {
		vacant: '空置',
		occupied: '已出租',
		maintenance: '维修中'
	};

	const roomStatusClasses: Record<string, string> = {
		vacant: 'bg-gray-100 text-gray-600',
		occupied: 'bg-green-100 text-green-700',
		maintenance: 'bg-yellow-100 text-yellow-700'
	};

	const facilityConditionLabels: Record<string, string> = {
		good: '良好',
		fair: '一般',
		poor: '较差',
		broken: '已损坏'
	};

	const facilityConditionClasses: Record<string, string> = {
		good: 'bg-success/10 text-success',
		fair: 'bg-primary/10 text-primary',
		poor: 'bg-warning/10 text-warning',
		broken: 'bg-danger/10 text-danger'
	};

	async function loadBuildings() {
		loading = true;
		try {
			buildings = await trpc.archive.listBuildings.query();
		} catch (e) {
			console.error('Failed to load buildings:', e);
		} finally {
			loading = false;
		}
	}

	async function loadBuildingDetail(building: any) {
		try {
			selectedBuilding = await trpc.archive.getBuildingDetail.query({ id: building.id });
		} catch (e: any) {
			alert(e?.message || '加载失败');
		}
	}

	async function loadRoomDetail(room: any) {
		if (!selectedBuilding) return;
		try {
			selectedRoom = await trpc.archive.getRoomDetail.query({
				buildingId: selectedBuilding.id,
				roomId: room.id
			});
			showRoomDetail = true;
		} catch (e: any) {
			alert(e?.message || '加载失败');
		}
	}

	function selectBuilding(building: any) {
		selectedBuilding = building;
		loadBuildingDetail(building);
	}

	function goBack() {
		selectedBuilding = null;
		selectedRoom = null;
		showRoomDetail = false;
	}

	$effect(() => {
		loadBuildings();
	});

	function formatDate(d: any) {
		if (!d) return '-';
		const date = new Date(d);
		return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
	}

	function formatMoney(v: any) {
		if (v == null) return '-';
		return '¥' + Number(v).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
	}
</script>

<div class="p-6 space-y-6 animate-fade-in">
	<div class="flex items-center justify-between flex-wrap gap-3">
		<div class="flex items-center gap-3">
			<Archive class="w-7 h-7 text-text-secondary" />
			<div>
				<h1 class="text-2xl font-bold text-text">房屋档案管理</h1>
			</div>
		</div>
		<div class="flex items-center gap-2">
			{#if selectedBuilding}
				<button
					onclick={goBack}
					class="flex items-center gap-2 px-3 py-2 text-sm border border-border rounded-lg hover:bg-surface-hover transition-colors"
				>
					← 返回楼宇列表
				</button>
			{/if}
			<button
				onclick={() => selectedBuilding ? loadBuildingDetail(selectedBuilding) : loadBuildings()}
				disabled={loading}
				class="flex items-center gap-2 px-3 py-2 text-sm border border-border rounded-lg hover:bg-surface-hover transition-colors disabled:opacity-50"
			>
				<RefreshCw class="w-4 h-4" class:animate-spin={loading} />
				刷新
			</button>
		</div>
	</div>

	{#if loading}
		<div class="flex flex-col items-center justify-center py-16 text-text-muted">
			<Loader2 class="w-8 h-8 animate-spin mb-3" />
			<p>加载中...</p>
		</div>
	{:else if !selectedBuilding}
		{#if buildings.length === 0}
			<div class="text-center py-16 text-text-muted">
				<Archive class="w-12 h-12 mx-auto mb-3 opacity-40" />
				<p class="text-lg">暂无楼宇档案</p>
			</div>
		{:else}
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				{#each buildings as building (building.id)}
					<div
						class="bg-surface rounded-xl shadow-sm border border-border p-5 hover:shadow-md hover:border-primary/30 transition-all cursor-pointer group"
						onclick={() => selectBuilding(building)}
					>
						<div class="flex items-start justify-between mb-4">
							<div class="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
								<Building2 class="w-6 h-6" />
							</div>
							<ChevronRight class="w-5 h-5 text-text-muted group-hover:text-primary group-hover:translate-x-1 transition-all" />
						</div>
						<h3 class="text-lg font-semibold text-text mb-2">{building.name}</h3>
						<p class="text-sm text-text-secondary mb-4 line-clamp-2">{building.address}</p>
						<div class="grid grid-cols-3 gap-3 pt-4 border-t border-border">
							<div class="text-center">
								<div class="text-lg font-bold text-text">{building.totalRooms || 0}</div>
								<div class="text-xs text-text-muted">房间总数</div>
							</div>
							<div class="text-center">
								<div class="text-lg font-bold text-success">
									{building.totalRooms ? Math.round(building.totalRooms * (1 - (building.vacancyRate || 0))) : 0}
								</div>
								<div class="text-xs text-text-muted">已出租</div>
							</div>
							<div class="text-center">
								<div class="text-lg font-bold text-text-secondary">
									{((building.vacancyRate || 0) * 100).toFixed(0)}%
								</div>
								<div class="text-xs text-text-muted">空置率</div>
							</div>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	{:else}
		<div class="bg-surface rounded-xl shadow-sm border border-border p-6">
			<div class="mb-6 pb-6 border-b border-border">
				<div class="flex items-start justify-between flex-wrap gap-4">
					<div class="flex items-start gap-4">
						<div class="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
							<Building2 class="w-7 h-7" />
						</div>
						<div>
							<h2 class="text-xl font-bold text-text">{selectedBuilding.name}</h2>
							<p class="text-sm text-text-secondary mt-1">{selectedBuilding.address}</p>
						</div>
					</div>
				</div>
			</div>

			{#if !selectedBuilding.rooms || selectedBuilding.rooms.length === 0}
				<div class="text-center py-12 text-text-muted">
					<Home class="w-10 h-10 mx-auto mb-2 opacity-40" />
					<p>暂无房间数据</p>
				</div>
			{:else}
				<div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
					{#each selectedBuilding.rooms as room (room.id)}
						<button
							class="p-4 rounded-xl border transition-all text-left group"
							class:bg-green-50={room.status === 'occupied'}
							class:border-green-200={room.status === 'occupied'}
							class:bg-gray-50={room.status === 'vacant'}
							class:border-gray-200={room.status === 'vacant'}
							class:bg-yellow-50={room.status === 'maintenance'}
							class:border-yellow-200={room.status === 'maintenance'}
							class:hover:shadow-md={true}
							onclick={() => loadRoomDetail(room)}
						>
							<div class="flex items-center justify-between mb-2">
								<span class="font-semibold text-text">{room.roomNumber}</span>
								<span
									class="text-xs px-1.5 py-0.5 rounded font-medium {roomStatusClasses[room.status] || roomStatusClasses.vacant}"
								>
									{roomStatusLabels[room.status] || '空置'}
								</span>
							</div>
							<div class="text-xs text-text-secondary space-y-0.5">
								<div>{room.floor} · {room.unit}</div>
								<div>{room.area || 0} ㎡</div>
							</div>
						</button>
					{/each}
				</div>
			{/if}
		</div>
	{/if}
</div>

{#if showRoomDetail && selectedRoom}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
		onclick={() => (showRoomDetail = false)}
		role="presentation"
	>
		<div
			class="bg-surface rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] overflow-hidden animate-fade-in flex flex-col"
			onclick|stopPropagation={() => {}}
		>
			<div class="flex items-center justify-between p-5 border-b border-border flex-shrink-0">
				<div class="flex items-center gap-3">
					<div class="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
						<Home class="w-5 h-5" />
					</div>
					<div>
						<h3 class="text-lg font-semibold text-text">房间 {selectedRoom.roomNumber}</h3>
						<p class="text-xs text-text-muted">{selectedRoom.floor} · {selectedRoom.unit} · {selectedRoom.area || 0} ㎡</p>
					</div>
				</div>
				<button
					class="p-1.5 text-text-muted hover:text-text transition-colors rounded-lg hover:bg-surface-alt"
					onclick={() => (showRoomDetail = false)}
				>
					<X class="w-5 h-5" />
				</button>
			</div>
			<div class="overflow-y-auto p-5 space-y-5 flex-1">
				<div>
					<h4 class="text-sm font-semibold text-text mb-3 pb-2 border-b border-border flex items-center gap-2">
						<LayoutGrid class="w-4 h-4" />
						基本信息
					</h4>
					<div class="grid grid-cols-2 gap-4 text-sm">
						<div class="flex items-center gap-2">
							<span class="text-text-secondary">房间状态：</span>
							<span
								class="px-2 py-0.5 rounded text-xs font-medium {roomStatusClasses[selectedRoom.status] || roomStatusClasses.vacant}"
							>
								{roomStatusLabels[selectedRoom.status] || '空置'}
							</span>
						</div>
						<div class="flex items-center gap-2">
							<span class="text-text-secondary">建筑面积：</span>
							<span class="text-text font-medium">{selectedRoom.area || 0} ㎡</span>
						</div>
					</div>
				</div>

				<div>
					<h4 class="text-sm font-semibold text-text mb-3 pb-2 border-b border-border flex items-center gap-2">
						<FileText class="w-4 h-4" />
						当前合同
					</h4>
					{#if selectedRoom.activeContract}
						<div class="bg-surface-alt rounded-xl p-4 text-sm space-y-2">
							<div class="flex items-center justify-between">
								<div class="flex items-center gap-2">
									<Users class="w-4 h-4 text-text-muted" />
									<span class="font-medium text-text">{selectedRoom.activeContract.tenantName || '-'}</span>
								</div>
								<span class="text-xs px-2 py-0.5 rounded bg-green-100 text-green-700 font-medium">
									{selectedRoom.activeContract.status === 'active' ? '生效中' : selectedRoom.activeContract.status}
								</span>
							</div>
							<div class="flex items-center gap-2 text-text-secondary">
								<FileText class="w-4 h-4" />
								租期：{formatDate(selectedRoom.activeContract.startDate)} 至 {formatDate(selectedRoom.activeContract.endDate)}
							</div>
							<div class="flex items-center gap-2 text-text-secondary">
								<DollarSign class="w-4 h-4 text-success" />
								月租金：<span class="text-success font-semibold">{formatMoney(selectedRoom.activeContract.monthlyRent)}</span>
							</div>
						</div>
					{:else}
						<div class="text-center py-4 text-text-muted text-sm bg-surface-alt rounded-xl">
							<FileText class="w-8 h-8 mx-auto mb-2 opacity-30" />
							暂无合同记录
						</div>
					{/if}
				</div>

				<div>
					<h4 class="text-sm font-semibold text-text mb-3 pb-2 border-b border-border flex items-center gap-2">
						<Archive class="w-4 h-4" />
						设施设备
					</h4>
					{#if selectedRoom.facilities && selectedRoom.facilities.length > 0}
						<div class="overflow-hidden rounded-xl border border-border">
							<table class="w-full text-sm">
								<thead class="bg-surface-alt">
									<tr>
										<th class="text-left font-medium text-text-secondary px-4 py-2.5">名称</th>
										<th class="text-left font-medium text-text-secondary px-4 py-2.5">类别</th>
										<th class="text-left font-medium text-text-secondary px-4 py-2.5">状态</th>
									</tr>
								</thead>
								<tbody class="divide-y divide-border">
									{#each selectedRoom.facilities as facility (facility.id)}
										<tr>
											<td class="px-4 py-2.5 text-text font-medium">{facility.name}</td>
											<td class="px-4 py-2.5 text-text-secondary">{facility.category}</td>
											<td class="px-4 py-2.5">
												<span
													class="text-xs px-2 py-0.5 rounded font-medium {facilityConditionClasses[facility.condition] || facilityConditionClasses.good}"
												>
													{facilityConditionLabels[facility.condition] || '良好'}
												</span>
											</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					{:else}
						<div class="text-center py-4 text-text-muted text-sm bg-surface-alt rounded-xl">
							<Archive class="w-8 h-8 mx-auto mb-2 opacity-30" />
							暂无设施记录
						</div>
					{/if}
				</div>
			</div>
			<div class="p-5 border-t border-border flex items-center justify-end gap-3 flex-shrink-0">
				<button
					class="px-4 py-2.5 text-sm font-medium text-text-secondary hover:text-text bg-surface-alt rounded-lg hover:bg-surface-hover transition-colors"
					onclick={() => (showRoomDetail = false)}
				>
					关闭
				</button>
				{#if selectedRoom.activeContract}
					<button
						class="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-dark transition-colors"
						onclick={() => goto(`/contracts/${selectedRoom.activeContract.id}`)}
					>
						<Eye class="w-4 h-4" />
						查看合同
					</button>
				{/if}
			</div>
		</div>
	</div>
{/if}
