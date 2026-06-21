<script lang="ts">
	import { trpc } from '$lib/trpc/client';
	import { onMount } from 'svelte';
	import type { Project, WorkerCheckin } from '$lib/server/db/schema';

	let projects = $state<Project[]>([]);
	let selectedProjectId = $state<string>('');
	let todayCheckins = $state<WorkerCheckin[]>([]);
	let activeCheckin = $state<WorkerCheckin | null>(null);
	let isLoading = $state(true);
	let isSubmitting = $state(false);
	let workContent = $state('');
	let notes = $state('');
	let photos = $state<string[]>([]);
	let currentTime = $state(new Date());

	$effect(() => {
		const timer = setInterval(() => {
			currentTime = new Date();
		}, 1000);
		return () => clearInterval(timer);
	});

	const todayStr = $derived(() => {
		const d = currentTime;
		const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
		return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 ${weekdays[d.getDay()]}`;
	});

	const timeStr = $derived(() => {
		const d = currentTime;
		return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
	});

	const todayTotalHours = $derived(() => {
		return todayCheckins.reduce((sum, c) => sum + (c.workHours || 0), 0);
	});

	async function loadData() {
		isLoading = true;
		try {
			const startOfDay = new Date();
			startOfDay.setHours(0, 0, 0, 0);
			const endOfDay = new Date();
			endOfDay.setHours(23, 59, 59, 999);

			const [projectsResult, checkinsResult] = await Promise.all([
				trpc.projects.list.query({ page: 1, pageSize: 100, status: 'processing' }),
				trpc.workerCheckins.getMyCheckins.query({
					page: 1,
					pageSize: 100,
					startDate: startOfDay,
					endDate: endOfDay
				})
			]);

			projects = projectsResult.data;
			todayCheckins = checkinsResult.data;

			if (projects.length > 0 && !selectedProjectId) {
				selectedProjectId = projects[0]?.id ?? '';
			}

			activeCheckin = todayCheckins.find((c) => !c.checkoutTime) || null;
		} catch (e) {
			console.error('Failed to load data:', e);
		} finally {
			isLoading = false;
		}
	}

	onMount(() => {
		loadData();
	});

	async function handleCheckin() {
		if (!selectedProjectId) {
			alert('请选择项目');
			return;
		}

		isSubmitting = true;
		try {
			const result = await trpc.workerCheckins.checkin.mutate({
				projectId: selectedProjectId,
				workContent: workContent || undefined,
				notes: notes || undefined,
				photos: photos.length > 0 ? photos : undefined
			});
			activeCheckin = result;
			workContent = '';
			notes = '';
			photos = [];
			await loadData();
		} catch (e: any) {
			alert(e.message || '签到失败');
		} finally {
			isSubmitting = false;
		}
	}

	async function handleCheckout() {
		if (!activeCheckin) return;

		isSubmitting = true;
		try {
			await trpc.workerCheckins.checkout.mutate({
				id: activeCheckin.id,
				notes: notes || undefined
			});
			activeCheckin = null;
			notes = '';
			await loadData();
		} catch (e: any) {
			alert(e.message || '签退失败');
		} finally {
			isSubmitting = false;
		}
	}

	function handlePhotoUpload() {
		const input = document.createElement('input');
		input.type = 'file';
		input.accept = 'image/*';
		input.multiple = true;
		input.onchange = (e) => {
			const files = (e.target as HTMLInputElement).files;
			if (files) {
				Array.from(files).forEach((file) => {
					const reader = new FileReader();
					reader.onload = (ev) => {
						if (ev.target?.result) {
							photos = [...photos, ev.target.result as string];
						}
					};
					reader.readAsDataURL(file);
				});
			}
		};
		input.click();
	}

	function removePhoto(index: number) {
		photos = photos.filter((_, i) => i !== index);
	}

	function formatTime(date: Date | null | undefined): string {
		if (!date) return '--:--';
		const d = new Date(date);
		return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
	}

	const selectedProject = $derived(() => projects.find((p) => p.id === selectedProjectId));
</script>

<div class="px-4 py-4">
	{#if isLoading}
		<div class="flex items-center justify-center py-20">
			<div class="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
		</div>
	{:else}
		<section class="bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl p-6 text-white mb-6">
			<div class="text-center">
				<p class="text-white/80 text-sm">{todayStr()}</p>
				<p class="text-5xl font-mono font-bold mt-2 tracking-wider">{timeStr()}</p>
				<div class="flex items-center justify-center gap-8 mt-4">
					<div class="text-center">
						<p class="text-2xl font-bold">{todayCheckins.length}</p>
						<p class="text-xs text-white/70">今日签到</p>
					</div>
					<div class="w-px h-10 bg-white/30" />
					<div class="text-center">
						<p class="text-2xl font-bold">{todayTotalHours()}h</p>
						<p class="text-xs text-white/70">今日工时</p>
					</div>
				</div>
			</div>
		</section>

		<section class="bg-white rounded-xl p-4 mb-4 shadow-sm border border-gray-100">
			<label class="block text-sm font-medium text-gray-700 mb-2">选择项目</label>
			<select
				class="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900"
				bind:value={selectedProjectId}
				disabled={!!activeCheckin}
			>
				{#each projects as project}
					<option value={project.id}>{project.name}</option>
				{/each}
			</select>
			{#if selectedProject()}
				<p class="text-sm text-gray-500 mt-2">📍 {selectedProject()?.address}</p>
			{/if}
		</section>

		{#if !activeCheckin}
			<section class="bg-white rounded-xl p-4 mb-4 shadow-sm border border-gray-100">
				<label class="block text-sm font-medium text-gray-700 mb-2">工作内容</label>
				<textarea
					class="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none text-gray-900"
					rows={3}
					placeholder="请输入今天的工作内容..."
					bind:value={workContent}
				/>
			</section>

			<section class="bg-white rounded-xl p-4 mb-4 shadow-sm border border-gray-100">
				<div class="flex items-center justify-between mb-2">
					<label class="block text-sm font-medium text-gray-700">现场照片</label>
					<button
						class="text-sm text-primary-600 font-medium"
						onclick={handlePhotoUpload}
					>
						+ 添加照片
					</button>
				</div>
				{#if photos.length > 0}
					<div class="grid grid-cols-4 gap-2">
						{#each photos as photo, i}
							<div class="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
								<img src={photo} alt="现场照片" class="w-full h-full object-cover" />
								<button
									class="absolute top-0.5 right-0.5 w-5 h-5 bg-black/50 rounded-full flex items-center justify-center text-white text-xs"
									onclick={() => removePhoto(i)}
								>
									×
								</button>
							</div>
						{/each}
					</div>
				{:else}
					<p class="text-sm text-gray-400 text-center py-4">暂无照片，点击上方添加</p>
				{/if}
			</section>
		{/if}

		<section class="bg-white rounded-xl p-4 mb-4 shadow-sm border border-gray-100">
			<label class="block text-sm font-medium text-gray-700 mb-2">备注</label>
			<textarea
				class="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none text-gray-900"
				rows={2}
				placeholder="添加备注信息..."
				bind:value={notes}
			/>
		</section>

		<div class="px-4 py-4">
			{#if !activeCheckin}
				<button
					class="w-full py-4 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-xl shadow-lg shadow-green-500/30 active:scale-[0.98] transition-transform disabled:opacity-50"
					onclick={handleCheckin}
					disabled={isSubmitting}
				>
					{#if isSubmitting}
						<div class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
					{:else}
						⏰ 签到
					{/if}
				</button>
			{:else}
				<div class="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-4">
					<div class="flex items-center gap-3">
						<div class="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
							<span class="text-xl">⏱️</span>
						</div>
						<div class="flex-1">
							<p class="font-medium text-yellow-800">正在签到中</p>
							<p class="text-sm text-yellow-600">
								签到时间：{formatTime(activeCheckin.checkinTime)}
							</p>
						</div>
					</div>
				</div>
				<button
					class="w-full py-4 bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold rounded-xl shadow-lg shadow-red-500/30 active:scale-[0.98] transition-transform disabled:opacity-50"
					onclick={handleCheckout}
					disabled={isSubmitting}
				>
					{#if isSubmitting}
						<div class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
					{:else}
						✅ 签退
					{/if}
				</button>
			{/if}
		</div>

		{#if todayCheckins.length > 0}
			<section class="mt-6">
				<h3 class="text-base font-semibold text-gray-900 mb-3 px-1">今日记录</h3>
				{#each todayCheckins as checkin}
					<div class="bg-white rounded-xl p-4 mb-3 shadow-sm border border-gray-100">
						<div class="flex items-center justify-between">
							<div class="flex items-center gap-3">
								<div class="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center">
									{checkin.checkoutTime ? '✅' : '⏱️'}
								</div>
								<div>
									<p class="font-medium text-gray-900">
										{checkin.checkoutTime ? '已完成' : '进行中'}
									</p>
									<p class="text-sm text-gray-500">
										{formatTime(checkin.checkinTime)} - {formatTime(checkin.checkoutTime)}
										{#if checkin.workHours}
											<span class="text-primary-600 ml-2">{checkin.workHours}h</span>
										{/if}
									</p>
								</div>
							</div>
						</div>
					</div>
				{/each}
			</section>
		{/if}
	{/if}
</div>
