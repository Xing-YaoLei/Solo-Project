<script lang="ts">
	import { onMount } from 'svelte';
	import { roleMap } from '$lib/client-utils';
	import { formatDateTime } from '$lib/server/utils';
	import Modal from '$lib/components/Modal.svelte';

	type UserItem = {
		id: string;
		username: string;
		fullName: string;
		role: 'admin' | 'manager' | 'nurse' | 'caregiver';
		phone: string | null;
		createdAt: number;
	};

	let userList: UserItem[] = [];
	let loading = true;
	let search = '';
	let filterRole = '';

	let showAdd = false;
	let showEditId: string | null = null;

	let formData = {
		username: '',
		password: '',
		fullName: '',
		role: 'caregiver' as 'admin' | 'manager' | 'nurse' | 'caregiver',
		phone: ''
	};

	const roleOptions = [
		{ value: 'admin', label: '系统管理员' },
		{ value: 'manager', label: '管理层' },
		{ value: 'nurse', label: '护士' },
		{ value: 'caregiver', label: '护理员' }
	];

	$: filteredUsers = userList.filter((u) => {
		if (search && !u.fullName.includes(search) && !u.username.includes(search)) return false;
		if (filterRole && u.role !== filterRole) return false;
		return true;
	});

	$: roleStats = (() => {
		const stats: Record<string, number> = {
			admin: 0,
			manager: 0,
			nurse: 0,
			caregiver: 0
		};
		userList.forEach((u) => {
			stats[u.role] = (stats[u.role] || 0) + 1;
		});
		return stats;
	})();

	onMount(async () => {
		await loadAll();
	});

	async function loadAll() {
		loading = true;
		try {
			const res = await fetch('/api/trpc/user.list', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					jsonrpc: '2.0',
					id: 1,
					method: 'user.list',
					params: { input: {} }
				})
			});
			userList = (await res.json()).result?.data || [];
		} catch (e) {
			console.error(e);
		} finally {
			loading = false;
		}
	}

	function openAdd() {
		formData = {
			username: '',
			password: '',
			fullName: '',
			role: 'caregiver',
			phone: ''
		};
		showAdd = true;
	}

	function openEdit(u: UserItem) {
		showEditId = u.id;
		formData = {
			username: u.username,
			password: '',
			fullName: u.fullName,
			role: u.role,
			phone: u.phone || ''
		};
	}

	async function save() {
		if (!formData.username || !formData.fullName) {
			alert('请填写用户名和姓名');
			return;
		}
		if (showAdd && !formData.password) {
			alert('请设置密码');
			return;
		}
		if (formData.password && formData.password.length < 6) {
			alert('密码至少6位');
			return;
		}

		try {
			let res;
			if (showAdd) {
				res = await fetch('/api/trpc/user.create', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						jsonrpc: '2.0',
						id: 1,
						method: 'user.create',
						params: {
							input: {
								username: formData.username,
								password: formData.password,
								fullName: formData.fullName,
								role: formData.role,
								phone: formData.phone || undefined
							}
						}
					})
				});
			} else {
				const updateData: Record<string, string> = {
					id: showEditId as string,
					fullName: formData.fullName,
					role: formData.role
				};
				if (formData.phone) updateData.phone = formData.phone;
				res = await fetch('/api/trpc/user.update', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						jsonrpc: '2.0',
						id: 1,
						method: 'user.update',
						params: { input: updateData }
					})
				});
			}
			const data = await res.json();
			if (data.error) {
				alert(data.error.message || '保存失败');
				return;
			}
			showAdd = false;
			showEditId = null;
			await loadAll();
		} catch (e) {
			console.error(e);
			alert('保存失败');
		}
	}

	async function removeUser(u: UserItem) {
		if (!confirm(`确定删除用户「${u.fullName}」吗？`)) return;
		try {
			await fetch('/api/trpc/user.delete', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					jsonrpc: '2.0',
					id: 1,
					method: 'user.delete',
					params: u.id
				})
			});
			await loadAll();
		} catch (e) {
			console.error(e);
			alert('删除失败');
		}
	}
</script>

