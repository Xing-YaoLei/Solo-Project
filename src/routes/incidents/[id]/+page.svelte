<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import {
		ArrowLeft,
		MapPin,
		Clock,
		User,
		Users,
		AlertTriangle,
		CheckCircle2,
		Circle,
		Edit3,
		Save,
		Plus,
		X,
		Paperclip,
		MessageSquare,
		Upload,
		Download,
		Archive,
		Stethoscope,
		Heart,
		UserCheck,
		Eye,
		ShieldAlert
	} from 'lucide-svelte';
	import { cn } from '$lib/utils/cn';
	import {
		formatDateTime,
		incidentStatusMap,
		formatRelativeTime
	} from '$lib/utils/format';
	import StatusBadge from '$lib/components/StatusBadge.svelte';
	import type { Incident, IncidentParty, PartyRoleType, FlowAttachment, FlowRemark, FlowHandler } from '$shared/types';
	import { createTRPCProxyClient } from '$lib/trpc/client';
	import { hasRole, roleLabelMap } from '$lib/stores/auth';

	const trpc = createTRPCProxyClient();
	const isSupervisorOrAdmin = hasRole(['admin', 'supervisor']);

	$: incidentId = $page.params.id;

	let incident: Incident | null = null;
	let loading = true;
	let error = '';
	let selectedPartyId: string | null = null;
	let supplementText = '';
	let savingSupplement = false;

	let showAddWitness = false;
	let witnessName = '';
	let addingWitness = false;

	let showCloseModal = false;
	let summaryText = '';
	let correctiveActions: string[] = [''];
	let closing = false;

	let attachments: FlowAttachment[] = [];
	let remarks: FlowRemark[] = [];
	let handlers: FlowHandler[] = [];
	let newRemark = '';
	let submittingRemark = false;

	const roleConfig: Record<string, { label: string; icon: typeof User; color: string }> = {
		elder: { label: '老人', icon: Heart, color: 'bg-rose-50 text-rose-700 border-rose-200' },
		nurse: { label: '护理员', icon: User, color: 'bg-primary-50 text-primary-700 border-primary-200' },
		supervisor: { label: '护理主管', icon: UserCheck, color: 'bg-amber-50 text-amber-700 border-amber-200' },
		witness: { label: '在场人员', icon: Eye, color: 'bg-accent-50 text-accent-700 border-accent-200' },
		doctor: { label: '驻院医生', icon: Stethoscope, color: 'bg-mint-50 text-mint-700 border-mint-200' }
	};

	$: groupedParties = (() => {
		const groups: Record<string, IncidentParty[]> = {};
		if (!incident?.parties) return groups;
		for (const party of incident.parties) {
			if (!groups[party.roleType]) groups[party.roleType] = [];
			groups[party.roleType].push(party);
		}
		return groups;
	})();

	$: partiesById = (() => {
		const map: Record<string, IncidentParty> = {};
		if (incident?.parties) {
			for (const p of incident.parties) {
				map[p.id] = p;
			}
		}
		return map;
	})();

	$: selectedParty = (() => {
		if (!selectedPartyId) return null;
		return partiesById[selectedPartyId] ?? null;
	})();

	$: allSupplemented = (() => {
		if (!incident?.parties || incident.parties.length === 0) return false;
		return incident.parties.every((p) => p.description !== null);
	})();

	$: canConfirmResponsibility = (() =>
		$isSupervisorOrAdmin && incident?.status === 'supplementing' && allSupplemented
	)();

	$: canClose = (() =>
		$isSupervisorOrAdmin && incident?.status === 'confirming'
	)();

	async function loadIncident() {
		if (!incidentId) return;
		loading = true;
		error = '';
		try {
			const [incidentData, attachmentsData, remarksData, handlersData] = await Promise.all([
				trpc.incident.getById.query(incidentId),
				trpc.flow.listAttachments.query({ entityType: 'incident', entityId: incidentId }),
				trpc.flow.listRemarks.query({ entityType: 'incident', entityId: incidentId }),
				trpc.flow.listHandlers.query({ entityType: 'incident', entityId: incidentId })
			]);
			incident = incidentData;
			attachments = attachmentsData;
			remarks = remarksData;
			handlers = handlersData;
			if (incident?.parties?.length && !selectedPartyId) {
				selectedPartyId = incident.parties[0].id;
				supplementText = incident.parties[0].description ?? '';
			}
		} catch (e) {
			error = e instanceof Error ? e.message : '加载失败';
		} finally {
			loading = false;
		}
	}

	function selectParty(partyId: string) {
		selectedPartyId = partyId;
		const party = partiesById[partyId];
		supplementText = party?.description ?? '';
	}

	async function handleSaveSupplement() {
		if (!selectedPartyId || !supplementText.trim()) return;
		savingSupplement = true;
		try {
			await trpc.incident.supplementParty.mutate({
				partyId: selectedPartyId,
				description: supplementText.trim()
			});
			await loadIncident();
		} catch (e) {
			console.error(e);
		} finally {
			savingSupplement = false;
		}
	}

	async function handleToggleResponsibility(party: IncidentParty, isResponsible: boolean, type?: 'direct' | 'indirect') {
		if (!$isSupervisorOrAdmin || !incident) return;
		try {
			const responsibilities = [
				{
					partyId: party.id,
					isResponsible,
					responsibilityType: isResponsible ? (type ?? (party.responsibilityType || 'indirect')) : undefined
				}
			];
			await trpc.incident.confirmResponsibility.mutate({
				incidentId: incident.id,
				responsibilities
			});
			await loadIncident();
		} catch (e) {
			console.error(e);
		}
	}

	async function handleSetResponsibilityType(party: IncidentParty, type: 'direct' | 'indirect') {
		if (!$isSupervisorOrAdmin || !incident) return;
		try {
			await trpc.incident.confirmResponsibility.mutate({
				incidentId: incident.id,
				responsibilities: [{ partyId: party.id, isResponsible: true, responsibilityType: type }]
			});
			await loadIncident();
		} catch (e) {
			console.error(e);
		}
	}

	function openAddWitness() {
		showAddWitness = true;
		witnessName = '';
	}

	function closeAddWitness() {
		showAddWitness = false;
	}

	async function handleAddWitness() {
		if (!witnessName.trim() || !incident) return;
		addingWitness = true;
		try {
			await trpc.incident.addWitness.mutate({
				incidentId: incident.id,
				personName: witnessName.trim()
			});
			closeAddWitness();
			await loadIncident();
		} catch (e) {
			console.error(e);
		} finally {
			addingWitness = false;
		}
	}

	function openCloseModal() {
		showCloseModal = true;
		summaryText = incident?.summary ?? '';
		correctiveActions = incident?.correctiveActions?.length ? [...incident.correctiveActions] : [''];
	}

	function closeCloseModal() {
		showCloseModal = false;
	}

	function addCorrectiveAction() {
		correctiveActions = [...correctiveActions, ''];
	}

	function removeCorrectiveAction(index: number) {
		correctiveActions = correctiveActions.filter((_, i) => i !== index);
		if (correctiveActions.length === 0) {
			correctiveActions = [''];
		}
	}

	async function handleCloseIncident() {
		if (!summaryText.trim() || !incident) return;
		closing = true;
		try {
			await trpc.incident.close.mutate({
				incidentId: incident.id,
				summary: summaryText.trim(),
				correctiveActions: correctiveActions.filter((a) => a.trim())
			});
			closeCloseModal();
			await loadIncident();
		} catch (e) {
			console.error(e);
		} finally {
			closing = false;
		}
	}

	async function handleSubmitRemark() {
		if (!newRemark.trim() || !incidentId) return;
		submittingRemark = true;
		try {
			const added = await trpc.flow.addRemark.mutate({
				entityType: 'incident',
				entityId: incidentId,
				content: newRemark.trim()
			});
			remarks = [added, ...remarks];
			newRemark = '';
		} catch (e) {
			console.error(e);
		} finally {
			submittingRemark = false;
		}
	}

	function handleFileUpload() {
		alert('文件上传功能演示');
	}

	onMount(() => {
		loadIncident();
	});
