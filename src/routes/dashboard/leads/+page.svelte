<script lang="ts">
	import { onMount } from 'svelte';
	import { currentUser, isManager } from '$lib/stores/auth';
	import { pageTitle } from '$lib/stores/page';
	import { statusLabel } from '$lib/utils/api';
	import type { TestDriveLead, LeadStatus } from '$lib/types';

	$: pageTitle.set($isManager ? '线索转化明细' : '我的线索');

	let leads: TestDriveLead[] = [];
	let total = 0;
	let loading = true;
	let filterStatus: LeadStatus | '' = '';
	let searchText = '';

	let noteModalOpen = false;
	let selectedLead: TestDriveLead | null = null;
	let noteText = '';
	let noteSubmitting = false;
	let noteError = '';

	const statusOptions: { value: LeadStatus | ''; label: string }[] = [
		{ value: '', label: '全部状态' },
		{ value: 'appointed', label: '已预约' },
		{ value: 'arrived', label: '已到店' },
		{ value: 'completed', label: '试驾完成' },
		{ value: 'no_show', label: '试驾爽约' },
		{ value: 'closed', label: '已成交' }
	];

	async function loadLeads() {
		loading = true;
		try {
			const url = new URL('/api/leads', location.origin);
			if (filterStatus) url.searchParams.set('status', filterStatus);
			const res = await fetch(url.toString());
			const data = await res.json();
			leads = data.items ?? [];
			total = data.total ?? 0;
		} catch {
			/* ignore */
		} finally {
			loading = false;
		}
	}

	$: filteredLeads = leads.filter((l) => {
		if (!searchText) return true;
		const q = searchText.toLowerCase();
		return (
			l.customerName.toLowerCase().includes(q) ||
			l.phone.toLowerCase().includes(q) ||
			l.vehicleModel.toLowerCase().includes(q) ||
			l.salespersonName.toLowerCase().includes(q)
		);
	});

	function openNoteModal(lead: TestDriveLead) {
		selectedLead = lead;
		noteText = lead.noShowNote ?? '';
		noteError = '';
		noteModalOpen = true;
	}

	function closeNoteModal() {
		noteModalOpen = false;
		selectedLead = null;
		noteText = '';
	}

	async function submitNote() {
		if (!selectedLead || !noteText.trim()) {
			noteError = '请输入注释内容';
			return;
		}
		noteSubmitting = true;
		noteError = '';

		try {
			const res = await fetch(`/api/leads/${selectedLead.id}/note`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ note: noteText.trim() })
			});
			if (!res.ok) {
				const d = await res.json();
				throw new Error(d.error);
			}
			await loadLeads();
			closeNoteModal();
		} catch (e) {
			noteError = (e as Error).message;
		} finally {
			noteSubmitting = false;
		}
	}

	onMount(loadLeads);
</script>

<div class="space-y-5">
	<div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
		<div class="flex flex-col sm:flex-row gap-3">
			<div class="relative">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-navy-400">
					<path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
				</svg>
				<input
					bind:value={searchText}
					type="text"
					placeholder="搜索客户、手机号、车型..."
					class="input-field pl-10 pr-4 w-72"
				/>
			</div>
			<select bind:value={filterStatus} on:change={loadLeads} class="input-field w-44">
				{#each statusOptions as opt}
					<option value={opt.value}>{opt.label}</option>
				{/each}
			</select>
		</div>
		<div class="text-navy-300 text-sm">
			共 <span class="text-white font-semibold">{filteredLeads.length}</span> 条线索
		</div>
	</div>

	<div class="card overflow-hidden">
		<div class="overflow-x-auto">
			{#if loading}
				<div class="p-16 text-center text-navy-400">加载中...</div>
			{:else if filteredLeads.length === 0}
				<div class="p-16 text-center text-navy-400">暂无线索数据</div>
			{:else}
				<table class="w-full text-sm">
					<thead>
						<tr class="border-b border-navy-700/40 bg-navy-900/40 text-navy-300">
							<th class="text-left px-6 py-3 font-medium">客户姓名</th>
							<th class="text-left px-6 py-3 font-medium">手机号码</th>
							<th class="text-left px-6 py-3 font-medium">车型</th>
							{#if $isManager}
								<th class="text-left px-6 py-3 font-medium">销售</th>
							{/if}
							<th class="text-left px-6 py-3 font-medium">预约时间</th>
							<th class="text-left px-6 py-3 font-medium">状态</th>
							<th class="text-left px-6 py-3 font-medium">操作</th>
						</tr>
					</thead>
					<tbody>
						{#each filteredLeads as lead}
							<tr class="border-b border-navy-800/40 hover:bg-navy-800/30 transition-colors">
								<td class="px-6 py-3.5 text-white font-medium">{lead.customerName}</td>
								<td class="px-6 py-3.5 text-navy-300">{lead.phone}</td>
								<td class="px-6 py-3.5 text-navy-300">{lead.vehicleModel || '-'}</td>
								{#if $isManager}
									<td class="px-6 py-3.5 text-navy-300">{lead.salespersonName}</td>
								{/if}
								<td class="px-6 py-3.5 text-navy-300">{lead.appointmentTime?.slice(0, 16).replace('T', ' ')}</td>
								<td class="px-6 py-3.5">
									<span class="badge status-{lead.status}">{statusLabel(lead.status)}</span>
								</td>
								<td class="px-6 py-3.5">
									{#if lead.status === 'no_show' || lead.status === 'appointed'}
										{#if !$isManager || lead.salespersonId === $currentUser?.id}
											<button
												on:click={() => openNoteModal(lead)}
												class="text-cyan-400 hover:text-cyan-300 text-sm font-medium transition-colors"
											>
												{lead.noShowNote ? '查看/编辑注释' : '添加爽约注释'}
											</button>
										{/if}
									{:else if lead.noShowNote}
										<span class="text-navy-400 text-xs">有注释</span>
									{/if}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			{/if}
		</div>
	</div>
</div>

{#if noteModalOpen && selectedLead}
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4">
		<div class="absolute inset-0 bg-navy-950/70 backdrop-blur-sm" on:click={closeNoteModal} />
		<div class="relative card w-full max-w-lg animate-slide-up">
			<div class="card-header flex items-center justify-between">
				<h3 class="text-white font-semibold">爽约注释 - {selectedLead.customerName}</h3>
				<button on:click={closeNoteModal} class="text-navy-400 hover:text-white transition-colors">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-5 h-5">
						<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>
			<div class="p-6 space-y-4">
				<div class="bg-navy-800/40 rounded-lg p-4 text-sm space-y-1">
					<div class="text-navy-400">车型：<span class="text-white">{selectedLead.vehicleModel}</span></div>
					<div class="text-navy-400">预约时间：<span class="text-white">{selectedLead.appointmentTime?.slice(0, 16).replace('T', ' ')}</span></div>
				</div>
				<div>
					<label class="block text-navy-300 text-sm font-medium mb-2">爽约原因注释</label>
					<textarea
						bind:value={noteText}
						rows={4}
						placeholder="请输入爽约原因或客户备注..."
						class="input-field resize-none"
					/>
				</div>
				{#if noteError}
					<div class="bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm px-4 py-2.5 rounded-lg">{noteError}</div>
				{/if}
				<div class="flex justify-end gap-3 pt-2">
					<button on:click={closeNoteModal} class="btn-secondary">取消</button>
					<button on:click={submitNote} class="btn-primary" disabled={noteSubmitting}>
						{noteSubmitting ? '保存中...' : '保存注释'}
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}
