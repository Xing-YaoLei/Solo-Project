<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import {
		Pill,
		Plus,
		Search,
		Filter,
		ChevronRight,
		User,
		Calendar,
		CheckCircle2,
		X,
		AlertCircle,
		Save,
		Clock,
		UserCheck
	} from 'lucide-svelte';
	import { createTRPCProxyClient } from '$lib/trpc/client';
	import StatusBadge from '$lib/components/StatusBadge.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import {
		formatDate,
		formatDateTime,
		formatRelativeTime
	} from '$lib/utils/format';
	import { cn } from '$lib/utils/cn';
	import type { Medication, Elder, MedicationExecution } from '$shared/types';
	import { hasRole } from '$lib/stores/auth';

	const trpc = createTRPCProxyClient();
	const canEdit = hasRole(['doctor', 'nurse', 'supervisor', 'admin']);

	let loading = true;
	let medications: Medication[] = [];
	let elders: Elder[] = [];
	let executions: MedicationExecution[] = [];

	let search = '';
	let selectedElderId = '';
	let showActiveOnly = true;
	let showFilters = false;
	let activeTab: 'medications' | 'executions' = 'medications';

	let showAddModal = false;
	let newMedElderId = '';
	let newMedName = '';
	let newMedDosage = '';
	let newMedFrequency = '';
	let newMedRoute = '';
	let newMedStartDate = new Date().toISOString().slice(0, 10);
	let newMedEndDate = '';
	let newMedPrescribedBy = '';
	let newMedNotes = '';
	let submitting = false;
	let modalError = '';

	$: filterParams = {
		elderId: selectedElderId || undefined
	};

	$: filteredMeds = medications.filter((m) => {
		if (showActiveOnly && !m.isActive) return false;
		if (filterParams.elderId && m.elderId !== filterParams.elderId) return false;
		if (search.trim()) {
			const q = search.toLowerCase();
			const elderName = getElderName(m.elderId).toLowerCase();
			return (
				m.name.toLowerCase().includes(q) ||
				elderName.includes(q)
			);
		}
		return true;
	});

	$: filteredExecutions = executions.filter((e) => {
		if (filterParams.elderId) {
			const med = medications.find((m) => m.id === e.medicationId);
			if (!med || med.elderId !== filterParams.elderId) return false;
		}
		return true;
	});

	async function loadData() {
		loading = true;
		try {
			const [elderResult] = await Promise.all([
				trpc.elder.list.query({ page: 1, pageSize: 100 })
			]);
			elders = elderResult.items;

			if (elders.length > 0) {
				const elderId = selectedElderId || elders[0].id;
				const [meds, execs] = await Promise.all([
					trpc.medication.listByElder.query({ elderId, includeInactive: true }),
					trpc.medication.listExecutions.query({ elderId, page: 1, pageSize: 50 })
				]);
				medications = meds;
				executions = execs.items;
			}
		} catch (e) {
			console.error('Failed to load medications:', e);
		} finally {
			loading = false;
		}
	}

	async function reloadForElder(elderId: string) {
		try {
			const [meds, execs] = await Promise.all([
				trpc.medication.listByElder.query({ elderId, includeInactive: true }),
				trpc.medication.listExecutions.query({ elderId, page: 1, pageSize: 50 })
			]);
			medications = meds;
			executions = execs.items;
		} catch (e) {
			console.error(e);
		}
	}

	function getElderName(elderId: string): string {
		return elders.find((e) => e.id === elderId)?.name ?? '未知';
	}

	function resetFilters() {
		search = '';
		selectedElderId = '';
		showActiveOnly = true;
	}

	function openAddModal() {
		showAddModal = true;
		newMedElderId = selectedElderId || elders[0]?.id || '';
		newMedName = '';
		newMedDosage = '';
		newMedFrequency = '';
		newMedRoute = '';
		newMedStartDate = new Date().toISOString().slice(0, 10);
		newMedEndDate = '';
		newMedPrescribedBy = '';
		newMedNotes = '';
		modalError = '';
	}

	function closeAddModal() {
		showAddModal = false;
	}

	async function handleAddMedication() {
		modalError = '';
		if (!newMedElderId || !newMedName || !newMedDosage || !newMedFrequency || !newMedRoute || !newMedStartDate) {
			modalError = '请填写所有必填项';
			return;
		}
		submitting = true;
		try {
			await trpc.medication.create.mutate({
				elderId: newMedElderId,
				name: newMedName.trim(),
				dosage: newMedDosage.trim(),
				frequency: newMedFrequency.trim(),
				route: newMedRoute.trim(),
				startDate: new Date(newMedStartDate),
				endDate: newMedEndDate ? new Date(newMedEndDate) : null,
				prescribedBy: newMedPrescribedBy.trim() || undefined,
				notes: newMedNotes.trim() || undefined
			});
			closeAddModal();
			await reloadForElder(newMedElderId);
		} catch (e) {
			modalError = e instanceof Error ? e.message : '创建失败';
		} finally {
			submitting = false;
		}
	}

	async function handleRecordExecution(med: Medication) {
		try {
			await trpc.medication.recordExecution.mutate({
				medicationId: med.id
			});
			await reloadForElder(med.elderId);
		} catch (e) {
			console.error(e);
		}
	}

	$: if (selectedElderId) {
		reloadForElder(selectedElderId);
	}

	onMount(() => {
		loadData();
	});
