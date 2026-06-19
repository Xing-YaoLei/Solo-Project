<script lang="ts">
	import { onMount } from 'svelte';
	import {
		Search, Filter, Package, AlertTriangle, Plus, ArrowUpCircle,
		ArrowDownCircle, X, Check, ChevronRight, History
	} from 'lucide-svelte';
	import {
		mockParts, mockWorkOrders, delay,
		type MockPart
	} from '$lib/mock/data';

	// TODO: tRPC 调用 - 替换为真实数据
	// import { trpc } from '$lib/trpc/client';
	// const result = await trpc.part.list.query({ ...filters, page, pageSize });

	let loading = true;
	let parts: MockPart[] = [];
	let filtered: MockPart[] = [];

	let searchQuery = '';
	let categoryFilter: string = 'ALL';
	let onlyLowStock = false;

	$: categories = ['ALL', ...Array.from(new Set(parts.map(p => p.category || '未分类')))];
	$: {
		let list = parts;
		if (categoryFilter !== 'ALL') list = list.filter(p => (p.category || '未分类') === categoryFilter);
		if (onlyLowStock) list = list.filter(p => p.stockQuantity <= p.safetyStock);
		if (searchQuery) {
			const q = searchQuery.toLowerCase();
			list = list.filter(p =>
				p.sku.toLowerCase().includes(q)
				|| p.name.toLowerCase().includes(q)
				|| (p.category || '').toLowerCase().includes(q)
			);
		}
		filtered = list;
	}

	$: lowStockCount = parts.filter(p => p.stockQuantity <= p.safetyStock).length;

	function isLowFn(p: MockPart): boolean {
		return p.stockQuantity <= p.safetyStock;
	}
	function isWarnFn(p: MockPart): boolean {
		return !isLowFn(p) && p.stockQuantity <= p.safetyStock * 1.5;
	}
	function rowClassFn(p: MockPart): string {
		const isLow = isLowFn(p);
		const isWarn = isWarnFn(p);
		if (isLow) return 'bg-amber-50/60 hover:bg-amber-50';
		if (isWarn) return 'bg-amber-50/30 hover:bg-amber-50/50';
		return 'hover:bg-slate-50/80';
	}

	let showModal = false;
	let modalMode: 'IN' | 'OUT' = 'IN';
	let selectedPart: MockPart | null = null;
	let movementQuantity = 1;
	let movementSource = '';
	let movementRemark = '';

	onMount(async () => {
		await delay(null, 300);
		parts = mockParts;
		loading = false;
	});

	function openMovement(part: MockPart, mode: 'IN' | 'OUT') {
		selectedPart = part;
		modalMode = mode;
		movementQuantity = 1;
		movementSource = mode === 'IN' ? '供应商A' : (mockWorkOrders[0]?.orderNo || '');
		movementRemark = '';
		showModal = true;
	}

	async function confirmMovement() {
		if (!selectedPart || movementQuantity <= 0) return;
		// TODO: tRPC 调用
		// await trpc.part.createMovement.mutate({
		//   partId: selectedPart.id, type: modalMode, quantity: movementQuantity,
		//   workOrderId: modalMode === 'OUT' ? mockWorkOrders[0]?.id : undefined,
		//   source: movementSource, remark: movementRemark
		// });
		await delay(null, 400);
		parts = parts.map(p => {
			if (p.id === selectedPart!.id) {
				return {
					...p,
					stockQuantity: modalMode === 'IN'
						? p.stockQuantity + movementQuantity
						: Math.max(0, p.stockQuantity - movementQuantity)
				};
			}
			return p;
		});
		showModal = false;
		alert(`${modalMode === 'IN' ? '入库' : '出库'}成功：${selectedPart.name} x ${movementQuantity}`);
	}

	function stockPct(p: MockPart) {
		if (p.safetyStock === 0) return 100;
		return Math.min(100, Math.round((p.stockQuantity / (p.safetyStock * 3)) * 100));
	}
	function stockBarColor(p: MockPart) {
		if (p.stockQuantity <= p.safetyStock) return 'bg-red-500';
		if (p.stockQuantity <= p.safetyStock * 1.5) return 'bg-amber-500';
		return 'bg-emerald-500';
	}
</script>

