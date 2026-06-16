<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import {
		Search,
		Plus,
		Filter,
		LayoutGrid,
		List,
		ChevronRight,
		User,
		Heart,
		MapPin,
		Calendar
	} from 'lucide-svelte';
	import { createTRPCProxyClient } from '$lib/trpc/client';
	import StatusBadge from '$lib/components/StatusBadge.svelte';
	import {
		calculateAge,
		formatDate,
		formatGender,
		elderStatusMap
	} from '$lib/utils/format';
	import { cn } from '$lib/utils/cn';
	import type { Elder, CareLevel, ElderStatus } from '$shared/types';

	const trpc = createTRPCProxyClient();

	let loading = true;
	let elders: Elder[] = [];
	let careLevels: CareLevel[] = [];
	let total = 0;

	let search = '';
	let selectedGender: '' | 'male' | 'female' = '';
	let selectedStatus: '' | ElderStatus = '';
	let selectedCareLevelId = '';
	let viewMode: 'list' | 'card' = 'card';
	let showFilters = false;

	$: filterParams = {
		search: search || undefined,
		gender: selectedGender || undefined,
		status: selectedStatus || undefined,
		careLevelId: selectedCareLevelId || undefined
	};

	async function loadData() {
		loading = true;
		try {
			const [elderResult, careLevelResult] = await Promise.all([
				trpc.elder.list.query({
					...filterParams,
					page: 1,
					pageSize: 50
				}),
				trpc.careLevel.list.query({ includeInactive: true })
			]);
			elders = elderResult.items;
			total = elderResult.total;
			careLevels = careLevelResult;
		} catch (e) {
			console.error('Failed to load elders:', e);
		} finally {
			loading = false;
		}
	}

	function resetFilters() {
		search = '';
		selectedGender = '';
		selectedStatus = '';
		selectedCareLevelId = '';
	}

	function getElderAvatar(elder: Elder) {
		return elder.gender === 'female' ? 'bg-accent-100 text-accent-700' : 'bg-primary-100 text-primary-700';
	}

	onMount(() => {
		loadData();
	});

	$: filterParams, loadData();
</script>

