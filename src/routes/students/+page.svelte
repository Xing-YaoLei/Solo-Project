<script lang="ts">
	import AppLayout from '$lib/components/AppLayout.svelte';
	import { createQuery, createMutation } from '$lib/trpc/query';

	let searchKeyword = '';
	let roleFilter = '';
	let statusFilter = '';
	let currentPage = 1;
	let showCreateModal = false;
	let showDetailModal = false;
	let selectedUser: any = null;

	let newUser = {
		email: '',
		name: '',
		password: '',
		role: 'student',
		phone: ''
	};

	$: queryInput = {
		page: currentPage,
		pageSize: 10,
		role: roleFilter || undefined,
		keyword: searchKeyword || undefined,
		isActive: statusFilter === 'active' ? true : statusFilter === 'inactive' ? false : undefined
	};

	const usersQuery = createQuery<any, any>('users.list', () => queryInput);
	const rolesQuery = createQuery<void, any[]>('users.listRoles', () => ({} as any));
	const createUserMutation = createMutation<any, any>('users.create');
	const updateUserMutation = createMutation<any, any>('users.update');

	$: usersData = $usersQuery.data;
	$: roles = $rolesQuery.data || [];

	function getRoleLabel(role: string) {
		const labels: Record<string, string> = {
			student: '学员',
			assistant: '助教',
			lecturer: '讲师',
			admin: '教务'
		};
		return labels[role] || role;
	}

	function getRoleBadgeClass(role: string) {
		switch (role) {
			case 'student':
				return 'badge-blue';
			case 'assistant':
				return 'badge-green';
			case 'lecturer':
				return 'badge-purple';
			case 'admin':
				return 'badge-orange';
			default:
				return 'badge-gray';
		}
	}

	function formatDate(date: any) {
		if (!date) return '-';
		return new Date(date).toLocaleDateString('zh-CN');
	}

	async function handleCreateUser() {
		try {
			await createUserMutation.mutate(newUser);
			showCreateModal = false;
			newUser = {
				email: '',
				name: '',
				password: '',
				role: 'student',
				phone: ''
			};
			usersQuery.refetch();
		} catch (err: any) {
			alert(err.message || '创建失败');
		}
	}

	async function toggleUserStatus(user: any) {
		if (!confirm(`确定要${user.isActive ? '禁用' : '启用'}该用户吗？`)) return;

		try {
			await updateUserMutation.mutate({
				id: user.id,
				isActive: !user.isActive
			});
			usersQuery.refetch();
		} catch (err: any) {
			alert(err.message || '操作失败');
		}
	}

	function viewUserDetail(user: any) {
		selectedUser = user;
		showDetailModal = true;
	}
</script>

<svelte:head>
	<title>学员管理 - 职业教育证书考试协同平台</title>
</svelte:head>