</script>

<div class="space-y-6">
	<div class="flex items-center gap-3">
		<button type="button" on:click={() => goto('/incidents')} class="btn-ghost -ml-2">
			<ArrowLeft class="w-5 h-5" />
			<span class="hidden sm:inline">返回列表</span>
		</button>
	</div>

	{#if loading}
		<div class="card p-12 flex flex-col items-center justify-center text-gray-400">
			<div class="w-8 h-8 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin mb-3" />
			<p class="text-sm">加载中...</p>
		</div>
	{:else if error || !incident}
		<div class="card p-12 flex flex-col items-center justify-center text-danger-500">
			<AlertTriangle class="w-12 h-12 mb-3 opacity-50" />
			<p class="text-sm">{error || '事件不存在'}</p>
			<button type="button" on:click={() => goto('/incidents')} class="btn-primary mt-4">
				返回列表
			</button>
		</div>
	{:else}
		<div class="card p-6 overflow-hidden relative">
			<div class={cn(
				'absolute top-0 left-0 right-0 h-1',
				incident.status === 'closed'
					? 'bg-green-500'
					: incident.status === 'confirming'
						? 'bg-amber-500'
						: incident.status === 'supplementing'
							? 'bg-accent-500'
							: 'bg-danger-500'
			)} />
			<div class="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
				<div class="flex items-start gap-4">
					<div class="w-14 h-14 rounded-2xl bg-danger-50 flex items-center justify-center flex-shrink-0">
						<AlertTriangle class="w-7 h-7 text-danger-600" />
					</div>
					<div>
						<div class="flex items-center gap-3 flex-wrap mb-2">
							<h1 class="text-xl font-serif font-bold text-gray-800">
								{incident.elder?.name ?? '未知老人'} · 跌倒事件
							</h1>
							<StatusBadge variant={incidentStatusMap[incident.status].variant}>
								{incidentStatusMap[incident.status].label}
							</StatusBadge>
						</div>
						<div class="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-500">
							<span class="flex items-center gap-1.5">
								<MapPin class="w-4 h-4" />
								{incident.location || '未记录地点'}
							</span>
							<span class="flex items-center gap-1.5">
								<Clock class="w-4 h-4" />
								{formatDateTime(incident.reportedAt)}
							</span>
							<span class="flex items-center gap-1.5">
								<User class="w-4 h-4" />
								上报人: {incident.reportedBy}
							</span>
						</div>
						{#if incident.description}
							<p class="text-sm text-gray-600 mt-3 max-w-2xl">{incident.description}</p>
						{/if}
					</div>
				</div>
				<div class="flex items-center gap-2">
					{#if canClose}
						<button type="button" on:click={openCloseModal} class="btn-primary">
							<Archive class="w-4 h-4" />
							<span>关闭归档</span>
						</button>
					{/if}
				</div>
			</div>

			{#if incident.status === 'closed'}
				<div class="mt-6 p-4 rounded-xl bg-green-50 border border-green-200">
					<div class="flex items-center gap-2 mb-2">
						<CheckCircle2 class="w-5 h-5 text-green-600" />
						<span class="font-medium text-green-800">事件已归档</span>
						<span class="text-xs text-green-600">{formatDateTime(incident.closedAt)}</span>
					</div>
					{#if incident.summary}
						<p class="text-sm text-green-700 mb-2"><strong>总结：</strong>{incident.summary}</p>
					{/if}
					{#if incident.correctiveActions?.length}
						<div class="mt-2">
							<p class="text-sm font-medium text-green-800 mb-1">整改措施：</p>
							<ul class="list-disc list-inside text-sm text-green-700 space-y-0.5">
								{#each incident.correctiveActions as action}
									<li>{action}</li>
								{/each}
							</ul>
						</div>
					{/if}
				</div>
			{/if}
		</div>

		<div class="grid gap-6 lg:grid-cols-5">
			<div class="lg:col-span-3 space-y-6">
				<div class="card p-6">
					<div class="flex items-center justify-between mb-4">
						<h2 class="text-lg font-semibold text-gray-800 flex items-center gap-2">
							<Users class="w-5 h-5 text-primary-600" />
							影响对象清单
						</h2>
						{#if incident.status !== 'closed'}
							<button type="button" on:click={openAddWitness} class="btn-secondary text-sm py-1.5 px-3">
								<Plus class="w-4 h-4" />
								<span>添加在场人员</span>
							</button>
						{/if}
					</div>

					<div class="space-y-5">
						{#each Object.keys(roleConfig) as roleType}
							{@const parties = groupedParties[roleType]}
							{#if parties && parties.length > 0}
								{@const roleConf = roleConfig[roleType]}
								<div>
									<div class="flex items-center gap-2 mb-2">
										<svelte:component this={roleConf.icon} class="w-4 h-4 text-gray-500" />
										<span class="text-sm font-medium text-gray-700">
											{roleConf.label}
										</span>
										<span class="text-xs text-gray-400">({parties.length}人)</span>
									</div>
									<div class="grid gap-2 sm:grid-cols-2">
										{#each parties as party}
											<button
												type="button"
												on:click={() => selectParty(party.id)}
												class={cn(
													'p-3 rounded-xl border text-left transition-all',
													selectedPartyId === party.id
														? 'border-primary-500 bg-primary-50 ring-2 ring-primary-500/20'
														: party.description
															? 'border-green-200 bg-green-50/50 hover:bg-green-50'
															: 'border-gray-200 bg-white hover:border-primary-300 hover:bg-primary-50/50'
												)}
											>
												<div class="flex items-center justify-between gap-2 mb-1">
													<span class="font-medium text-gray-800 text-sm">{party.personName}</span>
													{#if party.description}
														<CheckCircle2 class="w-4 h-4 text-green-500 flex-shrink-0" />
													{:else}
														<Circle class="w-4 h-4 text-gray-300 flex-shrink-0" />
													{/if}
												</div>
												<div class="flex items-center gap-2 flex-wrap">
													<span class={cn(
														'text-xs px-2 py-0.5 rounded-full border',
														roleConfig[party.roleType].color
													)}>
														{roleConfig[party.roleType].label}
													</span>
													{#if party.isResponsible}
														<span class={cn(
															'text-xs px-2 py-0.5 rounded-full border',
															party.responsibilityType === 'direct'
																? 'bg-red-50 text-red-700 border-red-200'
																: 'bg-orange-50 text-orange-700 border-orange-200'
														)}>
															{party.responsibilityType === 'direct' ? '直接责任人' : '间接责任人'}
														</span>
													{/if}
												</div>
												{#if party.description}
													<p class="text-xs text-gray-500 mt-2 line-clamp-2">{party.description}</p>
												{:else}
													<p class="text-xs text-amber-600 mt-2">待补充说明</p>
												{/if}
											</button>
										{/each}
									</div>
								</div>
							{/if}
						{/each}
					</div>
				</div>

				{#if selectedParty}
					<div class="card p-6">
						<div class="flex items-center justify-between mb-4">
							<h2 class="text-lg font-semibold text-gray-800 flex items-center gap-2">
								<Edit3 class="w-5 h-5 text-primary-600" />
								补充说明
								<span class="text-sm font-normal text-gray-500">— {selectedParty.personName}</span>
							</h2>
							<span class={cn(
								'text-xs px-2.5 py-1 rounded-full border',
								roleConfig[selectedParty.roleType].color
							)}>
								{roleConfig[selectedParty.roleType].label}
							</span>
						</div>

						{#if incident.status === 'closed'}
							<div class="p-4 rounded-xl bg-gray-50 border border-gray-200">
								<p class="text-sm text-gray-700 whitespace-pre-wrap">
									{selectedParty.description || '（无补充说明）'}
								</p>
								{#if selectedParty.supplementAt}
									<p class="text-xs text-gray-400 mt-2">补充于 {formatDateTime(selectedParty.supplementAt)}</p>
								{/if}
							</div>
						{:else}
							<textarea
								bind:value={supplementText}
								placeholder="请输入此角色的补充说明内容，描述事件经过、所见所闻、采取的措施等..."
								rows={6}
								class="input resize-none mb-3"
								disabled={savingSupplement}
							/>
							<div class="flex items-center justify-between">
								{#if selectedParty.supplementAt}
									<span class="text-xs text-gray-400">
										上次更新: {formatDateTime(selectedParty.supplementAt)}
									</span>
								{:else}
									<span class="text-xs text-amber-600">尚未提交补充说明</span>
								{/if}
								<button type="button" on:click={handleSaveSupplement} class="btn-primary" disabled={savingSupplement || !supplementText.trim()}>
									{#if savingSupplement}
										<div class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
										<span>保存中...</span>
									{:else}
										<Save class="w-4 h-4" />
										<span>保存补充</span>
									{/if}
								</button>
							</div>
						{/if}
					</div>
				{/if}

				<div class="card p-6">
					<div class="flex items-center justify-between mb-4">
						<h2 class="text-lg font-semibold text-gray-800 flex items-center gap-2">
							<ShieldAlert class="w-5 h-5 text-primary-600" />
							责任确认
						</h2>
						{#if !$isSupervisorOrAdmin && incident.status !== 'closed'}
							<span class="text-xs text-gray-400">仅护理主管/管理员可确认</span>
						{/if}
					</div>

					{#if !incident.parties || incident.parties.length === 0}
						<p class="text-sm text-gray-400 py-4 text-center">暂无影响对象</p>
					{:else}
						<div class="space-y-2">
							{#each incident.parties as party}
								<div class={cn(
									'p-4 rounded-xl border transition-all',
									party.isResponsible
										? party.responsibilityType === 'direct'
											? 'border-red-200 bg-red-50/50'
											: 'border-orange-200 bg-orange-50/50'
										: 'border-gray-200 bg-white'
								)}>
									<div class="flex flex-col sm:flex-row sm:items-center gap-3">
										<div class="flex items-center gap-3 flex-1">
											<div class="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
												<span class="text-sm font-medium text-gray-600">{party.personName.charAt(0)}</span>
											</div>
											<div>
												<p class="font-medium text-sm text-gray-800">{party.personName}</p>
												<p class="text-xs text-gray-500">{roleConfig[party.roleType].label}</p>
											</div>
										</div>

										{#if incident.status === 'closed'}
											{#if party.isResponsible}
												<span class={cn(
													'text-xs px-3 py-1 rounded-full border font-medium',
													party.responsibilityType === 'direct'
														? 'bg-red-100 text-red-700 border-red-200'
														: 'bg-orange-100 text-orange-700 border-orange-200'
												)}>
													{party.responsibilityType === 'direct' ? '直接责任人' : '间接责任人'}
												</span>
											{:else}
												<span class="text-xs text-gray-400">无责任</span>
											{/if}
										{:else if $isSupervisorOrAdmin && allSupplemented}
											<div class="flex items-center gap-2 flex-wrap">
												<button
													type="button"
													on:click={() => handleToggleResponsibility(party, false)}
													class={cn(
														'px-3 py-1.5 text-xs rounded-lg border transition-all',
														!party.isResponsible
															? 'bg-gray-100 text-gray-700 border-gray-300'
															: 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
													)}
												>
													无责任
												</button>
												<button
													type="button"
													on:click={() => handleToggleResponsibility(party, true, 'indirect')}
													class={cn(
														'px-3 py-1.5 text-xs rounded-lg border transition-all',
														party.isResponsible && party.responsibilityType !== 'direct'
															? 'bg-orange-100 text-orange-700 border-orange-300'
															: 'bg-white text-gray-500 border-gray-200 hover:bg-orange-50 hover:text-orange-600'
													)}
												>
													间接责任
												</button>
												<button
													type="button"
													on:click={() => handleToggleResponsibility(party, true, 'direct')}
													class={cn(
														'px-3 py-1.5 text-xs rounded-lg border transition-all',
														party.responsibilityType === 'direct'
															? 'bg-red-100 text-red-700 border-red-300'
															: 'bg-white text-gray-500 border-gray-200 hover:bg-red-50 hover:text-red-600'
													)}
												>
													直接责任
												</button>
											</div>
										{:else}
											{#if party.isResponsible}
												<span class={cn(
													'text-xs px-3 py-1 rounded-full border',
													party.responsibilityType === 'direct'
														? 'bg-red-50 text-red-600 border-red-200'
														: 'bg-orange-50 text-orange-600 border-orange-200'
												)}>
													{party.responsibilityType === 'direct' ? '直接责任人' : '间接责任人'}
												</span>
											{:else}
												<span class="text-xs text-gray-400">待确认</span>
											{/if}
										{/if}
									</div>
								</div>
							{/each}
						</div>

						{#if !allSupplemented && incident.status !== 'closed'}
							<div class="mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200">
								<p class="text-xs text-amber-700">
									⚠️ 所有对象补充说明完成后，方可进行责任确认
								</p>
							</div>
						{/if}
					{/if}
				</div>
			</div>

			<div class="lg:col-span-2 space-y-6">
				<div class="card p-6">
					<div class="flex items-center justify-between mb-4">
						<h2 class="text-lg font-semibold text-gray-800 flex items-center gap-2">
							<Paperclip class="w-5 h-5 text-primary-600" />
							附件
						</h2>
						{#if incident.status !== 'closed'}
							<button type="button" on:click={handleFileUpload} class="btn-secondary text-sm py-1.5 px-3">
								<Upload class="w-4 h-4" />
								<span>上传</span>
							</button>
						{/if}
					</div>

					{#if attachments.length === 0}
						<div class="py-6 text-center">
							<Paperclip class="w-10 h-10 text-gray-300 mx-auto mb-2" />
							<p class="text-sm text-gray-400">暂无附件</p>
						</div>
					{:else}
						<div class="space-y-2">
							{#each attachments as att}
								<div class="flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors">
									<div class="w-9 h-9 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
										<Paperclip class="w-4 h-4 text-primary-600" />
									</div>
									<div class="flex-1 min-w-0">
										<p class="text-sm font-medium text-gray-700 truncate">{att.fileName}</p>
										<p class="text-xs text-gray-400">{att.uploadedBy} · {formatDateTime(att.uploadedAt)}</p>
									</div>
									<button type="button" class="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-primary-600">
										<Download class="w-4 h-4" />
									</button>
								</div>
							{/each}
						</div>
					{/if}
				</div>

				<div class="card p-6">
					<h2 class="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-4">
						<MessageSquare class="w-5 h-5 text-primary-600" />
						备注
					</h2>

					{#if incident.status !== 'closed'}
						<div class="mb-4">
							<textarea
								bind:value={newRemark}
								placeholder="添加备注..."
								rows={2}
								class="input resize-none text-sm"
								disabled={submittingRemark}
							/>
							<div class="flex justify-end mt-2">
								<button
									type="button"
									on:click={handleSubmitRemark}
									class="btn-primary text-sm py-1.5 px-3"
									disabled={!newRemark.trim() || submittingRemark}
								>
									提交
								</button>
							</div>
						</div>
					{/if}

					<div class="space-y-3">
						{#if remarks.length === 0}
							<p class="text-sm text-gray-400 text-center py-4">暂无备注</p>
						{:else}
							{#each remarks as remark}
								<div class="p-3 rounded-xl bg-gray-50 border border-gray-100">
									<div class="flex items-center justify-between gap-2 mb-1">
										<span class="text-sm font-medium text-gray-700">{remark.createdBy}</span>
										<span class="text-xs text-gray-400">{formatRelativeTime(remark.createdAt)}</span>
									</div>
									<p class="text-sm text-gray-600 whitespace-pre-wrap">{remark.content}</p>
								</div>
							{/each}
						{/if}
					</div>
				</div>

				<div class="card p-6">
					<h2 class="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-4">
						<Clock class="w-5 h-5 text-primary-600" />
						流程经办人
					</h2>

					<div class="relative pl-6">
						<div class="absolute left-[7px] top-1 bottom-1 w-px bg-gray-200" />
						{#each handlers as handler, idx}
							<div class="relative pb-5 last:pb-0">
								<div class={cn(
									'absolute -left-6 top-1 w-3.5 h-3.5 rounded-full border-2',
									handler.handledAt
										? 'bg-primary-500 border-primary-200'
										: 'bg-white border-gray-300'
								)} />
								<div>
									<p class="text-sm font-medium text-gray-800">{handler.stepName}</p>
									<p class="text-xs text-gray-500 mt-0.5">
										{handler.userName} · {handler.action}
									</p>
									{#if handler.handledAt}
										<p class="text-xs text-gray-400 mt-0.5">{formatDateTime(handler.handledAt)}</p>
									{/if}
								</div>
							</div>
						{/each}
					</div>
				</div>
			</div>
		</div>
	{/if}
</div>

{#if showAddWitness}
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" on:click={closeAddWitness}>
		<div class="card w-full max-w-md p-6" on:click={(e) => e.stopPropagation()}>
			<div class="flex items-center justify-between mb-4">
				<h3 class="text-lg font-semibold text-gray-800">添加在场人员</h3>
				<button type="button" on:click={closeAddWitness} class="p-1 rounded-lg hover:bg-gray-100 text-gray-400">
					<X class="w-5 h-5" />
				</button>
			</div>
			<form on:submit|preventDefault={handleAddWitness}>
				<label class="label">姓名</label>
				<input
					type="text"
					bind:value={witnessName}
					placeholder="请输入在场人员姓名"
					class="input mb-4"
					disabled={addingWitness}
					autofocus
				/>
				<div class="flex justify-end gap-2">
					<button type="button" on:click={closeAddWitness} class="btn-secondary" disabled={addingWitness}>取消</button>
					<button type="submit" class="btn-primary" disabled={addingWitness || !witnessName.trim()}>
						{#if addingWitness}
							<div class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
						{:else}
							确认添加
						{/if}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

{#if showCloseModal}
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" on:click={closeCloseModal}>
		<div class="card w-full max-w-xl p-6 max-h-[90vh] overflow-y-auto" on:click={(e) => e.stopPropagation()}>
			<div class="flex items-center justify-between mb-6">
				<div class="flex items-center gap-3">
					<div class="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
						<Archive class="w-5 h-5 text-green-600" />
					</div>
					<div>
						<h3 class="text-lg font-semibold text-gray-800">关闭归档</h3>
						<p class="text-sm text-gray-500">填写事件总结与整改措施</p>
					</div>
				</div>
				<button type="button" on:click={closeCloseModal} class="p-1 rounded-lg hover:bg-gray-100 text-gray-400">
					<X class="w-5 h-5" />
				</button>
			</div>

			<form on:submit|preventDefault={handleCloseIncident} class="space-y-5">
				<div>
					<label class="label">事件总结 <span class="text-danger-500">*</span></label>
					<textarea
						bind:value={summaryText}
						placeholder="请简要总结事件经过、原因分析及处置结果..."
						rows={4}
						class="input resize-none"
						disabled={closing}
					/>
				</div>

				<div>
					<div class="flex items-center justify-between mb-2">
						<label class="label !mb-0">整改措施</label>
						<button type="button" on:click={addCorrectiveAction} class="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1">
							<Plus class="w-3.5 h-3.5" />
							添加
						</button>
					</div>
					<div class="space-y-2">
						{#each correctiveActions as action, i}
							<div class="flex items-center gap-2">
								<span class="text-xs text-gray-400 w-5">{i + 1}.</span>
								<input
									type="text"
									bind:value={correctiveActions[i]}
									placeholder="请输入整改措施..."
									class="input flex-1"
									disabled={closing}
								/>
								{#if correctiveActions.length > 1}
									<button
										type="button"
										on:click={() => removeCorrectiveAction(i)}
										class="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-danger-500"
										disabled={closing}
									>
										<X class="w-4 h-4" />
									</button>
								{/if}
							</div>
						{/each}
					</div>
				</div>

				<div class="flex justify-end gap-3 pt-2">
					<button type="button" on:click={closeCloseModal} class="btn-secondary" disabled={closing}>取消</button>
					<button type="submit" class="btn-primary" disabled={closing || !summaryText.trim()}>
						{#if closing}
							<div class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
							<span>归档中...</span>
						{:else}
							<Archive class="w-4 h-4" />
							<span>确认归档</span>
						{/if}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}
