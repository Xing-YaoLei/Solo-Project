<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { trpcClient } from '$lib/trpc/client';

	export let property: any = null;

	const dispatch = createEventDispatcher();

	let form = {
		name: property?.name ?? '',
		address: property?.address ?? '',
		city: property?.city ?? '',
		type: property?.type ?? 'apartment',
		bedrooms: property?.bedrooms ?? 1,
		bathrooms: property?.bathrooms ?? 1,
		maxGuests: property?.maxGuests ?? 2,
		area: property?.area ?? undefined as number | undefined,
		basePrice: property?.basePrice ?? 0,
		cleaningFee: property?.cleaningFee ?? 0,
		depositAmount: property?.depositAmount ?? 0,
		description: property?.description ?? '',
		status: property?.status ?? 'active'
	};
	let submitting = false;
	let error = '';

	async function handleSubmit() {
		submitting = true;
		error = '';
		try {
			const payload: any = { ...form };
			if (form.area === undefined || form.area === null || isNaN(form.area as any)) delete payload.area;
			if (property) {
				await trpcClient.property.update.mutate({ id: property.id, ...payload });
			} else {
				await trpcClient.property.create.mutate(payload);
			}
			dispatch('saved');
		} catch (e: any) {
			error = e?.message ?? '保存失败';
		} finally {
			submitting = false;
		}
	}
</script>

<div class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" on:click={(e) => { if (e.target === e.currentTarget) dispatch('cancel'); }}>
	<div class="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-auto">
		<div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
			<h3 class="font-semibold text-lg text-gray-900">{property ? '编辑房源' : '新增房源'}</h3>
			<button on:click={() => dispatch('cancel')} class="text-gray-400 hover:text-gray-600">
				<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
			</button>
		</div>

		<form on:submit|preventDefault={handleSubmit} class="p-6 space-y-4">
			<div class="grid grid-cols-2 gap-4">
				<div class="col-span-2">
					<label class="label">房源名称 *</label>
					<input bind:value={form.name} class="input" required placeholder="如：西湖畔温馨两居室" />
				</div>
				<div>
					<label class="label">城市 *</label>
					<input bind:value={form.city} class="input" required placeholder="杭州" />
				</div>
				<div>
					<label class="label">房源类型 *</label>
					<select bind:value={form.type} class="select">
						<option value="apartment">公寓</option>
						<option value="house">独栋</option>
						<option value="villa">别墅</option>
						<option value="loft">Loft</option>
						<option value="other">其他</option>
					</select>
				</div>
				<div class="col-span-2">
					<label class="label">详细地址 *</label>
					<input bind:value={form.address} class="input" required placeholder="请填写详细地址" />
				</div>
			</div>

			<div class="border-t border-gray-100 pt-4 grid grid-cols-4 gap-4">
				<div>
					<label class="label">卧室数</label>
					<input type="number" min="0" bind:value={form.bedrooms} class="input" />
				</div>
				<div>
					<label class="label">卫浴数</label>
					<input type="number" min="0" bind:value={form.bathrooms} class="input" />
				</div>
				<div>
					<label class="label">最大入住</label>
					<input type="number" min="1" bind:value={form.maxGuests} class="input" />
				</div>
				<div>
					<label class="label">面积(㎡)</label>
					<input type="number" min="0" bind:value={form.area} class="input" placeholder="选填" />
				</div>
			</div>

			<div class="border-t border-gray-100 pt-4 grid grid-cols-3 gap-4">
				<div>
					<label class="label">基础房价 (¥/晚)</label>
					<input type="number" min="0" step="0.01" bind:value={form.basePrice} class="input" />
				</div>
				<div>
					<label class="label">清洁费 (¥)</label>
					<input type="number" min="0" step="0.01" bind:value={form.cleaningFee} class="input" />
				</div>
				<div>
					<label class="label">押金 (¥)</label>
					<input type="number" min="0" step="0.01" bind:value={form.depositAmount} class="input" />
				</div>
			</div>

			<div class="border-t border-gray-100 pt-4">
				<label class="label">房源描述</label>
				<textarea bind:value={form.description} class="input min-h-[100px]" placeholder="房源亮点、周边配套等"></textarea>
			</div>

			<div class="border-t border-gray-100 pt-4">
				<label class="label">运营状态</label>
				<select bind:value={form.status} class="select w-40">
					<option value="active">运营中</option>
					<option value="inactive">未运营</option>
				</select>
			</div>

			{#if error}
				<div class="rounded-md bg-red-50 p-3 border border-red-200">
					<div class="text-sm text-red-700">{error}</div>
				</div>
			{/if}

			<div class="border-t border-gray-100 pt-4 flex justify-end gap-3">
				<button type="button" on:click={() => dispatch('cancel')} class="btn-secondary">取消</button>
				<button type="submit" class="btn-primary" disabled={submitting}>
					{submitting ? '保存中...' : '保 存'}
				</button>
			</div>
		</form>
	</div>
</div>