<AppLayout>
	<svelte:fragment slot="title">学员管理</svelte:fragment>

	<div class="space-y-6">
		<div class="card">
			<div class="p-6 border-b border-gray-200">
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-4">
						<input
							type="text"
							bind:value={searchKeyword}
							placeholder="搜索姓名、邮箱"
							class="input w-64"
							on:keydown={(e) => {
								if (e.key === 'Enter') {
									currentPage = 1;
									usersQuery.refetch();
								}
							}}
						/>
						<select
							bind:value={roleFilter}
							class="input w-32"
							on:change={() => {
								currentPage = 1;
								usersQuery.refetch();
							}}
						>
							<option value="">全部角色</option>
							<option value="student">学员</option>
							<option value="assistant">助教</option>
							<option value="lecturer">讲师</option>
							<option value="admin">教务</option>
						</select>
						<select
							bind:value={statusFilter}
							class="input w-32"
							on:change={() => {
								currentPage = 1;
								usersQuery.refetch();
							}}
						>
							<option value="">全部状态</option>
							<option value="active">启用</option>
							<option value="inactive">禁用</option>
						</select>
						<button
							on:click={() => {
								currentPage = 1;
								usersQuery.refetch();
							}}
							class="btn btn-primary"
						>
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
							</svg>
							搜索
						</button>
					</div>
					<div class="flex items-center gap-2">
						<button class="btn btn-outline">
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
							</svg>
							导出
						</button>
						<button
							on:click={() => (showCreateModal = true)}
							class="btn btn-primary"
						>
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
							</svg>
							添加用户
						</button>
					</div>
				</div>
			</div>

			<div class="table-wrapper">
				<table>
					<thead>
						<tr>
							<th>用户</th>
							<th>角色</th>
							<th>手机号</th>
							<th>状态</th>
							<th>创建时间</th>
							<th>操作</th>
						</tr>
					</thead>
					<tbody>
						{#if !usersData?.items?.length}
							<tr>
								<td colspan="6" class="text-center py-12 text-gray-500">
									<svg class="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
									</svg>
									<p>暂无用户数据</p>
								</td>
							</tr>
						{:else}
							{#each usersData.items as user}
								<tr>
									<td>
										<div class="flex items-center gap-3">
											<div class="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-medium">
												{user.name?.charAt(0) || 'U'}
											</div>
											<div>
												<p class="font-medium text-gray-900">{user.name}</p>
												<p class="text-sm text-gray-500">{user.email}</p>
											</div>
										</div>
									</td>
									<td>
										<span class="badge badge-{getRoleBadgeClass(user.roleCode)?.replace('badge-', '')}">
											{getRoleLabel(user.roleCode)}
										</span>
									</td>
									<td>{user.phone || '-'}</td>
									<td>
										<span class="badge {user.isActive ? 'badge-success' : 'badge-gray'}">
											{user.isActive ? '启用' : '禁用'}
										</span>
									</td>
									<td>{formatDate(user.createdAt)}</td>
									<td>
										<div class="flex items-center gap-2">
											<button
												on:click={() => viewUserDetail(user)}
												class="text-sm text-primary-600 hover:text-primary-700"
											>
												详情
											</button>
											<button
												on:click={() => toggleUserStatus(user)}
												class="text-sm {user.isActive ? 'text-yellow-600 hover:text-yellow-700' : 'text-green-600 hover:text-green-700'}"
											>
												{user.isActive ? '禁用' : '启用'}
											</button>
										</div>
									</td>
								</tr>
							{/each}
						{/if}
					</tbody>
				</table>
			</div>

			{#if usersData?.total > 0}
				<div class="flex items-center justify-between px-6 py-4 border-t border-gray-200">
					<p class="text-sm text-gray-500">
						共 {usersData.total} 条记录，第 {currentPage} / {Math.ceil(usersData.total / usersData.pageSize)} 页
					</p>
					<div class="flex items-center gap-2">
						<button
							on:click={() => {
								currentPage = Math.max(1, currentPage - 1);
								usersQuery.refetch();
							}}
							disabled={currentPage <= 1}
							class="btn btn-outline text-sm py-1 disabled:opacity-50 disabled:cursor-not-allowed"
						>
							上一页
						</button>
						<button
							on:click={() => {
								currentPage = currentPage + 1;
								usersQuery.refetch();
							}}
							disabled={currentPage >= Math.ceil(usersData.total / usersData.pageSize)}
							class="btn btn-outline text-sm py-1 disabled:opacity-50 disabled:cursor-not-allowed"
						>
							下一页
						</button>
					</div>
				</div>
			{/if}
		</div>
	</div>

	{#if showCreateModal}
		<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
			<div class="bg-white rounded-xl w-full max-w-md mx-4 shadow-xl">
				<div class="flex items-center justify-between p-6 border-b border-gray-200">
					<h3 class="text-lg font-semibold text-gray-900">添加用户</h3>
					<button
						on:click={() => (showCreateModal = false)}
						class="p-1 hover:bg-gray-100 rounded-lg transition-colors"
						aria-label="关闭"
					>
						<svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
						</svg>
					</button>
				</div>
				<div class="p-6 space-y-4">
					<div>
						<label class="label" for="userName">姓名</label>
						<input
							id="userName"
							type="text"
							bind:value={newUser.name}
							class="input"
							placeholder="请输入姓名"
						/>
					</div>
					<div>
						<label class="label" for="userEmail">邮箱</label>
						<input
							id="userEmail"
							type="email"
							bind:value={newUser.email}
							class="input"
							placeholder="请输入邮箱"
						/>
					</div>
					<div>
						<label class="label" for="userPassword">密码</label>
						<input
							id="userPassword"
							type="password"
							bind:value={newUser.password}
							class="input"
							placeholder="请输入密码"
						/>
					</div>
					<div>
						<label class="label" for="userPhone">手机号</label>
						<input
							id="userPhone"
							type="tel"
							bind:value={newUser.phone}
							class="input"
							placeholder="请输入手机号（选填）"
						/>
					</div>
					<div>
						<label class="label" for="userRole">角色</label>
						<select
							id="userRole"
							bind:value={newUser.role}
							class="input"
						>
							{#each roles as role}
								<option value={role.code}>{role.name}</option>
							{/each}
						</select>
					</div>
				</div>
				<div class="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
					<button
						on:click={() => (showCreateModal = false)}
						class="btn btn-outline"
					>
						取消
					</button>
					<button
						on:click={handleCreateUser}
						disabled={$createUserMutation.isLoading}
						class="btn btn-primary"
					>
						{$createUserMutation.isLoading ? '创建中...' : '创建'}
					</button>
				</div>
			</div>
		</div>
	{/if}

	{#if showDetailModal && selectedUser}
		<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
			<div class="bg-white rounded-xl w-full max-w-lg mx-4 shadow-xl">
				<div class="flex items-center justify-between p-6 border-b border-gray-200">
					<h3 class="text-lg font-semibold text-gray-900">用户详情</h3>
					<button
						on:click={() => (showDetailModal = false)}
						class="p-1 hover:bg-gray-100 rounded-lg transition-colors"
						aria-label="关闭"
					>
						<svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
						</svg>
					</button>
				</div>
				<div class="p-6">
					<div class="flex items-center gap-4 mb-6 pb-6 border-b border-gray-200">
						<div class="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-medium text-2xl">
							{selectedUser.name?.charAt(0) || 'U'}
						</div>
						<div>
							<h4 class="text-lg font-semibold text-gray-900">{selectedUser.name}</h4>
							<p class="text-sm text-gray-500">{selectedUser.email}</p>
							<div class="mt-2">
								<span class="badge badge-{getRoleBadgeClass(selectedUser.roleCode)?.replace('badge-', '')}">
									{getRoleLabel(selectedUser.roleCode)}
								</span>
								<span class="badge {selectedUser.isActive ? 'badge-success' : 'badge-gray'} ml-2">
									{selectedUser.isActive ? '启用' : '禁用'}
								</span>
							</div>
						</div>
					</div>
					<div class="space-y-4">
						<div class="flex items-center justify-between py-2">
							<span class="text-gray-500">手机号</span>
							<span class="text-gray-900">{selectedUser.phone || '-'}</span>
						</div>
						<div class="flex items-center justify-between py-2">
							<span class="text-gray-500">创建时间</span>
							<span class="text-gray-900">{formatDate(selectedUser.createdAt)}</span>
						</div>
					</div>
				</div>
				<div class="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
					<button
						on:click={() => (showDetailModal = false)}
						class="btn btn-outline"
					>
						关闭
					</button>
					<button
						on:click={() => {
							toggleUserStatus(selectedUser);
							selectedUser.isActive = !selectedUser.isActive;
						}}
						class="btn {selectedUser.isActive ? 'btn-secondary' : 'btn-primary'}"
					>
						{selectedUser.isActive ? '禁用' : '启用'}
					</button>
				</div>
			</div>
		</div>
	{/if}
</AppLayout>
