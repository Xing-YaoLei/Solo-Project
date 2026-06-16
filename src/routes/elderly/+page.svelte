<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { careLevelMap, genderMap, roleMap } from '$lib/client-utils';
	import { formatDate, formatDateTime } from '$lib/server/utils';
	import Modal from '$lib/components/Modal.svelte';

	type Caregiver = { id: string; fullName: string };
	type Elderly = {
		id: string;
		name: string;
		gender: string;
		age: number | null;
		roomNumber: string | null;
		bedNumber: string | null;
		careLevel: string;
		primaryDisease: string | null;
		allergyInfo: string | null;
		emergencyContact: string | null;
		emergencyPhone: string | null;
		notes: string | null;
		admissionDate: number | null;
		caregiverId: string | null;
	};

	let elderlyList: Elderly[] = [];
	let caregivers: Caregiver[] = [];
	let loading = true;
	let search = '';
	let filterLevel = '';

	let user: App.Locals['user'];

	let showAdd = false;
	let showEditId: string | null = null;
	let editData: Elderly | null = null;

	let formData = {
		name: '',
		gender: 'male' as const,
		birthDate: '',
		idNumber: '',
		roomNumber: '',
		bedNumber: '',
		careLevel: 'independent' as const,
		primaryDisease: '',
		allergyInfo: '',
		emergencyContact: '',
		emergencyPhone: '',
		notes: '',
		admissionDate: '',
		caregiverId: ''
	};

	const careLevels = [
		{ value: 'independent', label: '自理' },
		{ value: 'semi_dependent', label: '半自理' },
		{ value: 'dependent', label: '不能自理' },
		{ value: 'total_care', label: '全护' }
	];

	$: isManager = user?.role === 'admin' || user?.role === 'manager';
	$: filteredElderly = elderlyList.filter((e) => {
		if (search && !e.name.includes(search)) return false;
		if (filterLevel && e.careLevel !== filterLevel) return false;
		return true;
	});

	onMount(async () => {
		await loadAll();
	});

	async function loadAll() {
		loading = true;
		try {
			const userRes = await fetch('/api/trpc/auth.getCurrentUser', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'auth.getCurrentUser' })
			});
			user = (await userRes.json()).result?.data;

			const res = await fetch('/api/trpc/elderly.list', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'elderly.list', params: { input: {} } })
			});
			elderlyList = (await res.json()).result?.data || [];

			if (isManager) {
				const cgRes = await fetch('/api/trpc/user.caregivers', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ jsonrpc: '2.0', id: 3, method: 'user.caregivers' })
				});
				caregivers = (await cgRes.json()).result?.data || [];
			}
		} catch (e) {
			console.error(e);
		} finally {
			loading = false;
		}
	}

	function openAdd() {
		formData = {
			name: '',
			gender: 'male',
			birthDate: '',
			idNumber: '',
			roomNumber: '',
			bedNumber: '',
			careLevel: 'independent',
			primaryDisease: '',
			allergyInfo: '',
			emergencyContact: '',
			emergencyPhone: '',
			notes: '',
			admissionDate: new Date().toISOString().split('T')[0],
			caregiverId: ''
		};
		showAdd = true;
	}

	function openEdit(e: Elderly) {
		editData = e;
		showEditId = e.id;
		formData = {
			name: e.name,
			gender: e.gender as 'male' | 'female' | 'other',
			birthDate: e.birthDate ? new Date(e.birthDate as unknown as number).toISOString().split('T')[0] : '',
			idNumber: e.idNumber || '',
			roomNumber: e.roomNumber || '',
			bedNumber: e.bedNumber || '',
			careLevel: e.careLevel as 'independent' | 'semi_dependent' | 'dependent' | 'total_care',
			primaryDisease: e.primaryDisease || '',
			allergyInfo: e.allergyInfo || '',
			emergencyContact: e.emergencyContact || '',
			emergencyPhone: e.emergencyPhone || '',
			notes: e.notes || '',
			admissionDate: e.admissionDate ? new Date(e.admissionDate as unknown as number).toISOString().split('T')[0] : '',
			caregiverId: e.caregiverId || ''
		};
	}

	async function save() {
		if (!formData.name) {
			alert('请填写姓名');
			return;
		}

		const payload = {
			name: formData.name,
			gender: formData.gender,
			birthDate: formData.birthDate ? new Date(formData.birthDate).getTime() : null,
			idNumber: formData.idNumber || null,
			roomNumber: formData.roomNumber || null,
			bedNumber: formData.bedNumber || null,
			careLevel: formData.careLevel,
			primaryDisease: formData.primaryDisease || null,
			allergyInfo: formData.allergyInfo || null,
			emergencyContact: formData.emergencyContact || null,
			emergencyPhone: formData.emergencyPhone || null,
			notes: formData.notes || null,
			admissionDate: formData.admissionDate ? new Date(formData.admissionDate).getTime() : null,
			caregiverId: formData.caregiverId || null
		};

		if (showEditId) {
			await fetch('/api/trpc/elderly.update', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					jsonrpc: '2.0',
					id: 1,
					method: 'elderly.update',
					params: { input: { id: showEditId, ...payload } }
				})
			});
			showEditId = null;
		} else {
			await fetch('/api/trpc/elderly.create', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					jsonrpc: '2.0',
					id: 1,
					method: 'elderly.create',
					params: { input: payload }
				})
			});
			showAdd = false;
		}
		loadAll();
	}

	async function remove(id: string) {
		if (!confirm('确认删除该老人档案？')) return;
		await fetch('/api/trpc/elderly.delete', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				jsonrpc: '2.0',
				id: 1,
				method: 'elderly.delete',
				params: { input: id }
			})
		});
		loadAll();
	}

	$: showModal = showAdd || !!showEditId;
	$: modalTitle = showEditId ? '编辑老人档案' : '新增老人档案';
