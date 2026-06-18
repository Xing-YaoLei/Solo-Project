<script lang="ts">
	import { onMount } from 'svelte';
	import { pageTitle } from '$lib/stores/page';
	import { sourceLabel, batchStatusLabel, statusLabel } from '$lib/utils/api';
	import type { ImportBatch, SourceType, TestDriveLead } from '$lib/types';

	pageTitle.set('数据导入批次管理');

	let batches: ImportBatch[] = [];
	let loading = true;

	let uploadModalOpen = false;
	let uploadSourceType: SourceType = 'finance';
	let uploadBatchName = '';
	let uploadFile: File | null = null;
	let uploading = false;
	let uploadError = '';

	let detailModalOpen = false;
	let selectedBatch: (ImportBatch & { records?: unknown[]; mergedLeads?: TestDriveLead[] }) | null = null;

	async function loadBatches() {
		loading = true;
		try {
			const res = await fetch('/api/imports');
			batches = await res.json();
		} catch {
			/* ignore */
		} finally {
			loading = false;
		}
	}

	function openUploadModal() {
		uploadSourceType = 'finance';
		uploadBatchName = '';
		uploadFile = null;
		uploadError = '';
		uploadModalOpen = true;
	}

	function closeUploadModal() {
		uploadModalOpen = false;
	}

	function handleFileChange(e: Event) {
		const input = e.target as HTMLInputElement;
		uploadFile = input.files?.[0] ?? null;
	}

	async function handleUpload() {
		if (!uploadFile) {
			uploadError = '请选择文件';
			return;
		}
		if (!uploadBatchName.trim()) {
			uploadError = '请输入批次名称';
			return;
		}

		uploading = true;
		uploadError = '';

		try {
			const fd = new FormData();
			fd.append('file', uploadFile);
			fd.append('sourceType', uploadSourceType);
			fd.append('batchName', uploadBatchName.trim());

			const res = await fetch('/api/imports/upload', { method: 'POST', body: fd });
			if (!res.ok) {
				const d = await res.json();
				throw new Error(d.error);
			}
			await loadBatches();
			closeUploadModal();
		} catch (e) {
			uploadError = (e as Error).message;
		} finally {
			uploading = false;
		}
	}

	async function viewBatchDetail(batch: ImportBatch) {
		try {
			const res = await fetch(`/api/imports/${batch.id}`);
			const data = await res.json();
			selectedBatch = { ...batch, records: data.records, mergedLeads: data.mergedLeads };
			detailModalOpen = true;
		} catch {
			/* ignore */
		}
	}

	function closeDetailModal() {
		detailModalOpen = false;
		selectedBatch = null;
	}

	function sourceColor(s: SourceType): string {
		return {
			finance: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
			crm: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
			inspection: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
		}[s];
	}

	function batchStatusColor(s: string): string {
		return {
			processing: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
			merged: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
			failed: 'bg-rose-500/15 text-rose-400 border-rose-500/30'
		}[s] ?? 'bg-navy-500/15 text-navy-400';
	}

	onMount(loadBatches);
</script>

