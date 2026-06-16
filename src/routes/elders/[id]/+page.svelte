<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import {
		ArrowLeft,
		User,
		Heart,
		MapPin,
		Calendar,
		Phone,
		FileText,
		ClipboardList,
		Pill,
		AlertTriangle,
		ChevronRight,
		Home,
		AlertCircle,
		CheckCircle2,
		Clock
	} from 'lucide-svelte';
	import { createTRPCProxyClient } from '$lib/trpc/client';
	import StatusBadge from '$lib/components/StatusBadge.svelte';
	import {
		calculateAge,
		formatDate,
		formatDateTime,
		formatGender,
		elderStatusMap,
		assessmentStatusMap,
		incidentStatusMap,
		formatRelativeTime
	} from '$lib/utils/format';
	import { cn } from '$lib/utils/cn';
	import type {
		Elder,
		Assessment,
		Medication,
		VisitRecord,
		Incident
	} from '$shared/types';

	const trpc = createTRPCProxyClient();

	type TabKey = 'health' | 'assessment' | 'medication' | 'visit' | 'incident';

	let loading = true;
	let elder: Elder | null = null;
	let assessments: Assessment[] = [];
	let medications: Medication[] = [];
	let visits: VisitRecord[] = [];
	let incidents: Incident[] = [];

	let activeTab: TabKey = 'health';

	const tabs: { key: TabKey; label: string; icon: typeof Heart }[] = [
		{ key: 'health', label: '健康档案', icon: Heart },
		{ key: 'assessment', label: '入住评估', icon: ClipboardList },
		{ key: 'medication', label: '用药清单', icon: Pill },
		{ key: 'visit', label: '探访记录', icon: Calendar },
		{ key: 'incident', label: '跌倒事件', icon: AlertTriangle }
	];

	function getElderAvatar(e: Elder) {
		return e.gender === 'female' ? 'bg-accent-100 text-accent-700' : 'bg-primary-100 text-primary-700';
	}

	async function loadAll() {
		loading = true;
		const id = $page.params.id;
		if (!id) return;
		try {
			const [e, a, m, v, i] = await Promise.all([
				trpc.elder.getById.query(id),
				trpc.assessment.list.query({ elderId: id, page: 1, pageSize: 20 }),
				trpc.medication.listByElder.query({ elderId: id, includeInactive: true }),
				trpc.visit.listByElder.query({ elderId: id, page: 1, pageSize: 20 }),
				trpc.incident.list.query({ elderId: id, page: 1, pageSize: 20 })
			]);
			elder = e;
			assessments = a.items;
			medications = m;
			visits = v.items;
			incidents = i.items;
		} catch (err) {
			console.error('Failed to load elder detail:', err);
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		loadAll();
	});
</script>