<div class="space-y-5">
	<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
		<div>
			<h1 class="text-xl font-bold text-gray-800 font-serif">老人档案</h1>
			<p class="text-sm text-gray-500 mt-1">共 {total} 位老人</p>
		</div>
		<button type="button" on:click={() => goto('/elders/new')} class="btn-primary">
			<Plus class="w-4 h-4" />
			新增老人
		</button>
	</div>

	<div class="card p-4">
		<div class="flex flex-col lg:flex-row gap-3">
			<div class="flex-1 relative">
				<Search class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
				<input
					type="text"
					bind:value={search}
					placeholder="搜索姓名、身份证、房间号"
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
					bind:value={selectedGender}
					class="input w-auto"
				>
					<option value="">全部性别</option>
					<option value="male">男</option>
					<option value="female">女</option>
				</select>
				<select
					bind:value={selectedStatus}
					class="input w-auto"
				>
					<option value="">全部状态</option>
					<option value="pending">待入住</option>
					<option value="admitted">已入住</option>
					<option value="discharged">已出院</option>
				</select>
				<select
					bind:value={selectedCareLevelId}
					class="input w-auto"
				>
					<option value="">全部护理等级</option>
					{#each careLevels as cl}
						<option value={cl.id}>{cl.name}</option>
					{/each}
				</select>
				<button type="button" on:click={resetFilters} class="btn-ghost">
					重置
				</button>
			</div>
			<div class="flex items-center gap-1 ml-auto border border-gray-200 rounded-xl p-1 bg-gray-50">
				<button
					type="button"
					on:click={() => viewMode = 'card'}
					class={cn('p-2 rounded-lg transition-colors', viewMode === 'card' ? 'bg-white shadow-soft text-primary-600' : 'text-gray-500 hover:text-gray-700')}
				>
					<LayoutGrid class="w-4 h-4" />
				</button>
				<button
					type="button"
					on:click={() => viewMode = 'list'}
					class={cn('p-2 rounded-lg transition-colors', viewMode === 'list' ? 'bg-white shadow-soft text-primary-600' : 'text-gray-500 hover:text-gray-700')}
				>
					<List class="w-4 h-4" />
				</button>
			</div>
		</div>

		{#if showFilters}
			<div class="lg:hidden mt-4 pt-4 border-t border-gray-100">
				<div class="grid grid-cols-2 gap-3">
					<select bind:value={selectedGender} class="input">
						<option value="">全部性别</option>
						<option value="male">男</option>
						<option value="female">女</option>
					</select>
					<select bind:value={selectedStatus} class="input">
						<option value="">全部状态</option>
						<option value="pending">待入住</option>
						<option value="admitted">已入住</option>
						<option value="discharged">已出院</option>
					</select>
					<select bind:value={selectedCareLevelId} class="input col-span-2">
						<option value="">全部护理等级</option>
						{#each careLevels as cl}
							<option value={cl.id}>{cl.name}</option>
						{/each}
					</select>
				</div>
				<div class="mt-3">
					<button type="button" on:click={resetFilters} class="btn-secondary w-full">
						重置筛选
					</button>
				</div>
			</div>
		{/if}
	</div>

	{#if loading}
		<div class="flex items-center justify-center py-20">
			<div class="flex flex-col items-center gap-3">
				<div class="w-8 h-8 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
				<p class="text-sm text-gray-500">加载中...</p>
			</div>
		</div>
	{:else if elders.length === 0}
		<div class="card p-12 text-center">
			<User class="w-12 h-12 text-gray-300 mx-auto mb-4" />
			<p class="text-gray-500 mb-2">暂无老人档案</p>
			<button type="button" on:click={() => goto('/elders/new')} class="btn-primary mt-2">
				<Plus class="w-4 h-4" />
				新增第一位老人
			</button>
		</div>
	{:else if viewMode === 'card'}
		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
			{#each elders as elder}
				<button
					type="button"
					on:click={() => goto(`/elders/${elder.id}`)}
					class="card p-5 text-left hover:shadow-card-hover transition-all duration-300 group"
				>
					<div class="flex items-start gap-4 mb-4">
						<div class={cn('w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-semibold flex-shrink-0', getElderAvatar(elder))}>
							{elder.name.charAt(0)}
						</div>
						<div class="flex-1 min-w-0">
							<div class="flex items-center gap-2 flex-wrap">
								<h3 class="font-semibold text-gray-800 truncate">{elder.name}</h3>
								<StatusBadge
									variant={elderStatusMap[elder.status].variant}
									label={elderStatusMap[elder.status].label}
									showDot={false}
								/>
							</div>
							<p class="text-sm text-gray-500 mt-0.5">
								{formatGender(elder.gender)} · {calculateAge(elder.birthDate)}岁
							</p>
						</div>
					</div>
					<div class="space-y-2 text-sm">
						<div class="flex items-center gap-2 text-gray-600">
							<MapPin class="w-4 h-4 text-gray-400 flex-shrink-0" />
							<span class="truncate">{elder.roomNumber || '未分配房间'}</span>
						</div>
						<div class="flex items-center gap-2 text-gray-600">
							<Heart class="w-4 h-4 text-gray-400 flex-shrink-0" />
							<span class="truncate">{elder.careLevel?.name || '未评定等级'}</span>
						</div>
						<div class="flex items-center gap-2 text-gray-600">
							<Calendar class="w-4 h-4 text-gray-400 flex-shrink-0" />
							<span class="truncate">{formatDate(elder.admissionDate)}</span>
						</div>
					</div>
					<div class="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
						{#if elder.allergies.length > 0}
							<div class="flex flex-wrap gap-1">
								{#each elder.allergies.slice(0, 2) as allergy}
									<span class="inline-block px-2 py-0.5 text-[11px] rounded-full bg-danger-50 text-danger-700 border border-danger-200">
										{allergy}
									</span>
								{/each}
								{#if elder.allergies.length > 2}
									<span class="text-[11px] text-gray-400">+{elder.allergies.length - 2}</span>
								{/if}
							</div>
						{:else}
							<span />
						{/if}
						<ChevronRight class="w-4 h-4 text-gray-400 group-hover:text-primary-600 group-hover:translate-x-0.5 transition-all" />
					</div>
				</button>
			{/each}
		</div>
	{:else}
		<div class="card overflow-hidden">
			<div class="overflow-x-auto">
				<table class="w-full">
					<thead>
						<tr class="border-b border-gray-100 bg-gray-50/50">
							<th class="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3.5">
								老人信息
							</th>
							<th class="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3.5 hidden md:table-cell">
								房间号
							</th>
							<th class="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3.5 hidden lg:table-cell">
								护理等级
							</th>
							<th class="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3.5 hidden lg:table-cell">
								入住日期
							</th>
							<th class="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3.5">
								状态
							</th>
							<th class="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3.5">
								操作
							</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-gray-100">
						{#each elders as elder}
							<tr class="hover:bg-gray-50/50 transition-colors">
								<td class="px-5 py-4">
									<div class="flex items-center gap-3">
										<div class={cn('w-10 h-10 rounded-xl flex items-center justify-center text-sm font-semibold flex-shrink-0', getElderAvatar(elder))}>
											{elder.name.charAt(0)}
										</div>
										<div class="min-w-0">
											<p class="font-medium text-gray-800 truncate">{elder.name}</p>
											<p class="text-xs text-gray-500">{formatGender(elder.gender)} · {calculateAge(elder.birthDate)}岁</p>
										</div>
									</div>
								</td>
								<td class="px-5 py-4 hidden md:table-cell">
									<span class="text-sm text-gray-600">{elder.roomNumber || '-'}</span>
								</td>
								<td class="px-5 py-4 hidden lg:table-cell">
									<span class="text-sm text-gray-600">{elder.careLevel?.name || '未评定'}</span>
								</td>
								<td class="px-5 py-4 hidden lg:table-cell">
									<span class="text-sm text-gray-600">{formatDate(elder.admissionDate)}</span>
								</td>
								<td class="px-5 py-4">
									<StatusBadge
										variant={elderStatusMap[elder.status].variant}
										label={elderStatusMap[elder.status].label}
									/>
								</td>
								<td class="px-5 py-4 text-right">
									<button
										type="button"
										on:click={() => goto(`/elders/${elder.id}`)}
										class="btn-ghost py-1.5 px-3 text-sm"
									>
										查看详情
										<ChevronRight class="w-4 h-4" />
									</button>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	{/if}
</div>