<div class="space-y-5">
	<div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
		<div class="text-navy-300 text-sm">
			管理金融审批、CRM、检测仪三类数据源的导入批次，支持按批次回查原始记录与合并结果
		</div>
		<button on:click={openUploadModal} class="btn-primary self-start md:self-auto">
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4 mr-2">
				<path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
			</svg>
			新建导入批次
		</button>
	</div>

	<div class="grid grid-cols-1 md:grid-cols-3 gap-5">
		<div class="card p-5">
			<div class="text-navy-400 text-xs uppercase tracking-wider mb-2">金融审批批次</div>
			<div class="text-white text-2xl font-bold">{batches.filter((b) => b.sourceType === 'finance').length}</div>
		</div>
		<div class="card p-5">
			<div class="text-navy-400 text-xs uppercase tracking-wider mb-2">CRM 批次</div>
			<div class="text-white text-2xl font-bold">{batches.filter((b) => b.sourceType === 'crm').length}</div>
		</div>
		<div class="card p-5">
			<div class="text-navy-400 text-xs uppercase tracking-wider mb-2">检测仪批次</div>
			<div class="text-white text-2xl font-bold">{batches.filter((b) => b.sourceType === 'inspection').length}</div>
		</div>
	</div>

	<div class="card overflow-hidden">
		{#if loading}
			<div class="p-16 text-center text-navy-400">加载中...</div>
		{:else if batches.length === 0}
			<div class="p-16 text-center text-navy-400">暂无导入批次</div>
		{:else}
			<div class="overflow-x-auto">
				<table class="w-full text-sm">
					<thead>
						<tr class="border-b border-navy-700/40 bg-navy-900/40 text-navy-300">
							<th class="text-left px-6 py-3 font-medium">批次名称</th>
							<th class="text-left px-6 py-3 font-medium">数据源</th>
							<th class="text-left px-6 py-3 font-medium">状态</th>
							<th class="text-left px-6 py-3 font-medium">记录数</th>
							<th class="text-left px-6 py-3 font-medium">合并数</th>
							<th class="text-left px-6 py-3 font-medium">创建时间</th>
							<th class="text-left px-6 py-3 font-medium">操作</th>
						</tr>
					</thead>
					<tbody>
						{#each batches as batch}
							<tr class="border-b border-navy-800/40 hover:bg-navy-800/30 transition-colors">
								<td class="px-6 py-3.5 text-white font-medium">{batch.name}</td>
								<td class="px-6 py-3.5">
									<span class="badge border {sourceColor(batch.sourceType)}">{sourceLabel(batch.sourceType)}</span>
								</td>
								<td class="px-6 py-3.5">
									<span class="badge border {batchStatusColor(batch.status)}">{batchStatusLabel(batch.status)}</span>
								</td>
								<td class="px-6 py-3.5 text-navy-300">{batch.recordCount}</td>
								<td class="px-6 py-3.5 text-navy-300">{batch.mergedCount}</td>
								<td class="px-6 py-3.5 text-navy-300">{batch.createdAt?.slice(0, 16).replace('T', ' ')}</td>
								<td class="px-6 py-3.5">
									<button
										on:click={() => viewBatchDetail(batch)}
										class="text-cyan-400 hover:text-cyan-300 text-sm font-medium transition-colors"
									>
										查看详情
									</button>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</div>
</div>

{#if uploadModalOpen}
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4">
		<div class="absolute inset-0 bg-navy-950/70 backdrop-blur-sm" on:click={closeUploadModal} />
		<div class="relative card w-full max-w-md animate-slide-up">
			<div class="card-header flex items-center justify-between">
				<h3 class="text-white font-semibold">新建导入批次</h3>
				<button on:click={closeUploadModal} class="text-navy-400 hover:text-white transition-colors">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-5 h-5">
						<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>
			<div class="p-6 space-y-4">
				<div>
					<label class="block text-navy-300 text-sm font-medium mb-2">数据源类型</label>
					<select bind:value={uploadSourceType} class="input-field">
						<option value="finance">金融审批表</option>
						<option value="crm">CRM 系统数据</option>
						<option value="inspection">检测仪数据</option>
					</select>
				</div>
				<div>
					<label class="block text-navy-300 text-sm font-medium mb-2">批次名称</label>
					<input bind:value={uploadBatchName} type="text" class="input-field" placeholder="例如：金融审批-20240619" />
				</div>
				<div>
					<label class="block text-navy-300 text-sm font-medium mb-2">上传文件（支持 CSV / Excel）</label>
					<input on:change={handleFileChange} type="file" accept=".csv,.xlsx,.xls" class="input-field file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-sm file:bg-navy-700 file:text-cyan-400 hover:file:bg-navy-600" />
				</div>
				<div class="bg-navy-800/40 rounded-lg p-3 text-xs text-navy-400 leading-relaxed">
					合并优先级：金融审批 → CRM → 检测仪，按手机号自动匹配合并
				</div>
				{#if uploadError}
					<div class="bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm px-4 py-2.5 rounded-lg">{uploadError}</div>
				{/if}
				<div class="flex justify-end gap-3 pt-2">
					<button on:click={closeUploadModal} class="btn-secondary" disabled={uploading}>取消</button>
					<button on:click={handleUpload} class="btn-primary" disabled={uploading}>
						{uploading ? '处理中...' : '开始导入'}
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}

{#if detailModalOpen && selectedBatch}
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4">
		<div class="absolute inset-0 bg-navy-950/70 backdrop-blur-sm" on:click={closeDetailModal} />
		<div class="relative card w-full max-w-4xl max-h-[85vh] flex flex-col animate-slide-up">
			<div class="card-header flex items-center justify-between flex-shrink-0">
				<div>
					<h3 class="text-white font-semibold">{selectedBatch.name}</h3>
					<div class="text-navy-400 text-xs mt-1">
						{sourceLabel(selectedBatch.sourceType)} · 共 {selectedBatch.recordCount} 条原始记录，已合并 {selectedBatch.mergedCount} 条
					</div>
				</div>
				<button on:click={closeDetailModal} class="text-navy-400 hover:text-white transition-colors">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-5 h-5">
						<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>
			<div class="p-6 overflow-y-auto space-y-6">
				<section>
					<h4 class="text-white font-medium mb-3 text-sm">合并到试驾线索</h4>
					<div class="bg-navy-800/40 rounded-lg overflow-hidden max-h-64 overflow-y-auto">
						<table class="w-full text-xs">
							<thead class="bg-navy-900/60 sticky top-0">
								<tr class="text-navy-300">
									<th class="text-left px-4 py-2">客户</th>
									<th class="text-left px-4 py-2">车型</th>
									<th class="text-left px-4 py-2">销售</th>
									<th class="text-left px-4 py-2">状态</th>
								</tr>
							</thead>
							<tbody>
								{#each (selectedBatch.mergedLeads ?? []) as lead}
									<tr class="border-t border-navy-700/30">
										<td class="px-4 py-2 text-white">{lead.customerName}</td>
										<td class="px-4 py-2 text-navy-300">{lead.vehicleModel || '-'}</td>
										<td class="px-4 py-2 text-navy-300">{lead.salespersonName}</td>
										<td class="px-4 py-2"><span class="badge status-{lead.status} text-[10px]">{statusLabel(lead.status)}</span></td>
									</tr>
								{:else}
									<tr><td colspan="4" class="px-4 py-6 text-center text-navy-400">暂无合并线索</td></tr>
								{/each}
							</tbody>
						</table>
					</div>
				</section>

				<section>
					<h4 class="text-white font-medium mb-3 text-sm">原始数据预览（前 {Math.min((selectedBatch.records?.length ?? 0), 10)} 条）</h4>
					<div class="bg-navy-800/40 rounded-lg p-4 overflow-x-auto max-h-64 overflow-y-auto">
						<pre class="text-xs text-navy-300 whitespace-pre-wrap">{JSON.stringify(selectedBatch.records?.slice(0, 10), null, 2)}</pre>
					</div>
				</section>
			</div>
		</div>
	</div>
{/if}