<div class="space-y-5">
	<div class="flex items-center gap-3">
		<button type="button" on:click={() => goto('/elders')} class="btn-ghost py-1.5 px-2">
			<ArrowLeft class="w-5 h-5" />
		</button>
		<div class="min-w-0 flex-1">
			<h1 class="text-xl font-bold text-gray-800 font-serif truncate">
				{loading ? '加载中...' : elder?.name || '老人详情'}
			</h1>
			{#if !loading && elder}
				<p class="text-sm text-gray-500 mt-0.5 truncate">
					{formatGender(elder.gender)} · {calculateAge(elder.birthDate)}岁 · {elder.roomNumber || '未分配房间'}
				</p>
			{/if}
		</div>
	</div>

	{#if loading}
		<div class="flex items-center justify-center py-20">
			<div class="flex flex-col items-center gap-3">
				<div class="w-8 h-8 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
				<p class="text-sm text-gray-500">加载中...</p>
			</div>
		</div>
	{:else if !elder}
		<div class="card p-12 text-center">
			<User class="w-12 h-12 text-gray-300 mx-auto mb-4" />
			<p class="text-gray-500">老人档案不存在</p>
			<button type="button" on:click={() => goto('/elders')} class="btn-primary mt-4">
				返回列表
			</button>
		</div>
	{:else}
		<div class="grid grid-cols-1 lg:grid-cols-3 gap-5">
			<div class="lg:col-span-1 space-y-5">
				<div class="card p-5">
					<div class="flex flex-col items-center text-center">
						<div class={cn('w-24 h-24 rounded-3xl flex items-center justify-center text-3xl font-bold mb-4', getElderAvatar(elder))}>
							{elder.name.charAt(0)}
						</div>
						<h2 class="text-xl font-bold text-gray-800 font-serif">{elder.name}</h2>
						<div class="mt-2">
							<StatusBadge
								variant={elderStatusMap[elder.status].variant}
								label={elderStatusMap[elder.status].label}
							/>
						</div>
						{#if elder.careLevel}
							<p class="mt-3 text-sm text-gray-600">
								<Heart class="w-4 h-4 inline mr-1 text-primary-500" />
								护理等级：{elder.careLevel.name}
							</p>
						{/if}
					</div>
				</div>

				<div class="card p-5">
					<h3 class="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
						<User class="w-4 h-4 text-primary-600" />
						基本信息
					</h3>
					<dl class="space-y-3 text-sm">
						<div class="flex justify-between">
							<dt class="text-gray-500">性别</dt>
							<dd class="text-gray-800 font-medium">{formatGender(elder.gender)}</dd>
						</div>
						<div class="flex justify-between">
							<dt class="text-gray-500">年龄</dt>
							<dd class="text-gray-800 font-medium">{calculateAge(elder.birthDate)}岁</dd>
						</div>
						<div class="flex justify-between">
							<dt class="text-gray-500">出生日期</dt>
							<dd class="text-gray-800 font-medium">{formatDate(elder.birthDate)}</dd>
						</div>
						<div class="flex justify-between">
							<dt class="text-gray-500">身份证号</dt>
							<dd class="text-gray-800 font-medium text-xs">{elder.idCard || '-'}</dd>
						</div>
						<div class="flex justify-between">
							<dt class="text-gray-500">房间号</dt>
							<dd class="text-gray-800 font-medium">{elder.roomNumber || '-'}</dd>
						</div>
						<div class="flex justify-between">
							<dt class="text-gray-500">入住日期</dt>
							<dd class="text-gray-800 font-medium">{formatDate(elder.admissionDate)}</dd>
						</div>
					</dl>
				</div>

				<div class="card p-5">
					<h3 class="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
						<Phone class="w-4 h-4 text-accent-600" />
						紧急联系人
					</h3>
					<dl class="space-y-3 text-sm">
						<div class="flex justify-between">
							<dt class="text-gray-500">姓名</dt>
							<dd class="text-gray-800 font-medium">{elder.emergencyContact.name || '-'}</dd>
						</div>
						<div class="flex justify-between">
							<dt class="text-gray-500">关系</dt>
							<dd class="text-gray-800 font-medium">{elder.emergencyContact.relation || '-'}</dd>
						</div>
						<div class="flex justify-between">
							<dt class="text-gray-500">电话</dt>
							<dd class="text-gray-800 font-medium">{elder.emergencyContact.phone || '-'}</dd>
						</div>
					</dl>
				</div>
			</div>

			<div class="lg:col-span-2">
				<div class="card">
					<div class="border-b border-gray-100 px-2 sm:px-5">
						<div class="flex gap-1 overflow-x-auto scrollbar-thin -mb-px">
							{#each tabs as tab}
								<button
									type="button"
									on:click={() => activeTab = tab.key}
									class={cn(
										'tab-btn whitespace-nowrap flex items-center gap-1.5',
										activeTab === tab.key && 'active'
									)}
								>
									<svelte:component this={tab.icon} class="w-4 h-4" />
									{tab.label}
								</button>
							{/each}
						</div>
					</div>

					<div class="p-5">
						{#if activeTab === 'health'}
							<div class="space-y-5">
								<div>
									<h3 class="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
										<AlertCircle class="w-4 h-4 text-danger-600" />
										过敏史
									</h3>
									{#if elder.allergies.length > 0}
										<div class="flex flex-wrap gap-2">
											{#each elder.allergies as allergy}
												<span class="inline-flex items-center px-3 py-1.5 rounded-xl text-sm bg-danger-50 text-danger-700 border border-danger-200">
													<AlertCircle class="w-3.5 h-3.5 mr-1.5" />
													{allergy}
												</span>
											{/each}
										</div>
									{:else}
										<p class="text-sm text-gray-500">暂无过敏记录</p>
									{/if}
								</div>

								<div>
									<h3 class="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
										<FileText class="w-4 h-4 text-primary-600" />
										既往病史
									</h3>
									{#if elder.medicalHistory.length > 0}
										<div class="flex flex-wrap gap-2">
											{#each elder.medicalHistory as history}
												<span class="inline-flex items-center px-3 py-1.5 rounded-xl text-sm bg-amber-50 text-amber-700 border border-amber-200">
													{history}
												</span>
											{/each}
										</div>
									{:else}
										<p class="text-sm text-gray-500">暂无病史记录</p>
									{/if}
								</div>

								<div>
									<h3 class="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
										<CheckCircle2 class="w-4 h-4 text-mint-600" />
										健康指标
									</h3>
									<div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
										<div class="p-4 rounded-xl bg-primary-50/50 border border-primary-100">
											<p class="text-xs text-gray-500 mb-1">血压</p>
											<p class="text-lg font-bold text-gray-800">128/82</p>
											<p class="text-[11px] text-mint-600">正常</p>
										</div>
										<div class="p-4 rounded-xl bg-accent-50/50 border border-accent-100">
											<p class="text-xs text-gray-500 mb-1">心率</p>
											<p class="text-lg font-bold text-gray-800">76</p>
											<p class="text-[11px] text-mint-600">正常</p>
										</div>
										<div class="p-4 rounded-xl bg-mint-50/50 border border-mint-100">
											<p class="text-xs text-gray-500 mb-1">体温</p>
											<p class="text-lg font-bold text-gray-800">36.5°C</p>
											<p class="text-[11px] text-mint-600">正常</p>
										</div>
										<div class="p-4 rounded-xl bg-amber-50/50 border border-amber-100">
											<p class="text-xs text-gray-500 mb-1">体重</p>
											<p class="text-lg font-bold text-gray-800">62kg</p>
											<p class="text-[11px] text-gray-500">BMI: 22.5</p>
										</div>
									</div>
								</div>
							</div>

						{:else if activeTab === 'assessment'}
							{#if assessments.length === 0}
								<div class="text-center py-12">
									<ClipboardList class="w-12 h-12 text-gray-300 mx-auto mb-3" />
									<p class="text-gray-500">暂无评估记录</p>
								</div>
							{:else}
								<div class="space-y-3">
									{#each assessments as assess}
										<div class="p-4 rounded-xl border border-gray-100 hover:border-primary-200 hover:bg-primary-50/30 transition-all cursor-pointer" on:click={() => goto(`/assessments/${assess.id}`)}>
											<div class="flex items-start justify-between gap-3">
												<div class="flex-1 min-w-0">
													<div class="flex items-center gap-2 flex-wrap">
														<p class="font-medium text-gray-800">入住评估</p>
														<StatusBadge
															variant={assessmentStatusMap[assess.status].variant}
															label={assessmentStatusMap[assess.status].label}
															showDot={false}
														/>
													</div>
													<p class="text-xs text-gray-500 mt-1">创建于 {formatDateTime(assess.createdAt)}</p>
												</div>
												<ChevronRight class="w-5 h-5 text-gray-400 flex-shrink-0 mt-1" />
											</div>
											{#if assess.totalScore > 0}
												<div class="mt-3 pt-3 border-t border-gray-100 grid grid-cols-4 gap-2 text-center">
													<div>
														<p class="text-[11px] text-gray-500">ADL</p>
														<p class="text-sm font-bold text-gray-800">{assess.adlScore}</p>
													</div>
													<div>
														<p class="text-[11px] text-gray-500">认知</p>
														<p class="text-sm font-bold text-gray-800">{assess.cognitionScore}</p>
													</div>
													<div>
														<p class="text-[11px] text-gray-500">情绪</p>
														<p class="text-sm font-bold text-gray-800">{assess.emotionScore}</p>
													</div>
													<div>
														<p class="text-[11px] text-gray-500">社会</p>
														<p class="text-sm font-bold text-gray-800">{assess.socialScore}</p>
													</div>
												</div>
												{#if assess.finalLevel}
													<div class="mt-3 flex items-center gap-2">
														<Heart class="w-4 h-4 text-primary-500" />
														<span class="text-sm text-gray-600">最终等级：<span class="font-medium text-gray-800">{assess.finalLevel.name}</span></span>
													</div>
												{:else if assess.suggestedLevel}
													<div class="mt-3 flex items-center gap-2">
														<Heart class="w-4 h-4 text-amber-500" />
														<span class="text-sm text-gray-600">建议等级：<span class="font-medium text-gray-800">{assess.suggestedLevel.name}</span></span>
													</div>
												{/if}
											{/if}
										</div>
									{/each}
								</div>
							{/if}

						{:else if activeTab === 'medication'}
							{#if medications.length === 0}
								<div class="text-center py-12">
									<Pill class="w-12 h-12 text-gray-300 mx-auto mb-3" />
									<p class="text-gray-500">暂无用药记录</p>
								</div>
							{:else}
								<div class="space-y-3">
									{#each medications as med}
										<div class={cn('p-4 rounded-xl border transition-all', med.isActive ? 'border-gray-100 hover:border-mint-200 hover:bg-mint-50/30' : 'border-gray-100 bg-gray-50/50 opacity-70')}>
											<div class="flex items-start justify-between gap-3">
												<div class="flex-1 min-w-0">
													<div class="flex items-center gap-2 flex-wrap">
														<p class="font-medium text-gray-800">{med.name}</p>
														{#if med.isActive}
															<StatusBadge variant="success" label="使用中" showDot={false} />
														{:else}
															<StatusBadge variant="muted" label="已停用" showDot={false} />
														{/if}
													</div>
													<p class="text-sm text-gray-600 mt-1">
														{med.dosage} · {med.frequency} · {med.route}
													</p>
												</div>
											</div>
											<div class="mt-3 grid grid-cols-2 gap-3 text-sm">
												<div>
													<p class="text-xs text-gray-500">开始日期</p>
													<p class="text-gray-800">{formatDate(med.startDate)}</p>
												</div>
												<div>
													<p class="text-xs text-gray-500">结束日期</p>
													<p class="text-gray-800">{med.endDate ? formatDate(med.endDate) : '长期'}</p>
												</div>
												{#if med.prescribedBy}
													<div>
														<p class="text-xs text-gray-500">开方医生</p>
														<p class="text-gray-800">{med.prescribedBy}</p>
													</div>
												{/if}
											</div>
											{#if med.notes}
												<div class="mt-3 pt-3 border-t border-gray-100">
													<p class="text-xs text-gray-500 mb-1">备注</p>
													<p class="text-sm text-gray-700">{med.notes}</p>
												</div>
											{/if}
										</div>
									{/each}
								</div>
							{/if}

						{:else if activeTab === 'visit'}
							{#if visits.length === 0}
								<div class="text-center py-12">
									<Calendar class="w-12 h-12 text-gray-300 mx-auto mb-3" />
									<p class="text-gray-500">暂无探访记录</p>
								</div>
							{:else}
								<div class="relative">
									<div class="absolute left-[11px] top-2 bottom-2 w-0.5 bg-gray-200" />
									<div class="space-y-5">
										{#each visits as visit}
											<div class="relative pl-8">
												<div class="absolute left-0 top-1 w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center ring-4 ring-white">
													<Calendar class="w-3 h-3 text-white" />
												</div>
												<div class="p-4 rounded-xl border border-gray-100 bg-white hover:border-amber-200 hover:bg-amber-50/30 transition-all">
													<div class="flex items-start justify-between gap-3">
														<div class="flex-1 min-w-0">
															<p class="font-medium text-gray-800">{visit.visitorName}</p>
															<p class="text-xs text-gray-500 mt-0.5">
																{visit.relation || '家属'} · {visit.visitorPhone || '-'}
															</p>
														</div>
														<span class="text-xs text-gray-400 whitespace-nowrap">{formatRelativeTime(visit.visitTime)}</span>
													</div>
													<div class="mt-3 grid grid-cols-2 gap-3 text-sm">
														<div>
															<p class="text-xs text-gray-500">探访时间</p>
															<p class="text-gray-800">{formatDateTime(visit.visitTime)}</p>
														</div>
														<div>
															<p class="text-xs text-gray-500">离开时间</p>
															<p class="text-gray-800">{visit.leaveTime ? formatDateTime(visit.leaveTime) : '探访中'}</p>
														</div>
													</div>
													{#if visit.notes}
														<div class="mt-3 pt-3 border-t border-gray-100">
															<p class="text-xs text-gray-500 mb-1">备注</p>
															<p class="text-sm text-gray-700">{visit.notes}</p>
														</div>
													{/if}
													<p class="text-[11px] text-gray-400 mt-2">登记人：{visit.recordedBy}</p>
												</div>
											</div>
										{/each}
									</div>
								</div>
							{/if}

						{:else if activeTab === 'incident'}
							{#if incidents.length === 0}
								<div class="text-center py-12">
									<AlertTriangle class="w-12 h-12 text-gray-300 mx-auto mb-3" />
									<p class="text-gray-500">暂无跌倒事件记录</p>
								</div>
							{:else}
								<div class="space-y-3">
									{#each incidents as incident}
										<div
											class="p-4 rounded-xl border hover:shadow-soft transition-all cursor-pointer {incident.status === 'closed' ? 'border-gray-100 bg-gray-50/50' : 'border-danger-200 bg-danger-50/30'}"
											on:click={() => goto(`/incidents/${incident.id}`)}
										>
											<div class="flex items-start justify-between gap-3">
												<div class="flex items-start gap-3 flex-1 min-w-0">
													<div class={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', incident.status === 'closed' ? 'bg-gray-100 text-gray-500' : 'bg-danger-100 text-danger-600')}>
														<AlertTriangle class="w-5 h-5" />
													</div>
													<div class="flex-1 min-w-0">
														<div class="flex items-center gap-2 flex-wrap">
															<p class="font-medium text-gray-800">{incident.type === 'fall' ? '跌倒事件' : '其他事件'}</p>
															<StatusBadge
																variant={incidentStatusMap[incident.status].variant}
																label={incidentStatusMap[incident.status].label}
																showDot={false}
															/>
														</div>
														<p class="text-xs text-gray-500 mt-0.5">
															<MapPin class="w-3 h-3 inline mr-1" />
															{incident.location || '未记录地点'}
														</p>
													</div>
												</div>
												<ChevronRight class="w-5 h-5 text-gray-400 flex-shrink-0 mt-1" />
											</div>
											{#if incident.description}
												<p class="text-sm text-gray-600 mt-3 pt-3 border-t border-gray-100/80">{incident.description}</p>
											{/if}
											<div class="mt-3 flex items-center justify-between text-xs text-gray-500">
												<span>上报人：{incident.reportedBy}</span>
												<span>{formatRelativeTime(incident.reportedAt)}</span>
											</div>
										</div>
									{/each}
								</div>
							{/if}
						{/if}
					</div>
				</div>
			</div>
		</div>
	{/if}
</div>