</script>

<div class="space-y-5">
	<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
		<div>
			<h1 class="text-xl font-bold text-gray-800 font-serif">用药清单</h1>
			<p class="text-sm text-gray-500 mt-1">管理老人用药信息与执行记录</p>
		</div>
		{#if $canEdit}
			<button type="button" on:click={openAddModal} class="btn-primary">
				<Plus class="w-4 h-4" />
				新增用药
			</button>
		{/if}
	</div>

	<div class="card p-4">
		<div class="flex flex-col lg:flex-row gap-3">
			<div class="flex-1 relative">
				<Search class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
				<input
					type="text"
					bind:value={search}
					placeholder="搜索药品名称或老人姓名"
					class="input pl-10"
				/>
			</div>
			<div class="flex items-center gap-2 lg:hidden">
				<button
					type="button"
					on:click={() => showFilters = !showFilters}
					class={cn('btn-secondary', showFilters && 'bg-primary-50 border-primary-300')}
				>
					<Filter class="w-4 h-4" />
					筛选
				</button>
			</div>
			<div class="hidden lg:flex items-center gap-2">
				<select
					bind:value={selectedElderId}
					class="input w-auto"
				>
					<option value="">选择老人</option>
					{#each elders as e}
						<option value={e.id}>{e.name}</option>
					{/each}
				</select>
				<label class="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-50">
					<input type="checkbox" bind:checked={showActiveOnly} class="accent-primary-500" />
					<span class="text-sm text-gray-700">仅显示在用</span>
				</label>
				<button type="button" on:click={resetFilters} class="btn-ghost">
					重置
				</button>
			</div>
		</div>

		{#if showFilters}
			<div class="lg:hidden mt-4 pt-4 border-t border-gray-100">
				<div class="space-y-3">
					<select bind:value={selectedElderId} class="input w-full">
						<option value="">选择老人</option>
						{#each elders as e}
							<option value={e.id}>{e.name}</option>
						{/each}
					</select>
					<label class="flex items-center gap-2">
						<input type="checkbox" bind:checked={showActiveOnly} class="accent-primary-500" />
						<span class="text-sm text-gray-700">仅显示在用药品</span>
					</label>
					<button type="button" on:click={resetFilters} class="btn-secondary w-full">
						重置筛选
					</button>
				</div>
			</div>
		{/if}

		<div class="mt-4 flex border-b border-gray-100 -mx-4 px-4">
			<button
				type="button"
				on:click={() => (activeTab = 'medications')}
				class={cn(
					'tab-btn whitespace-nowrap',
					activeTab === 'medications' && 'active'
				)}
			>
				<Pill class="w-4 h-4" />
				用药清单
			</button>
			<button
				type="button"
				on:click={() => (activeTab = 'executions')}
				class={cn(
					'tab-btn whitespace-nowrap',
					activeTab === 'executions' && 'active'
				)}
			>
				<Clock class="w-4 h-4" />
				执行记录
			</button>
		</div>
	</div>

	{#if loading}
		<div class="flex items-center justify-center py-20">
			<div class="flex flex-col items-center gap-3">
				<div class="w-8 h-8 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
				<p class="text-sm text-gray-500">加载中...</p>
			</div>
		</div>
	{:else if activeTab === 'medications'}
		{#if filteredMeds.length === 0}
			<div class="card p-12 text-center">
				<Pill class="w-12 h-12 text-gray-300 mx-auto mb-4" />
				<p class="text-gray-500 mb-2">暂无用药记录</p>
				{#if $canEdit}
					<button type="button" on:click={openAddModal} class="btn-primary mt-2">
						<Plus class="w-4 h-4" />
						新增第一条用药
					</button>
				{/if}
			</div>
		{:else}
			<div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
				{#each filteredMeds as med}
					<div class={cn('card p-5 transition-all', !med.isActive && 'opacity-60')}>
						<div class="flex items-start justify-between gap-3 mb-3">
							<div class="flex items-center gap-3 min-w-0">
								<div class={cn(
									'w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0',
									med.isActive ? 'bg-mint-50' : 'bg-gray-100'
								)}>
									<Pill class={cn('w-5 h-5', med.isActive ? 'text-mint-600' : 'text-gray-400')} />
								</div>
								<div class="min-w-0">
									<p class="font-semibold text-gray-800 truncate">{med.name}</p>
									<p class="text-xs text-gray-500 mt-0.5">{getElderName(med.elderId)}</p>
								</div>
							</div>
							{#if med.isActive}
								<StatusBadge variant="success" label="使用中" showDot={false} />
							{:else}
								<StatusBadge variant="muted" label="已停用" showDot={false} />
							{/if}
						</div>

						<div class="space-y-2 text-sm mb-4">
							<div class="flex items-center gap-2 text-gray-600">
								<span class="text-gray-400">剂量：</span>
								<span class="font-medium text-gray-800">{med.dosage}</span>
							</div>
							<div class="flex items-center gap-2 text-gray-600">
								<span class="text-gray-400">频次：</span>
								<span class="font-medium text-gray-800">{med.frequency}</span>
							</div>
							<div class="flex items-center gap-2 text-gray-600">
								<span class="text-gray-400">方式：</span>
								<span class="font-medium text-gray-800">{med.route}</span>
							</div>
							<div class="flex items-center gap-2 text-gray-600">
								<Calendar class="w-4 h-4 text-gray-400 flex-shrink-0" />
								<span>
									{formatDate(med.startDate)} ~ {med.endDate ? formatDate(med.endDate) : '长期'}
								</span>
							</div>
							{#if med.prescribedBy}
								<div class="flex items-center gap-2 text-gray-600">
									<User class="w-4 h-4 text-gray-400 flex-shrink-0" />
									<span>开方医生：{med.prescribedBy}</span>
								</div>
							{/if}
						</div>

						{#if med.notes}
							<div class="p-3 rounded-xl bg-gray-50 border border-gray-100 mb-4">
								<p class="text-xs text-gray-500 mb-1">用药说明</p>
								<p class="text-sm text-gray-700">{med.notes}</p>
							</div>
						{/if}

						{#if $canEdit && med.isActive}
							<button
								type="button"
								on:click={() => handleRecordExecution(med)}
								class="w-full btn-secondary text-sm"
							>
								<UserCheck class="w-4 h-4" />
								记录执行
							</button>
						{/if}
					</div>
				{/each}
			</div>
		{/if}
	{:else}
		{#if filteredExecutions.length === 0}
			<div class="card p-12 text-center">
				<Clock class="w-12 h-12 text-gray-300 mx-auto mb-4" />
				<p class="text-gray-500">暂无执行记录</p>
			</div>
		{:else}
			<div class="card overflow-hidden">
				<div class="overflow-x-auto">
					<table class="w-full">
						<thead>
							<tr class="border-b border-gray-100 bg-gray-50/50">
								<th class="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3.5">老人</th>
								<th class="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3.5">药品</th>
								<th class="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3.5">执行人</th>
								<th class="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3.5">执行时间</th>
								<th class="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3.5">状态</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-gray-100">
							{#each filteredExecutions as exec}
								<tr class="hover:bg-gray-50/50 transition-colors">
									<td class="px-5 py-4">
										<span class="text-sm font-medium text-gray-800">
											{getElderName(medications.find((m) => m.id === exec.medicationId)?.elderId ?? '')}
										</span>
									</td>
									<td class="px-5 py-4">
										<span class="text-sm text-gray-700">
											{medications.find((m) => m.id === exec.medicationId)?.name ?? '未知药品'}
										</span>
									</td>
									<td class="px-5 py-4">
										<span class="text-sm text-gray-700">{exec.executedBy}</span>
									</td>
									<td class="px-5 py-4">
										<span class="text-sm text-gray-600">{formatRelativeTime(exec.executedAt)}</span>
									</td>
									<td class="px-5 py-4">
										{#if exec.isAbnormal}
											<div class="flex items-center gap-1">
												<AlertCircle class="w-4 h-4 text-danger-500" />
												<span class="text-xs text-danger-600">异常</span>
											</div>
											{#if exec.abnormalNote}
												<p class="text-[11px] text-gray-500 mt-1">{exec.abnormalNote}</p>
											{/if}
										{:else}
											<div class="flex items-center gap-1">
												<CheckCircle2 class="w-4 h-4 text-green-500" />
												<span class="text-xs text-green-600">正常</span>
											</div>
										{/if}
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		{/if}
	{/if}
</div>

{#if showAddModal}
	<Modal title="新增用药记录" on:close={closeAddModal}>
		{#if modalError}
			<div class="mb-4 p-3 rounded-xl bg-danger-50 border border-danger-200 text-sm text-danger-700">
				{modalError}
			</div>
		{/if}

		<form on:submit|preventDefault={handleAddMedication} class="space-y-4">
			<div>
				<label class="label">老人 <span class="text-danger-500">*</span></label>
				<select bind:value={newMedElderId} class="input" disabled={submitting}>
					<option value="">请选择老人</option>
					{#each elders as e}
						<option value={e.id}>{e.name}</option>
					{/each}
				</select>
			</div>

			<div>
				<label class="label">药品名称 <span class="text-danger-500">*</span></label>
				<input
					type="text"
					bind:value={newMedName}
					placeholder="如：氨氯地平片"
					class="input"
					disabled={submitting}
				/>
			</div>

			<div class="grid grid-cols-2 gap-3">
				<div>
					<label class="label">剂量 <span class="text-danger-500">*</span></label>
					<input
						type="text"
						bind:value={newMedDosage}
						placeholder="如：5mg"
						class="input"
						disabled={submitting}
					/>
				</div>
				<div>
					<label class="label">频次 <span class="text-danger-500">*</span></label>
					<input
						type="text"
						bind:value={newMedFrequency}
						placeholder="如：每日一次"
						class="input"
						disabled={submitting}
					/>
				</div>
			</div>

			<div>
				<label class="label">给药方式 <span class="text-danger-500">*</span></label>
				<select bind:value={newMedRoute} class="input" disabled={submitting}>
					<option value="">请选择</option>
					<option value="口服">口服</option>
					<option value="静脉注射">静脉注射</option>
					<option value="肌肉注射">肌肉注射</option>
					<option value="外用">外用</option>
					<option value="吸入">吸入</option>
					<option value="舌下含服">舌下含服</option>
				</select>
			</div>

			<div class="grid grid-cols-2 gap-3">
				<div>
					<label class="label">开始日期 <span class="text-danger-500">*</span></label>
					<input
						type="date"
						bind:value={newMedStartDate}
						class="input"
						disabled={submitting}
					/>
				</div>
				<div>
					<label class="label">结束日期</label>
					<input
						type="date"
						bind:value={newMedEndDate}
						class="input"
						disabled={submitting}
					/>
				</div>
			</div>

			<div>
				<label class="label">开方医生</label>
				<input
					type="text"
					bind:value={newMedPrescribedBy}
					placeholder="如：陈医生"
					class="input"
					disabled={submitting}
				/>
			</div>

			<div>
				<label class="label">用药说明</label>
				<textarea
					bind:value={newMedNotes}
					placeholder="如：早餐后服用"
					rows={2}
					class="input resize-none"
					disabled={submitting}
				/>
			</div>

			<div class="flex items-center justify-end gap-3 pt-2">
				<button type="button" on:click={closeAddModal} class="btn-secondary" disabled={submitting}>
					取消
				</button>
				<button type="submit" class="btn-primary" disabled={submitting}>
					{#if submitting}
						<div class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
						<span>创建中...</span>
					{:else}
						<Save class="w-4 h-4" />
						<span>确认添加</span>
					{/if}
				</button>
			</div>
		</form>
	</Modal>
{/if}