</script>

{#if loading}
	<div class="flex items-center justify-center h-full">
		<div class="text-gray-500">加载中...</div>
	</div>
{:else}
	<div class="space-y-6">
		<div class="flex items-center justify-between flex-wrap gap-4">
			<div class="flex items-center gap-3 flex-wrap">
				<div class="relative">
					<input
						class="input pl-9"
						placeholder="搜索老人姓名..."
						bind:value={search}
					/>
					<svg
						class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
						/>
					</svg>
				</div>
				<select class="select" bind:value={filterLevel}>
					<option value="">全部护理等级</option>
					{#each careLevels as l}
						<option value={l.value}>{l.label}</option>
					{/each}
				</select>
			</div>

			{#if isManager}
				<button class="btn btn-primary" on:click={openAdd}>
					<span class="mr-2">+</span> 新增老人
				</button>
			{/if}
		</div>

		<div class="card">
			<div class="card-header">
				<h3 class="font-semibold text-gray-800">老人档案（{filteredElderly.length}）</h3>
			</div>
			<div class="card-body">
				{#if filteredElderly.length === 0}
					<div class="empty-state">
						<div class="empty-state-icon">👵</div>
						<div class="empty-state-text">暂无老人档案</div>
						{#if isManager}
							<div class="empty-state-subtext">点击右上角新增老人</div>
						{/if}
					</div>
				{:else}
					<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
						{#each filteredElderly as e}
							<div
								class="p-5 rounded-lg border border-gray-100 hover:border-primary-200 hover:shadow-sm transition-all cursor-pointer"
								on:click={() => goto(`/elderly/${e.id}`)}
							>
								<div class="flex items-start justify-between">
									<div class="flex items-center gap-3">
										<div class="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-xl">
											{e.name.charAt(0)}
										</div>
										<div>
											<div class="font-semibold text-gray-800 text-lg">{e.name}</div>
											<div class="text-sm text-gray-500 mt-0.5">
												{genderMap[e.gender]} · {e.age ?? '-'}岁
											</div>
										</div>
									</div>
									<span class="badge {careLevelMap[e.careLevel].color}">
										{careLevelMap[e.careLevel].label}
									</span>
								</div>

								<div class="mt-4 grid grid-cols-2 gap-2 text-sm">
									<div>
										<div class="text-xs text-gray-400">房间</div>
										<div class="text-gray-700">{e.roomNumber || '-'}</div>
									</div>
									<div>
										<div class="text-xs text-gray-400">床位</div>
										<div class="text-gray-700">{e.bedNumber || '-'}</div>
									</div>
									<div>
										<div class="text-xs text-gray-400">入院</div>
										<div class="text-gray-700">{e.admissionDate ? formatDate(e.admissionDate as unknown as number) : '-'}</div>
									</div>
									<div>
										<div class="text-xs text-gray-400">紧急联系人</div>
										<div class="text-gray-700 truncate">{e.emergencyContact || '-'}</div>
									</div>
								</div>

								{e.primaryDisease && (
									<div class="mt-3 pt-3 border-t border-gray-100">
										<div class="text-xs text-gray-400 mb-1">主要疾病</div>
										<div class="text-sm text-gray-600 line-clamp-1">{e.primaryDisease}</div>
									</div>
								)}

								{#if isManager}
									<div class="mt-3 pt-3 border-t border-gray-100 flex gap-2">
										<button
											class="btn btn-sm btn-secondary flex-1"
											on:click|stopPropagation={() => openEdit(e)}
										>
											编辑
										</button>
										<button
											class="btn btn-sm btn-danger flex-1"
											on:click|stopPropagation={() => remove(e.id)}
										>
											删除
										</button>
									</div>
								{/if}
							</div>
						{/each}
					</div>
				{/if}
			</div>
		</div>
	</div>

	<Modal open={showModal} title={modalTitle} size="lg" on:close={() => { showAdd = false; showEditId = null; }}>
		<div class="modal-body space-y-4">
			<div class="grid grid-cols-2 gap-4">
				<div>
					<label class="label">姓名 *</label>
					<input class="input" bind:value={formData.name} placeholder="老人姓名" />
				</div>
				<div>
					<label class="label">性别</label>
					<select class="select" bind:value={formData.gender}>
						<option value="male">男</option>
						<option value="female">女</option>
						<option value="other">其他</option>
					</select>
				</div>
			</div>
			<div class="grid grid-cols-2 gap-4">
				<div>
					<label class="label">出生日期</label>
					<input type="date" class="input" bind:value={formData.birthDate} />
				</div>
				<div>
					<label class="label">身份证号</label>
					<input class="input" bind:value={formData.idNumber} />
				</div>
			</div>
			<div class="grid grid-cols-2 gap-4">
				<div>
					<label class="label">房间号</label>
					<input class="input" bind:value={formData.roomNumber} placeholder="如：301" />
				</div>
				<div>
					<label class="label">床位号</label>
					<input class="input" bind:value={formData.bedNumber} placeholder="如：A" />
				</div>
			</div>
			<div class="grid grid-cols-2 gap-4">
				<div>
					<label class="label">护理等级</label>
					<select class="select" bind:value={formData.careLevel}>
						{#each careLevels as l}
							<option value={l.value}>{l.label}</option>
						{/each}
					</select>
				</div>
				<div>
					<label class="label">入院日期</label>
					<input type="date" class="input" bind:value={formData.admissionDate} />
				</div>
			</div>
			{#if isManager && caregivers.length > 0}
				<div>
					<label class="label">负责护理员</label>
					<select class="select" bind:value={formData.caregiverId}>
						<option value="">未分配</option>
						{#each caregivers as cg}
							<option value={cg.id}>{cg.fullName}</option>
						{/each}
					</select>
				</div>
			{/if}
			<div>
				<label class="label">主要疾病</label>
				<input class="input" bind:value={formData.primaryDisease} placeholder="如：高血压、糖尿病" />
			</div>
			<div>
				<label class="label">过敏信息</label>
				<input class="input" bind:value={formData.allergyInfo} placeholder="药物或食物过敏" />
			</div>
			<div class="grid grid-cols-2 gap-4">
				<div>
					<label class="label">紧急联系人</label>
					<input class="input" bind:value={formData.emergencyContact} placeholder="家属姓名" />
				</div>
				<div>
					<label class="label">紧急电话</label>
					<input class="input" bind:value={formData.emergencyPhone} placeholder="联系电话" />
				</div>
			</div>
			<div>
				<label class="label">备注</label>
				<textarea class="textarea" rows="2" bind:value={formData.notes}></textarea>
			</div>
		</div>
		<div class="modal-footer">
			<button class="btn btn-secondary" on:click={() => { showAdd = false; showEditId = null; }}>取消</button>
			<button class="btn btn-primary" on:click={save}>保存</button>
		</div>
	</Modal>
{/if}
