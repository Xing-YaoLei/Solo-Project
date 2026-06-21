<script lang="ts">
	import { trpc } from '$lib/trpc';
	import { onMount } from 'svelte';
	import { formatDateTime, getRoleLabel } from '$lib/utils';
	import type { User } from '$lib/server/db/schema';

	let listData: {
		items: User[];
		total: number;
		page: number;
		pageSize: number;
		totalPages: number;
	} | null = null;
	let currentUser: any = null;
	let loading = true;

	let searchQuery = '';
	let filterRole = '';
	let currentPage = 1;

	let formModal = false;
	let formMode: 'create' | 'edit' = 'create';
	let formLoading = false;
	let formError = '';
	let formId = '';
	let formUsername = '';
	let formRealName = '';
	let formEmail = '';
	let formPhone = '';
	let formRole = 'viewer';
	let formPassword = '';

	let deleteModal = false;
	let deleteLoading = false;
	let deleteId = '';
	let deleteName = '';

	const roleOptions = [
		{ value: '', label: '全部角色' },
		{ value: 'admin', label: '系统管理员' },
		{ value: 'manager', label: '运营经理' },
		{ value: 'cleaner', label: '保洁员' },
		{ value: 'viewer', label: '查看者' }
	];

	const roleBadgeColor: Record<string, string> = {
		admin: 'badge-danger',
		manager: 'badge-warning',
		cleaner: 'badge-info',
		viewer: 'badge-gray'
	};

	onMount(async () => {
		currentUser = await trpc().user.getCurrent.query();
		await loadList();
	});

	async function loadList() {
		loading = true;
		try {
			const input: any = { page: currentPage, pageSize: 20 };
			if (searchQuery) input.search = searchQuery;
			if (filterRole) input.role = filterRole as any;
			listData = await trpc().user.list.query(input);
		} finally {
			loading = false;
		}
	}

	async function handleSearch() {
		currentPage = 1;
		await loadList();
	}

	async function handleReset() {
		searchQuery = '';
		filterRole = '';
		currentPage = 1;
		await loadList();
	}

	function openCreate() {
		formMode = 'create';
		formId = '';
		formUsername = '';
		formRealName = '';
		formEmail = '';
		formPhone = '';
		formRole = 'viewer';
		formPassword = '';
		formError = '';
		formModal = true;
	}

	function openEdit(user: User) {
		formMode = 'edit';
		formId = user.id;
		formUsername = user.username;
		formRealName = user.realName;
		formEmail = user.email || '';
		formPhone = user.phone || '';
		formRole = user.role;
		formPassword = '';
		formError = '';
		formModal = true;
	}

	function canEditUser(user: User): boolean {
		if (currentUser?.role === 'admin') return true;
		if (currentUser?.role === 'manager') {
			return user.role !== 'admin' && user.role !== 'manager';
		}
		return false;
	}

	function canCreateUser(): boolean {
		return currentUser?.role === 'admin' || currentUser?.role === 'manager';
	}

	function canDeleteUser(user: User): boolean {
		if (currentUser?.role !== 'admin') return false;
		return user.id !== currentUser.id;
	}

	function getEditableRoles(): { value: string; label: string }[] {
		if (currentUser?.role === 'admin') {
			return roleOptions.filter((r) => r.value !== '');
		}
		if (currentUser?.role === 'manager') {
			return roleOptions.filter((r) => r.value === 'cleaner' || r.value === 'viewer');
		}
		return [];
	}

	async function handleFormSubmit() {
		formLoading = true;
		formError = '';
		try {
			const input: any = {
				realName: formRealName,
				role: formRole as any
			};
			if (formEmail) input.email = formEmail;
			if (formPhone) input.phone = formPhone;

			if (formMode === 'create') {
				input.username = formUsername;
				input.password = formPassword;
				await trpc().user.create.mutate(input);
			} else {
				input.id = formId;
				if (formPassword) input.password = formPassword;
				if (formEmail === '') input.email = null;
				if (formPhone === '') input.phone = null;
				await trpc().user.update.mutate(input);
			}
			formModal = false;
			await loadList();
		} catch (e: any) {
			formError = e?.message || '操作失败';
		} finally {
			formLoading = false;
		}
	}

	function openDelete(user: User) {
		deleteId = user.id;
		deleteName = user.realName || user.username;
		deleteModal = true;
	}

	async function handleDelete() {
		deleteLoading = true;
		try {
			await trpc().user.remove.mutate({ id: deleteId });
			deleteModal = false;
			await loadList();
		} catch (e: any) {
			alert(e?.message || '删除失败');
		} finally {
			deleteLoading = false;
		}
	}

	function isFormValid(): boolean {
		if (!formRealName.trim()) return false;
		if (formMode === 'create') {
			if (!formUsername.trim()) return false;
			if (!formPassword || formPassword.length < 6) return false;
		}
		if (formMode === 'edit' && formPassword && formPassword.length < 6) return false;
		if (!formRole) return false;
		return true;
	}
