<script lang="ts">
	import { trpcClient } from '$lib/trpc/client';
	import { onMount } from 'svelte';

	let guests: any[] = [];
	let properties: any[] = [];
	let loading = true;
	let search = '';
	let showModal = false;

	let form = {
		propertyId: '', orderId: undefined as string | undefined,
		fullName: '', idType: 'id_card' as any, idNumber: '',
		nationality: 'CN', gender: undefined as any,
		phone: '', isPrimary: false,
		checkInAtStr: '' as string
	};

	async function loadData() {
		loading = true;
		try {
			const [g, p] = await Promise.all([
				trpcClient.guest.list.query({ search: search || undefined }),
				trpcClient.property.list.query({ status: 'active' })
			]);
			guests = g; properties = p;
			if (p.length > 0 && !form.propertyId) form.propertyId = p[0].id;
		} finally { loading = false; }
	}
	onMount(loadData);

	async function submitForm() {
		const payload: any = { ...form };
		if (form.checkInAtStr) payload.checkInAt = new Date(form.checkInAtStr + 'T00:00:00');
		delete payload.checkInAtStr;
		await trpcClient.guest.create.mutate(payload);
		showModal = false;
		Object.assign(form, { fullName: '', idNumber: '', phone: '', checkInAtStr: '', orderId: undefined, isPrimary: false });
		loadData();
	}
	async function remove(id: string) {
		if (!confirm('确认删除此登记？')) return;
		await trpcClient.guest.delete.mutate(id);
		loadData();
	}

	const propMap = new Map(properties.map((p) => [p.id, p.name]));
	const idLabels: Record<string, string> = { id_card: '身份证', passport: '护照', driver_license: '驾照', other: '其他' };

	function formatDate(d: any) { if (!d) return '-'; return new Date(d).toLocaleDateString('zh-CN'); }
</script>

<div class="space-y-6">
	<div class="flex items-center justify-between flex-wrap gap-3">
		<div class="flex items-center gap-3">
			<input bind:value={search} placeholder="搜索姓名/证件号/电话" class="input w-72" on:change={loadData} />
		</div>
		<button on:click={() => showModal = true} class="btn-primary">新增登记</button>
	</div>

	{#if loading}
		<div class="card card-body py-12 text-center text-gray-500">加载中...</div>
	{:else}
		<div class="card overflow-hidden">
			<table class="table">
				<thead class="bg-gray-50"><tr>
					<th class="table-th">姓名</th>
					<th class="table-th">证件信息</th>
					<th class="table-th">联系电话</th>
					<th class="table-th">房源</th>
					<th class="table-th">入住/退房</th>
					<th class="table-th">操作</th>
				</tr></thead>
				<tbody class="divide-y">
					{#if guests.length === 0}
						<tr><td colspan="6" class="py-16 text-center text-gray-400">暂无入住证件登记</td></tr>
					{/if}
					{#each guests as g}
						<tr class="hover:bg-gray-50">
							<td class="table-td">
								<div class="flex items-center gap-2">
									<div class="font-medium">{g.fullName}</div>
									{#if g.isPrimary}<span class="badge bg-primary-100 text-primary-700">主入住人</span>{/if}
								</div>
							</td>
							<td class="table-td text-sm">
								<div><span class="badge bg-gray-100 text-gray-700 mr-2">{idLabels[g.idType]}</span></div>
								<div class="font-mono text-xs text-gray-500 mt-1">{g.idNumber?.replace(/(.{4}).+(.{4})/, '$1********$2')}</div>
							</td>
							<td class="table-td text-sm">{g.phone ?? '-'}</td>
							<td class="table-td text-sm">{propMap.get(g.propertyId) ?? '-'}</td>
							<td class="table-td text-sm">
								<div>{formatDate(g.checkInAt)} ~</div>
								<div class="text-gray-500">{formatDate(g.checkOutAt)}</div>
							</td>
							<td class="table-td">
								<button on:click={() => remove(g.id)} class="btn-danger text-xs py-1 px-2">删除</button>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>

{#if showModal}
	<div class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" on:click={(e) => { if (e.target === e.currentTarget) showModal = false; }}>
		<div class="bg-white rounded-xl shadow-2xl w-full max-w-xl">
			<div class="px-6 py-4 border-b flex items-center justify-between">
				<h3 class="font-semibold text-lg">新增入住登记</h3>
				<button on:click={() => showModal = false} class="text-gray-400 hover:text-gray-600">✕</button>
			</div>
			<div class="p-6 space-y-4">
				<div class="grid grid-cols-2 gap-4">
					<div><label class="label">房源 *</label>
						<select bind:value={form.propertyId} class="select">
							{#each properties as p}<option value={p.id}>{p.name}</option>{/each}
						</select>
					</div>
					<div><label class="label">是否主入住人</label>
						<label class="flex items-center gap-2 mt-2"><input type="checkbox" bind:checked={form.isPrimary} class="w-4 h-4" /> 设为主入住人</label>
					</div>
					<div class="col-span-2"><label class="label">姓名 *</label><input bind:value={form.fullName} class="input" required /></div>
					<div><label class="label">证件类型 *</label>
						<select bind:value={form.idType} class="select">
							{#each Object.entries(idLabels) as [k, v]}<option value={k}>{v}</option>{/each}
						</select>
					</div>
					<div><label class="label">证件号 *</label><input bind:value={form.idNumber} class="input" required /></div>
					<div><label class="label">国籍</label><input bind:value={form.nationality} class="input" /></div>
					<div><label class="label">性别</label>
						<select bind:value={form.gender} class="select">
							<option value={undefined}>不限</option>
							<option value="male">男</option><option value="female">女</option><option value="other">其他</option>
						</select>
					</div>
					<div><label class="label">联系电话</label><input bind:value={form.phone} class="input" /></div>
					<div><label class="label">入住日期</label><input type="date" bind:value={form.checkInAtStr} class="input" /></div>
				</div>
				<div class="pt-2 flex justify-end gap-3">
					<button on:click={() => showModal = false} class="btn-secondary">取消</button>
					<button on:click={submitForm} class="btn-primary">保存</button>
				</div>
			</div>
		</div>
	</div>
{/if}
