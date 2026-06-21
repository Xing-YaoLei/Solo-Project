<script lang="ts">
	import { onMount } from 'svelte';

	let riders: any[] = [];
	let loading = true;
	let showCreateModal = false;
	let search = '';
	let filterActive = '';

	let newRider = {
		name: '',
		phone: '',
		employeeId: '',
		channel: 'other' as const
	};

	const channelOptions = [
		{ value: 'platform_a', label: '平台 A' },
		{ value: 'platform_b', label: '平台 B' },
		{ value: 'platform_c', label: '平台 C' },
		{ value: 'other', label: '其他' }
	];

	function getChannelLabel(channel: string) {
		const opt = channelOptions.find((o) => o.value === channel);
		return opt?.label || channel;
	}

	async function loadRiders() {
		loading = true;
		try {
			const res = await fetch(`/api/trpc/riders.list?batch=1`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					'0': {
						json: {
							isActive: filterActive === '' ? undefined : filterActive === 'true',
							search: search || undefined
						}
					}
				})
			});

			const data = await res.json();
			if (data[0]?.result?.data?.json) {
				riders = data[0].result.data.json;
			}
		} catch (e) {
			console.error('Failed to load riders:', e);
		} finally {
			loading = false;
		}
	}

	async function createRider() {
		if (!newRider.name || !newRider.phone) {
			return;
		}

		try {
			const res = await fetch(`/api/trpc/riders.create?batch=1`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					'0': {
						json: {
							name: newRider.name,
							phone: newRider.phone,
							employeeId: newRider.employeeId || undefined,
							channel: newRider.channel
						}
					}
				})
			});

			const data = await res.json();
			if (data[0]?.result?.data?.json) {
				showCreateModal = false;
				newRider = { name: '', phone: '', employeeId: '', channel: 'other' };
				await loadRiders();
			} else if (data[0]?.error) {
				alert(data[0].error.message || '创建失败');
			}
		} catch (e) {
			console.error('Failed to create rider:', e);
			alert('创建失败');
		}
	}

	function formatDate(date: string | Date) {
		const d = new Date(date);
		return d.toLocaleDateString('zh-CN');
	}

	function handleFilter() {
		loadRiders();
	}

	onMount(() => {
		loadRiders();
	});
</script>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<h1 class="text-2xl font-bold text-gray-900">骑手管理</h1>
		<button class="btn-primary" on:click={() => (showCreateModal = true)}>
			+ 新增骑手
		</button>
	</div>

	<!-- Filters -->
	<div class="card p-4">
		<div class="flex items-end gap-4">
			<div class="flex-1 max-w-sm">
				<label class="label">搜索</label>
				<input
					type="text"
					class="input"
					placeholder="姓名/手机号"
					bind:value={search}
					on:keydown={(e) => e.key === 'Enter' && handleFilter()}
				/>
			</div>
			<div class="w-40">
				<label class="label">状态</label>
				<select class="select" bind:value={filterActive} on:change={handleFilter}>
					<option value="">全部</option>
					<option value="true">在职</option>
					<option value="false">离职</option>
				</select>
			</div>
			<button class="btn-secondary" on:click={handleFilter}>
				筛选
			</button>
		</div>
	</div>

	<!-- Riders table -->
	<div class="card overflow-hidden">
		<div class="overflow-x-auto">
			<table class="min-w-full divide-y divide-gray-200">
				<thead class="bg-gray-50">
					<tr>
						<th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
							姓名
						</th>
						<th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
							手机号
						</th>
						<th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
							工号
						</th>
						<th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
							来源渠道
						</th>
						<th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
							状态
						</th>
						<th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
							入职时间
						</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-gray-200 bg-white">
					{#if loading}
						<tr>
							<td colspan="6" class="px-6 py-12 text-center text-gray-500">
								加载中...
							</td>
						</tr>
					{:else if riders.length === 0}
						<tr>
							<td colspan="6" class="px-6 py-12 text-center text-gray-500">
								暂无数据
							</td>
						</tr>
					{:else}
						{#each riders as rider}
							<tr class="hover:bg-gray-50">
								<td class="whitespace-nowrap px-6 py-4">
									<div class="text-sm font-medium text-gray-900">{rider.name}</div>
								</td>
								<td class="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
									{rider.phone}
								</td>
								<td class="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
									{rider.employeeId || '-'}
								</td>
								<td class="whitespace-nowrap px-6 py-4">
									<span class="badge bg-blue-100 text-blue-800">
										{getChannelLabel(rider.channel)}
									</span>
								</td>
								<td class="whitespace-nowrap px-6 py-4">
									{#if rider.isActive}
										<span class="badge bg-green-100 text-green-800">在职</span>
									{:else}
										<span class="badge bg-gray-100 text-gray-800">离职</span>
									{/if}
								</td>
								<td class="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
									{formatDate(rider.createdAt)}
								</td>
							</tr>
						{/each}
					{/if}
				</tbody>
			</table>
		</div>
	</div>
</div>

<!-- Create Modal -->
{#if showCreateModal}
	<div class="fixed inset-0 z-50 overflow-y-auto">
		<div class="flex min-h-screen items-center justify-center px-4 pt-4 pb-20 text-center sm:p-0">
			<div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" on:click={() => (showCreateModal = false)} />

			<div class="relative inline-block w-full max-w-md transform overflow-hidden rounded-lg bg-white text-left align-bottom shadow-xl transition-all">
				<div class="px-6 py-4 border-b border-gray-200">
					<h3 class="text-lg font-medium text-gray-900">新增骑手</h3>
				</div>

				<div class="px-6 py-4 space-y-4">
					<div>
						<label class="label">姓名 <span class="text-red-500">*</span></label>
						<input type="text" class="input" bind:value={newRider.name} placeholder="请输入姓名" />
					</div>

					<div>
						<label class="label">手机号 <span class="text-red-500">*</span></label>
						<input type="text" class="input" bind:value={newRider.phone} placeholder="请输入手机号" />
					</div>

					<div>
						<label class="label">工号</label>
						<input type="text" class="input" bind:value={newRider.employeeId} placeholder="请输入工号" />
					</div>

					<div>
						<label class="label">来源渠道</label>
						<select class="select" bind:value={newRider.channel}>
							{#each channelOptions as opt}
								<option value={opt.value}>{opt.label}</option>
							{/each}
						</select>
					</div>
				</div>

				<div class="px-6 py-4 bg-gray-50 flex justify-end space-x-3">
					<button class="btn-secondary" on:click={() => (showCreateModal = false)}>
						取消
					</button>
					<button class="btn-primary" on:click={createRider}>
						确认添加
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}