{#if loading}
	<div class="flex items-center justify-center h-full">
		<div class="text-gray-500">加载中...</div>
	</div>
{:else}
	<div class="space-y-6">
		<div class="flex items-center justify-between">
			<div>
				<h2 class="text-2xl font-bold text-gray-800">👥 用户管理</h2>
				<p class="text-gray-500 mt-1">系统用户与权限管理</p>
			</div>
			<button class="btn btn-primary" on:click={openAdd}>
				<span class="mr-2">+</span> 新增用户
			</button>
		</div>

		<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
			<div class="stat-card">
				<div class="flex items-center justify-between">
					<div>
						<div class="text-3xl font-bold text-purple-700">{roleStats.admin}</div>
						<div class="stat-label">系统管理员</div>
					</div>
					<div class="text-4xl">👑</div>
				</div>
			</div>
			<div class="stat-card">
				<div class="flex items-center justify-between">
					<div>
						<div class="text-3xl font-bold text-blue-700">{roleStats.manager}</div>
						<div class="stat-label">管理层</div>
					</div>
					<div class="text-4xl">📊</div>
				</div>
			</div>
			<div class="stat-card">
				<div class="flex items-center justify-between">
					<div>
						<div class="text-3xl font-bold text-teal-700">{roleStats.nurse}</div>
						<div class="stat-label">护士</div>
					</div>
					<div class="text-4xl">💉</div>
				</div>
			</div>
			<div class="stat-card">
				<div class="flex items-center justify-between">
					<div>
						<div class="text-3xl font-bold text-gray-700">{roleStats.caregiver}</div>
						<div class="stat-label">护理员</div>
					</div>
					<div class="text-4xl">🧑‍⚕️</div>
				</div>
			</div>
		</div>

		<div class="card">
			<div class="card-header flex flex-col md:flex-row md:items-center md:justify-between gap-3">
				<h3 class="font-semibold text-gray-800">用户列表</h3>
				<div class="flex flex-wrap gap-2">
					<input
						class="input"
						style="width: 200px;"
						placeholder="搜索姓名/账号..."
						bind:value={search}
					/>
					<select class="select" style="width: 140px;" bind:value={filterRole}>
						<option value="">全部角色</option>
						{#each roleOptions as r}
							<option value={r.value}>{r.label}</option>
						{/each}
					</select>
				</div>
			</div>
			<div class="card-body p-0">
				<div class="table-wrapper">
					<table class="table">
						<thead>
							<tr>
								<th>用户</th>
								<th>账号</th>
								<th>角色</th>
								<th>联系电话</th>
								<th>创建时间</th>
								<th class="text-right">操作</th>
							</tr>
						</thead>
						<tbody>
							{#if filteredUsers.length === 0}
								<tr>
									<td colspan="6">
										<div class="empty-state">
											<div class="empty-state-icon">👥</div>
											<div class="empty-state-text">暂无用户</div>
										</div>
									</td>
								</tr>
							{/if}
							{#each filteredUsers as u}
								<tr>
									<td>
										<div class="flex items-center gap-3">
											<div class="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold">
												{u.fullName.charAt(0)}
											</div>
											<div>
												<div class="font-medium text-gray-800">{u.fullName}</div>
											</div>
										</div>
									</td>
									<td class="text-gray-600">{u.username}</td>
									<td>
										<span class="badge {roleMap[u.role].color}">
											{roleMap[u.role].label}
										</span>
									</td>
									<td class="text-gray-600">{u.phone || '-'}</td>
									<td class="text-gray-500 text-sm">{formatDateTime(u.createdAt)}</td>
									<td class="text-right">
										<div class="flex justify-end gap-2">
											<button class="btn btn-secondary btn-sm" on:click={() => openEdit(u)}>
												编辑
											</button>
											{u.username !== 'admin' && (
												<button class="btn btn-danger btn-sm" on:click={() => removeUser(u)}>
													删除
												</button>
											)}
										</div>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	</div>
{/if}

<Modal open={showAdd || !!showEditId} title={showAdd ? '新增用户' : '编辑用户'} on:close={() => { showAdd = false; showEditId = null; }}>
	<div class="modal-body space-y-4">
		<div>
			<label class="label">用户名 <span class="text-red-500">*</span></label>
			<input class="input" placeholder="登录账号" bind:value={formData.username} disabled={!!showEditId} />
		</div>
		<div>
			<label class="label">
				{showAdd ? '密码' : '新密码'}
				{#if showAdd}<span class="text-red-500">*</span>{/if}
				{#if showEditId}<span class="text-gray-400 ml-1 text-xs">（留空不修改）</span>{/if}
			</label>
			<input class="input" type="password" placeholder="至少6位" bind:value={formData.password} />
		</div>
		<div>
			<label class="label">姓名 <span class="text-red-500">*</span></label>
			<input class="input" placeholder="真实姓名" bind:value={formData.fullName} />
		</div>
		<div>
			<label class="label">角色</label>
			<select class="select" bind:value={formData.role}>
				{#each roleOptions as r}
					<option value={r.value}>{r.label}</option>
				{/each}
			</select>
		</div>
		<div>
			<label class="label">联系电话</label>
			<input class="input" placeholder="手机号" bind:value={formData.phone} />
		</div>
	</div>
	<div class="modal-footer">
		<button class="btn btn-secondary" on:click={() => { showAdd = false; showEditId = null; }}>
			取消
		</button>
		<button class="btn btn-primary" on:click={save}>保存</button>
	</div>
</Modal>