<div class="min-h-screen bg-slate-50 p-6 lg:p-8">
	<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
		<div>
			<h1 class="text-2xl lg:text-3xl font-bold text-slate-900 font-display">配件库存</h1>
			<p class="text-slate-500 mt-1">
				共 {filtered.length} 种配件 · 
				<span class="text-red-600 font-medium">{lowStockCount} 种低库存预警</span>
			</p>
		</div>
		<button
			on:click={() => alert('新增配件功能开发中')}
			class="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary-700 to-primary-600 hover:from-primary-800 hover:to-primary-700 text-white rounded-xl font-medium shadow-md hover:shadow-lg transition-all"
		>
			<Plus class="w-5 h-5" />
			新增配件
		</button>
	</div>

	<div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-6">
		<div class="p-5 border-b border-slate-100 space-y-4">
			<div class="flex flex-col lg:flex-row gap-3 items-start lg:items-center">
				<div class="relative flex-1 w-full lg:max-w-xl">
					<Search class="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
					<input
						type="text"
						bind:value={searchQuery}
						placeholder="搜索 SKU / 配件名称 / 分类..."
						class="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
					/>
				</div>
				<div class="flex flex-wrap gap-3 items-center">
					<div class="relative">
						<Filter class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
						<select
							bind:value={categoryFilter}
							class="pl-9 pr-8 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 appearance-none cursor-pointer"
						>
							{#each categories as c}
								<option value={c}>{c === 'ALL' ? '全部分类' : c}</option>
							{/each}
						</select>
					</div>
					<label class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border cursor-pointer transition-all {onlyLowStock ? 'bg-red-50 border-red-200 text-red-700' : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'}">
						<input type="checkbox" bind:checked={onlyLowStock} class="sr-only" />
						<AlertTriangle class="w-4 h-4" />
						<span class="text-sm font-medium">仅看低库存</span>
					</label>
				</div>
			</div>
		</div>
	</div>

	<div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
		<div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
			<div class="flex items-center gap-3">
				<div class="w-12 h-12 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center">
					<Package class="w-6 h-6" />
				</div>
				<div>
					<div class="text-2xl font-bold text-slate-900">{parts.length}</div>
					<div class="text-sm text-slate-500">配件种类</div>
				</div>
			</div>
		</div>
		<div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
			<div class="flex items-center gap-3">
				<div class="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
					<AlertTriangle class="w-6 h-6" />
				</div>
				<div>
					<div class="text-2xl font-bold text-red-600">{lowStockCount}</div>
					<div class="text-sm text-slate-500">低库存预警</div>
				</div>
			</div>
		</div>
		<div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
			<div class="flex items-center gap-3">
				<div class="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
					<History class="w-6 h-6" />
				</div>
				<div>
					<div class="text-2xl font-bold text-slate-900">
						¥{parts.reduce((s, p) => s + Number(p.unitPrice) * p.stockQuantity, 0).toLocaleString()}
					</div>
					<div class="text-sm text-slate-500">库存总值</div>
				</div>
			</div>
		</div>
	</div>

	<div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
		<div class="overflow-x-auto">
			<table class="w-full min-w-[900px]">
				<thead class="bg-slate-50 border-b border-slate-100">
					<tr>
						<th class="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider py-3.5 px-5">SKU</th>
						<th class="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider py-3.5 px-5">配件信息</th>
						<th class="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider py-3.5 px-5">分类</th>
						<th class="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider py-3.5 px-5">库存状态</th>
						<th class="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider py-3.5 px-5">单价</th>
						<th class="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider py-3.5 px-5">库存价值</th>
						<th class="text-center text-xs font-semibold text-slate-500 uppercase tracking-wider py-3.5 px-5">操作</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-slate-100">
					{#if loading}
						<tr>
							<td colspan="7" class="py-20 text-center text-slate-400">
								<div class="inline-flex items-center gap-2">
									<svg class="animate-spin h-5 w-5 text-primary-500" viewBox="0 0 24 24">
										<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" />
										<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
									</svg>
									<span>加载中...</span>
								</div>
							</td>
						</tr>
					{:else if filtered.length === 0}
						<tr>
							<td colspan="7" class="py-20 text-center text-slate-400">
								<Package class="w-12 h-12 mx-auto mb-3 text-slate-300" />
								暂无配件数据
							</td>
						</tr>
					{:else}
						{#each filtered as part}
							<tr class={'transition-colors ' + rowClassFn(part)}>
								<td class="py-4 px-5">
									<span class="font-mono text-sm text-slate-600">{part.sku}</span>
								</td>
								<td class="py-4 px-5">
									<div class="flex items-center gap-3">
										<div class="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
											<Package class="w-5 h-5" />
										</div>
										<div>
											<div class="font-semibold text-slate-800">{part.name}</div>
											<div class="text-xs text-slate-500 mt-0.5">安全库存: {part.safetyStock} {part.unit}</div>
										</div>
										{#if isLowFn(part)}
										<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-medium ml-2">
											<AlertTriangle class="w-3 h-3" />
											低库存
										</span>
									{/if}
									</div>
								</td>
								<td class="py-4 px-5">
									<span class="inline-flex px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium">{part.category || '未分类'}</span>
								</td>
								<td class="py-4 px-5 w-52">
									<div class="flex items-center justify-between mb-1.5">
										<span class={'text-sm font-bold ' + (isLowFn(part) ? 'text-red-600' : isWarnFn(part) ? 'text-amber-600' : 'text-emerald-600')}>
											{part.stockQuantity} {part.unit}
										</span>
									</div>
									<div class="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
										<div class={'h-full rounded-full transition-all ' + stockBarColor(part)} style={'width: ' + stockPct(part) + '%'} />
									</div>
								</td>
								<td class="py-4 px-5 text-right">
									<span class="text-sm font-medium text-slate-700">¥{Number(part.unitPrice).toLocaleString()}</span>
								</td>
								<td class="py-4 px-5 text-right">
									<span class="text-sm font-bold text-accent-600">¥{(Number(part.unitPrice) * part.stockQuantity).toLocaleString()}</span>
								</td>
								<td class="py-4 px-5">
									<div class="flex items-center justify-center gap-2">
										<button
											on:click={() => openMovement(part, 'IN')}
											title="入库"
											class="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors"
										>
											<ArrowDownCircle class="w-4 h-4" />
											入库
										</button>
										<button
											on:click={() => openMovement(part, 'OUT')}
											title="出库"
											class="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
										>
											<ArrowUpCircle class="w-4 h-4" />
											出库
										</button>
									</div>
								</td>
							</tr>
						{/each}
					{/if}
				</tbody>
			</table>
		</div>
		<div class="flex items-center justify-between px-5 py-4 border-t border-slate-100 text-sm text-slate-500">
			<div>共 {filtered.length} 条</div>
		</div>
	</div>
</div>

{#if showModal && selectedPart}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4" on:click={() => showModal = false}>
		<div class="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" on:click|stopPropagation>
			<div class="flex items-center justify-between mb-6">
				<div class="flex items-center gap-3">
					<div class={'w-11 h-11 rounded-xl flex items-center justify-center ' + (modalMode === 'IN' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600')}>
						{#if modalMode === 'IN'}
							<ArrowDownCircle class="w-6 h-6" />
						{:else}
							<ArrowUpCircle class="w-6 h-6" />
						{/if}
					</div>
					<div>
						<h3 class="text-lg font-bold text-slate-900">{modalMode === 'IN' ? '配件入库' : '配件出库'}</h3>
						<p class="text-sm text-slate-500">{selectedPart.name}</p>
					</div>
				</div>
				<button on:click={() => showModal = false} class="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
					<X class="w-5 h-5" />
				</button>
			</div>

			<div class="space-y-4">
				<div class="p-4 rounded-xl bg-slate-50 border border-slate-100">
					<div class="grid grid-cols-2 gap-3 text-sm">
						<div>
							<div class="text-xs text-slate-500">SKU</div>
							<div class="font-mono text-slate-800 font-medium mt-0.5">{selectedPart.sku}</div>
						</div>
						<div>
							<div class="text-xs text-slate-500">分类</div>
							<div class="text-slate-800 font-medium mt-0.5">{selectedPart.category || '未分类'}</div>
						</div>
						<div>
							<div class="text-xs text-slate-500">当前库存</div>
							<div class="text-slate-800 font-semibold mt-0.5">{selectedPart.stockQuantity} {selectedPart.unit}</div>
						</div>
						<div>
							<div class="text-xs text-slate-500">安全库存</div>
							<div class="text-slate-800 font-medium mt-0.5">{selectedPart.safetyStock} {selectedPart.unit}</div>
						</div>
					</div>
				</div>

				<div>
					<label class="block text-sm font-medium text-slate-700 mb-1.5">
						{modalMode === 'IN' ? '入库数量' : '出库数量'}
					</label>
					<input
						type="number"
						min="1"
						bind:value={movementQuantity}
						class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
					/>
					{#if modalMode === 'OUT' && movementQuantity > selectedPart.stockQuantity}
						<p class="text-xs text-red-600 mt-1.5 flex items-center gap-1">
							<AlertTriangle class="w-3.5 h-3.5" /> 出库数量不能超过当前库存
						</p>
					{/if}
				</div>

				<div>
					<label class="block text-sm font-medium text-slate-700 mb-1.5">
						{modalMode === 'IN' ? '来源供应商' : '关联工单号'}
					</label>
					<input
						type="text"
						bind:value={movementSource}
						placeholder={modalMode === 'IN' ? '请输入供应商名称' : '请输入工单号'}
						class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
					/>
				</div>

				<div>
					<label class="block text-sm font-medium text-slate-700 mb-1.5">备注（选填）</label>
					<textarea
						bind:value={movementRemark}
						rows="2"
						placeholder="请输入备注信息..."
						class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
					/>
				</div>
			</div>

			<div class="flex justify-end gap-3 mt-6">
				<button on:click={() => showModal = false} class="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium transition-colors">
					取消
				</button>
				<button
					on:click={confirmMovement}
					disabled={movementQuantity <= 0 || (modalMode === 'OUT' && movementQuantity > selectedPart.stockQuantity)}
					class={'inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ' + (modalMode === 'IN' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-blue-600 hover:bg-blue-700')}
				>
					<Check class="w-4 h-4" />
					确认{modalMode === 'IN' ? '入库' : '出库'}
				</button>
			</div>
		</div>
	</div>
{/if}