</script>

<div class="p-8">
	<div class="mb-6 flex justify-between items-center">
		<div>
			<h1 class="text-2xl font-bold text-gray-900">人员管理</h1>
			<p class="text-gray-500 mt-1">管理系统用户、角色和权限</p>
		</div>
		{#if canCreateUser()}
			<button class="btn-primary" on:click={openCreate}>+ 添加用户</button>
		{/if}
	</div>

	<div class="card mb-6">
		<div class="card-body">
			<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
				<div>
					<label class="label">搜索</label>
					<input
						type="text"
						class="input"
						bind:value={searchQuery}
						placeholder="搜索用户名..."
						on:keydown={(e) => e.key === 'Enter' && handleSearch()}
					/>
				</div>
				<div>
					<label class="label">角色</label>
					<select class="input" bind:value={filterRole}>
						{#each roleOptions as r}
							<option value={r.value}>{r.label}</option>
						{/each}
					</select>
				</div>
				<div class="flex items-end gap-2">
					<button class="btn-secondary flex-1" on:click={handleReset}>重置</button>
					<button class="btn-primary flex-1" on:click={handleSearch}>搜索</button>
				</div>
			</div>
		</div>
	</div>

	<div class="card">
		<div class="overflow-x-auto">
			<table class="table">
				<thead>
					<tr>
						<th>用户</th>
						<th>用户名</th>
						<th>角色</th>
						<th>邮箱</th>
						<th>电话</th>
						<th>创建时间</th>
						<th>操作</th>
					</tr>
				</thead>
				<tbody>
					{#if loading}
						<tr>
							<td colspan="7" class="text-center py-12 text-gray-400">加载中...</td>
						</tr>
					{:else if listData?.items.length === 0}
						<tr>
							<td colspan="7" class="text-center py-12 text-gray-400">暂无用户</td>
						</tr>
					{:else}
						{#each listData?.items || [] as user}
							<tr>
								<td>
									<div class="flex items-center gap-3">
										<div class="w-9 h-9 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-semibold text-sm">
											{user.realName?.charAt(0) || user.username?.charAt(0)}
										</div>
										<div>
											<div class="font-medium">{user.realName}</div>
											<div class="text-xs text-gray-400">
												{user.id === currentUser?.id ? '当前用户' : ''}
											</div>
										</div>
									</div>
								</td>
								<td class="text-gray-600">{user.username}</td>
								<td>
									<span class="badge {roleBadgeColor[user.role] || 'badge-gray'}">
										{getRoleLabel(user.role)}
									</span>
								</td>
								<td class="text-gray-600">{user.email || '<span class="text-gray-400">- '}</td>
								<td class="text-gray-600">{user.phone || '<span class="text-gray-400">- '}</td>
								<td class="text-gray-500">{formatDateTime(user.createdAt)}</td>
								<td>
									<div class="flex gap-1">
										{#if canEditUser(user)}
											<button class="btn-secondary text-xs !px-2 !py-1" on:click={() => openEdit(user)}>
												编辑
											</button>
										{/if}
										{#if canDeleteUser(user)}
											<button
												class="text-xs !px-2 !py-1 btn bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
												on:click={() => openDelete(user)}
											>
												删除
											</button>
										{/if}
									</div>
								</td>
							</tr>
						{/each}
					{/if}
				</tbody>
			</table>
		</div>
		{#if listData && listData.totalPages > 1}
			<div class="card-body border-t border-gray-200 flex items-center justify-between">
				<div class="text-sm text-gray-500">
					共 {listData.total} 条，第 {listData.page} / {listData.totalPages} 页
				</div>
				<div class="flex gap-2">
					<button
						class="btn-secondary"
						disabled={listData.page <= 1}
						on:click={() => {
							currentPage = listData.page - 1;
							loadList();
						}}
					>
						上一页
					</button>
					<button
						class="btn-secondary"
						disabled={listData.page >= listData.totalPages}
						on:click={() => {
							currentPage = listData.page + 1;
							loadList();
						}}
					>
						下一页
					</button>
				</div>
			</div>
		{/if}
	</div>

	<div class="mt-8">
		<h2 class="text-lg font-semibold mb-4">角色说明</h2>
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
			<div class="card card-body">
				<div class="flex items-center gap-2 mb-2">
					<span class="badge badge-danger">系统管理员</span>
				</div>
				<p class="text-sm text-gray-600">
					拥有系统全部权限，包括用户管理、房源管理、任务管理、数据报表、系统配置等所有功能。
				</p>
			</div>
			<div class="card card-body">
				<div class="flex items-center gap-2 mb-2">
					<span class="badge badge-warning">运营经理</span>
				</div>
				<p class="text-sm text-gray-600">
					负责日常运营管理，可创建/编辑任务、管理房源、处理客诉异常，但不可删除系统管理员。
				</p>
			</div>
			<div class="card card-body">
				<div class="flex items-center gap-2 mb-2">
					<span class="badge badge-info">保洁员</span>
				</div>
				<p class="text-sm text-gray-600">
					仅可查看自己被分配的保洁任务，进行接单、开始作业、完成作业等状态流转操作。
				</p>
			</div>
			<div class="card card-body">
				<div class="flex items-center gap-2 mb-2">
					<span class="badge badge-gray">查看者</span>
				</div>
				<p class="text-sm text-gray-600">
					只读权限，可查看任务列表、房源信息、报表数据等，不可进行任何修改操作。
				</p>
			</div>
		</div>
	</div>
</div>

{#if formModal}
	<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" on:click|self={() => (formModal = false)}>
		<div class="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
			<div class="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
				<h2 class="text-lg font-semibold">{formMode === 'create' ? '添加用户' : '编辑用户'}</h2>
				<button class="text-gray-400 hover:text-gray-600 text-xl" on:click={() => (formModal = false)}>×</button>
			</div>
			<div class="flex-1 overflow-y-auto p-6 space-y-4">
				{#if formError}
					<div class="bg-red-50 text-red-600 rounded-lg p-3 text-sm">{formError}</div>
				{/if}
				<div>
					<label class="label">用户名 {#if formMode === 'create'}<span class="text-red-500">*</span>{/if}</label>
					<input
						type="text"
						class="input"
						bind:value={formUsername}
						{formMode === 'edit' ? 'disabled'}
						placeholder="请输入登录用户名"
					/>
					{#if formMode === 'edit'}
						<p class="text-xs text-gray-400 mt-1">用户名不可修改</p>
					{/if}
				</div>
				<div>
					<label class="label">姓名 <span class="text-red-500">*</span></label>
					<input type="text" class="input" bind:value={formRealName} placeholder="请输入真实姓名" />
				</div>
				<div>
					<label class="label">角色 <span class="text-red-500">*</span></label>
					<select class="input" bind:value={formRole}>
						{#each getEditableRoles() as r}
							<option value={r.value}>{r.label}</option>
						{/each}
					</select>
				</div>
				<div>
					<label class="label">邮箱</label>
					<input type="email" class="input" bind:value={formEmail} placeholder="请输入邮箱（可选）" />
				</div>
				<div>
					<label class="label">电话</label>
					<input type="tel" class="input" bind:value={formPhone} placeholder="请输入电话（可选）" />
				</div>
				<div>
					<label class="label">
						密码
						{#if formMode === 'create'}
							<span class="text-red-500">*</span>
						{:else}
							<span class="text-gray-400 font-normal">（留空则不修改）</span>
						{/if}
					</label>
					<input
						type="password"
						class="input"
						bind:value={formPassword}
						placeholder={formMode === 'create' ? '至少 6 位' : '输入新密码，至少 6 位'}
					/>
				</div>
			</div>
			<div class="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
				<button class="btn-secondary" on:click={() => (formModal = false)} disabled={formLoading}>取消</button>
				<button class="btn-primary" on:click={handleFormSubmit} disabled={formLoading || !isFormValid()}>
					{formLoading ? '提交中...' : formMode === 'create' ? '创建' : '保存'}
				</button>
			</div>
		</div>
	</div>
{/if}

{#if deleteModal}
	<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" on:click|self={() => (deleteModal = false)}>
		<div class="bg-white rounded-lg shadow-xl w-full max-w-md">
			<div class="px-6 py-4 border-b border-gray-200">
				<h2 class="text-lg font-semibold">确认删除</h2>
			</div>
			<div class="p-6">
				<p class="text-gray-600">
					确定要删除用户 <span class="font-semibold text-red-600">{deleteName}</span> 吗？
				</p>
				<p class="text-sm text-gray-500 mt-2">此操作不可撤销，删除后该用户将无法登录系统。</p>
			</div>
			<div class="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
				<button class="btn-secondary" on:click={() => (deleteModal = false)} disabled={deleteLoading}>取消</button>
				<button class="btn-danger" on:click={handleDelete} disabled={deleteLoading}>
					{deleteLoading ? '删除中...' : '确认删除'}
				</button>
			</div>
		</div>
	</div>
{/if}

<script lang="ts" context="module">
</script>
