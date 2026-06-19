<script lang="ts">
	import { trpcClient } from '$lib/trpc/client';
	import { onMount } from 'svelte';
	import OrderModal from '$lib/components/OrderModal.svelte';
	import { ORDER_STATUS_LABELS, CHANNEL_LABELS, type OrderStatusType, type ChannelTypeType } from '$lib/types';

	let orders: any[] = [];
	let properties: any[] = [];
	let loading = true;
	let showModal = false;
	let editingOrder: any = null;

	let filters = {
		status: '' as OrderStatusType | '',
		channel: '' as any,
		propertyId: '' as string,
		search: '' as string
	};

	async function loadData() {
		loading = true;
		try {
			const [o, p] = await Promise.all([
				trpcClient.order.list.query({
					status: filters.status || undefined,
					channel: filters.channel || undefined,
					propertyId: filters.propertyId || undefined,
					search: filters.search || undefined
				}),
				trpcClient.property.list.query({ status: 'active' })
			]);
			orders = o;
			properties = p;
		} finally {
			loading = false;
		}
	}

	onMount(loadData);

	function onCreate() { editingOrder = null; showModal = true; }
	function onEdit(o: any) { editingOrder = o; showModal = true; }
	async function onChangeStatus(o: any, status: OrderStatusType) {
		if (!confirm(`确认将订单状态改为「${ORDER_STATUS_LABELS[status]}」？`)) return;
		await trpcClient.order.updateStatus.mutate({ id: o.id, status });
		loadData();
	}
	async function onDelete(id: string) {
		if (!confirm('确认删除订单？房态也将同步释放')) return;
		await trpcClient.order.delete.mutate(id);
		loadData();
	}
	function onSaved() { showModal = false; editingOrder = null; loadData(); }
	function onCancel() { showModal = false; editingOrder = null; }

	function formatDate(d: any) {
		if (!d) return '-';
		return new Date(d).toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' });
	}
	function formatDateTime(d: any) {
		if (!d) return '-';
		return new Date(d).toLocaleString('zh-CN');
	}
	const propMap = new Map(properties.map((p) => [p.id, p.name]));

	const statusBadgeColor: Record<string, string> = {
		pending: 'bg-yellow-100 text-yellow-800',
		confirmed: 'bg-blue-100 text-blue-800',
		checked_in: 'bg-green-100 text-green-800',
		checked_out: 'bg-gray-100 text-gray-800',
		cancelled: 'bg-red-100 text-red-800',
		no_show: 'bg-purple-100 text-purple-800'
	};

	function channelLabel(c: any) { return (CHANNEL_LABELS as any)[c] ?? c; }
	function orderStatusLabel(s: any) { return (ORDER_STATUS_LABELS as any)[s]; }
</script>

<div class="space-y-6">
	<!-- 过滤栏 -->
	<div class="card card-body">
		<div class="grid grid-cols-1 md:grid-cols-5 gap-3">
			<div>
				<label class="label">搜索</label>
				<input bind:value={filters.search} class="input" placeholder="姓名/电话/订单号" on:change={loadData} />
			</div>
			<div>
				<label class="label">状态</label>
				<select bind:value={filters.status} class="select" on:change={loadData}>
					<option value="">全部状态</option>
					{#each Object.entries(ORDER_STATUS_LABELS) as [k, v]}
						<option value={k}>{v}</option>
					{/each}
				</select>
			</div>
			<div>
				<label class="label">渠道</label>
				<select bind:value={filters.channel} class="select" on:change={loadData}>
					<option value="">全部渠道</option>
					{#each Object.entries(CHANNEL_LABELS) as [k, v]}
						<option value={k}>{v}</option>
					{/each}
				</select>
			</div>
			<div>
				<label class="label">房源</label>
				<select bind:value={filters.propertyId} class="select" on:change={loadData}>
					<option value="">全部房源</option>
					{#each properties as p}
						<option value={p.id}>{p.name}</option>
					{/each}
				</select>
			</div>
			<div class="flex items-end">
				<button on:click={onCreate} class="btn-primary w-full">
					<svg class="h-4 w-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
					新建订单
				</button>
			</div>
		</div>
	</div>

	{#if loading}
		<div class="card card-body py-12 text-center text-gray-500">加载中...</div>
	{:else}
		<div class="card overflow-hidden">
			<div class="overflow-x-auto">
				<table class="table">
					<thead class="bg-gray-50">
						<tr>
							<th class="table-th">订单号</th>
							<th class="table-th">客人信息</th>
							<th class="table-th">房源</th>
							<th class="table-th">入住/退房</th>
							<th class="table-th">渠道</th>
							<th class="table-th">金额</th>
							<th class="table-th">状态</th>
							<th class="table-th">操作</th>
						</tr>
					</thead>
					<tbody class="bg-white divide-y divide-gray-200">
						{#if orders.length === 0}
							<tr><td colspan="8" class="py-16 text-center text-gray-400">暂无订单数据</td></tr>
						{/if}
						{#each orders as o}
							<tr class="hover:bg-gray-50">
								<td class="table-td font-mono text-xs text-gray-600">{o.orderNo}</td>
								<td class="table-td">
									<div class="font-medium text-gray-900">{o.guestName}</div>
									<div class="text-xs text-gray-500">{o.guestPhone}</div>
									<div class="text-xs text-gray-400">{o.guestCount}人 · {o.nightCount}夜</div>
								</td>
								<td class="table-td text-sm">{propMap.get(o.propertyId) ?? '-'}</td>
								<td class="table-td text-sm">
									<div>{formatDate(o.checkInDate)} 入住</div>
									<div class="text-gray-500">{formatDate(o.checkOutDate)} 退房</div>
								</td>
								<td class="table-td"><span class="badge bg-gray-100 text-gray-700">{channelLabel(o.channel)}</span></td>
								<td class="table-td">
									<div class="font-semibold text-gray-900">¥{o.totalPrice?.toFixed(2) ?? '0.00'}</div>
									<div class="text-xs text-gray-500">
										{o.paymentStatus === 'paid' ? '已付' : o.paymentStatus === 'partial' ? '部分' : '未付'}
										¥{(o.paidAmount ?? 0).toFixed(2)}
									</div>
								</td>
								<td class="table-td"><span class="badge {statusBadgeColor[o.status] ?? ''}">{orderStatusLabel(o.status)}</span></td>
								<td class="table-td">
									<div class="flex flex-wrap gap-1.5">
										{#if o.status === 'pending'}
											<button on:click={() => onChangeStatus(o, 'confirmed')} class="btn-success text-xs py-1 px-2">确认</button>
										{/if}
										{#if o.status === 'confirmed'}
											<button on:click={() => onChangeStatus(o, 'checked_in')} class="btn-success text-xs py-1 px-2">入住</button>
										{/if}
										{#if o.status === 'checked_in'}
											<button on:click={() => onChangeStatus(o, 'checked_out')} class="btn-secondary text-xs py-1 px-2">退房</button>
										{/if}
										{#if o.status === 'pending' || o.status === 'confirmed'}
											<button on:click={() => onChangeStatus(o, 'cancelled')} class="btn-danger text-xs py-1 px-2">取消</button>
										{/if}
										<button on:click={() => onEdit(o)} class="btn-secondary text-xs py-1 px-2">编辑</button>
										<button on:click={() => onDelete(o.id)} class="btn-danger text-xs py-1 px-2">删除</button>
									</div>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	{/if}
</div>

{#if showModal}
	<OrderModal order={editingOrder} properties={properties} on:saved={onSaved} on:cancel={onCancel} />
{/if}
