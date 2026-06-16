<script lang="ts">
	import { onMount } from 'svelte';
	import {
		Settings,
		Users,
		Search,
		Plus,
		X,
		Edit3,
		Shield,
		Mail,
		UserCheck,
		UserX,
		MoreHorizontal,
		Check,
		ChevronDown
	} from 'lucide-svelte';
	import { cn } from '$lib/utils/cn';
	import { formatDateTime, formatDate } from '$lib/utils/format';
	import StatusBadge from '$lib/components/StatusBadge.svelte';
	import { createTRPCProxyClient } from '$lib/trpc/client';
	import { roleLabelMap } from '$lib/stores/auth';
	import type { User, UserRole } from '$shared/types';

	const trpc = createTRPCProxyClient();

	let loading = true;
	let users: User[] = [];
	let searchQuery = '';
	let roleFilter: UserRole | 'all' = 'all';
	let statusFilter: 'all' | 'active' | 'inactive' = 'all';

	let showAddModal = false;
	let newUserName = '';
	let newUserEmail = '';
	let newUserRole: UserRole = 'nurse';
	let submitting = false;
	let addError = '';

	let editingUserId: string | null = null;
	let editingRole: UserRole = 'nurse';
	let showRoleDropdown = false;

	const roles: UserRole[] = ['admin', 'supervisor', 'nurse', 'doctor', 'family'];

	async function loadUsers() {
		loading = true;
		try {
			const result = await trpc.user.list.query({
				page: 1,
				pageSize: 100
			});
			users = result.items;
		} catch (e) {
			console.error(e);
		} finally {
			loading = false;
		}
	}

	$: filteredUsers = users.filter((u) => {
		if (searchQuery.trim()) {
			const q = searchQuery.toLowerCase();
			if (!u.name.toLowerCase().includes(q) && !u.email.toLowerCase().includes(q)) {
				return false;
			}
		}
		if (roleFilter !== 'all' && u.role !== roleFilter) return false;
		if (statusFilter === 'active' && !u.isActive) return false;
		if (statusFilter === 'inactive' && u.isActive) return false;
		return true;
	});

	function openAddModal() {
		showAddModal = true;
		newUserName = '';
		newUserEmail = '';
		newUserRole = 'nurse';
		addError = '';
	}

	function closeAddModal() {
		showAddModal = false;
	}

	async function handleAddUser() {
		addError = '';
		if (!newUserName.trim() || !newUserEmail.trim()) {
			addError = '请填写姓名和邮箱';
			return;
		}
		submitting = true;
		try {
			await trpc.user.create.mutate({
				name: newUserName.trim(),
				email: newUserEmail.trim(),
				role: newUserRole
			});
			closeAddModal();
			await loadUsers();
		} catch (e) {
			addError = e instanceof Error ? e.message : '创建失败';
		} finally {
			submitting = false;
		}
	}

	function startEditRole(user: User) {
		editingUserId = user.id;
		editingRole = user.role;
		showRoleDropdown = true;
	}

	function cancelEditRole() {
		editingUserId = null;
		showRoleDropdown = false;
	}

	async function saveRole(user: User) {
		if (editingRole === user.role) {
			cancelEditRole();
			return;
		}
		try {
			await trpc.user.updateRole.mutate({
				id: user.id,
				role: editingRole
			});
			await loadUsers();
		} catch (e) {
			console.error(e);
		}
		cancelEditRole();
	}

	async function toggleUserActive(user: User) {
		try {
			await trpc.user.toggleActive.mutate(user.id);
			await loadUsers();
		} catch (e) {
			console.error(e);
		}
	}

	onMount(() => {
		loadUsers();
	});
</script>

<div class="space-y-6">
	<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
		<div>
			<h1 class="text-2xl font-serif font-bold text-gray-800">系统设置</h1>
			<p class="text-sm text-gray-500 mt-1">管理系统用户与角色权限</p>
		</div>
		<button type="button" on:click={openAddModal} class="btn-accent">
			<Plus class="w-5 h-5" />
			<span>新增用户</span>
		</button>
	</div>

	<div class="grid gap-6 lg:grid-cols-4">
		<div class="card p-5 lg:col-span-1">
			<div class="flex items-center gap-2 mb-4">
				<div class="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center">
					<Users class="w-5 h-5 text-primary-600" />
				</div>
				<div>
					<h2 class="text-base font-semibold text-gray-800">用户概览</h2>
					<p class="text-xs text-gray-500">共 {users.length} 位用户</p>
				</div>
			</div>

			<div class="space-y-3">
				{#each roles as role}
					{@const count = users.filter((u) => u.role === role).length}
					<div class="flex items-center justify-between p-2.5 rounded-xl bg-gray-50">
						<span class="text-sm text-gray-600">{roleLabelMap[role]}</span>
						<span class="text-sm font-semibold text-gray-800">{count}</span>
					</div>
				{/each}
			</div>
		</div>

		<div class="card p-5 lg:col-span-3">
			<div class="flex flex-col md:flex-row md:items-center gap-3 mb-5">
				<div class="relative flex-1">
					<Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
					<input
						type="text"
						bind:value={searchQuery}
						placeholder="搜索姓名或邮箱..."
						class="input pl-9"
					/>
				</div>
				<div class="flex items-center gap-2">
					<select
						bind:value={roleFilter}
						class="input !py-2 !px-3 text-sm w-auto"
					>
						<option value="all">全部角色</option>
						{#each roles as role}
							<option value={role}>{roleLabelMap[role]}</option>
						{/each}
					</select>
					<select
						bind:value={statusFilter}
						class="input !py-2 !px-3 text-sm w-auto"
					>
						<option value="all">全部状态</option>
						<option value="active">在职</option>
						<option value="inactive">已停用</option>
					</select>
				</div>
			</div>

			{#if loading}
				<div class="py-12 flex flex-col items-center justify-center text-gray-400">
					<div class="w-8 h-8 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin mb-3" />
					<p class="text-sm">加载中...</p>
				</div>
			{:else if filteredUsers.length === 0}
				<div class="py-12 flex flex-col items-center justify-center text-gray-400">
					<Users class="w-10 h-10 mb-2 opacity-50" />
					<p class="text-sm">暂无匹配的用户</p>
				</div>
			{:else}
				<div class="overflow-x-auto -mx-5">
					<table class="w-full min-w-[600px]">
						<thead>
							<tr class="border-b border-gray-100">
								<th class="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">
									用户
								</th>
								<th class="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">
									角色
								</th>
								<th class="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">
									状态
								</th>
								<th class="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">
									创建时间
								</th>
								<th class="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">
									操作
								</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-gray-50">
							{#each filteredUsers as user}
								<tr class="hover:bg-gray-50/50 transition-colors">
									<td class="px-5 py-4">
										<div class="flex items-center gap-3">
											<div class={cn(
												'w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0',
												user.isActive
													? 'bg-primary-100 text-primary-700'
													: 'bg-gray-100 text-gray-400'
											)}>
												<span class="text-sm font-medium">{user.name.charAt(0)}</span>
											</div>
											<div class="min-w-0">
												<p class={cn(
													'text-sm font-medium truncate',
													user.isActive ? 'text-gray-800' : 'text-gray-400'
												)}>
													{user.name}
												</p>
												<p class="text-xs text-gray-500 truncate flex items-center gap-1">
													<Mail class="w-3 h-3 flex-shrink-0" />
													{user.email}
												</p>
											</div>
										</div>
									</td>
									<td class="px-5 py-4">
										{#if editingUserId === user.id}
											<div class="relative">
												<button
													type="button"
													on:click={() => (showRoleDropdown = !showRoleDropdown)}
													class={cn(
														'inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border text-sm',
														'border-primary-300 bg-primary-50 text-primary-700'
													)}
												>
													<Shield class="w-3.5 h-3.5" />
													{roleLabelMap[editingRole]}
													<ChevronDown class={cn('w-3.5 h-3.5 transition-transform', showRoleDropdown && 'rotate-180')} />
												</button>
												{#if showRoleDropdown}
													<div class="absolute left-0 top-full mt-1 z-10 card py-1 min-w-[140px] shadow-lg">
														{#each roles as role}
															<button
																type="button"
																on:click={() => (editingRole = role)}
																class={cn(
																	'w-full flex items-center justify-between px-3 py-2 text-sm text-left hover:bg-gray-50',
																	editingRole === role ? 'text-primary-700 bg-primary-50' : 'text-gray-700'
																)}
															>
																{roleLabelMap[role]}
																{#if editingRole === role}
																	<Check class="w-4 h-4" />
																{/if}
															</button>
														{/each}
													</div>
												{/if}
											</div>
										{:else}
											<span class={cn(
												'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border',
												user.role === 'admin'
													? 'bg-purple-50 text-purple-700 border-purple-200'
													: user.role === 'supervisor'
														? 'bg-amber-50 text-amber-700 border-amber-200'
														: user.role === 'nurse'
															? 'bg-primary-50 text-primary-700 border-primary-200'
															: user.role === 'doctor'
																? 'bg-mint-50 text-mint-700 border-mint-200'
																: 'bg-gray-50 text-gray-700 border-gray-200'
											)}>
												<Shield class="w-3 h-3" />
												{roleLabelMap[user.role]}
											</span>
										{/if}
									</td>
									<td class="px-5 py-4">
										<StatusBadge variant={user.isActive ? 'success' : 'muted'}>
											{user.isActive ? '在职' : '已停用'}
										</StatusBadge>
									</td>
									<td class="px-5 py-4 text-sm text-gray-500">
										{formatDate(user.createdAt)}
									</td>
									<td class="px-5 py-4">
										<div class="flex items-center justify-end gap-1">
											{#if editingUserId === user.id}
												<button
													type="button"
													on:click={() => saveRole(user)}
													class="p-2 rounded-lg text-green-600 hover:bg-green-50 transition-colors"
													title="保存"
												>
													<Check class="w-4 h-4" />
												</button>
												<button
													type="button"
													on:click={cancelEditRole}
													class="p-2 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"
													title="取消"
												>
													<X class="w-4 h-4" />
												</button>
											{:else}
												<button
													type="button"
													on:click={() => startEditRole(user)}
													class="p-2 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
													title="分配角色"
												>
													<Edit3 class="w-4 h-4" />
												</button>
												<button
													type="button"
													on:click={() => toggleUserActive(user)}
													class={cn(
														'p-2 rounded-lg transition-colors',
														user.isActive
															? 'text-gray-400 hover:text-danger-600 hover:bg-danger-50'
															: 'text-gray-400 hover:text-green-600 hover:bg-green-50'
													)}
													title={user.isActive ? '停用账号' : '启用账号'}
												>
													{#if user.isActive}
														<UserX class="w-4 h-4" />
													{:else}
														<UserCheck class="w-4 h-4" />
													{/if}
												</button>
											{/if}
										</div>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{/if}
		</div>
	</div>
</div>

{#if showAddModal}
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" on:click={closeAddModal}>
		<div class="card w-full max-w-md p-6" on:click={(e) => e.stopPropagation()}>
			<div class="flex items-center justify-between mb-6">
				<div class="flex items-center gap-3">
					<div class="w-10 h-10 rounded-xl bg-accent-50 flex items-center justify-center">
						<Plus class="w-5 h-5 text-accent-600" />
					</div>
					<div>
						<h3 class="text-lg font-semibold text-gray-800">新增用户</h3>
						<p class="text-sm text-gray-500">创建新的系统账号</p>
					</div>
				</div>
				<button type="button" on:click={closeAddModal} class="p-1 rounded-lg hover:bg-gray-100 text-gray-400">
					<X class="w-5 h-5" />
				</button>
			</div>

			{#if addError}
				<div class="mb-4 p-3 rounded-xl bg-danger-50 border border-danger-200 text-sm text-danger-700">
					{addError}
				</div>
			{/if}

			<form on:submit|preventDefault={handleAddUser} class="space-y-4">
				<div>
					<label class="label">姓名 <span class="text-danger-500">*</span></label>
					<input
						type="text"
						bind:value={newUserName}
						placeholder="请输入用户姓名"
						class="input"
						disabled={submitting}
						autofocus
					/>
				</div>

				<div>
					<label class="label">邮箱 <span class="text-danger-500">*</span></label>
					<input
						type="email"
						bind:value={newUserEmail}
						placeholder="请输入邮箱地址"
						class="input"
						disabled={submitting}
					/>
				</div>

				<div>
					<label class="label">角色</label>
					<select bind:value={newUserRole} class="input" disabled={submitting}>
						{#each roles as role}
							<option value={role}>{roleLabelMap[role]}</option>
						{/each}
					</select>
				</div>

				<div class="flex items-center justify-end gap-3 pt-2">
					<button type="button" on:click={closeAddModal} class="btn-secondary" disabled={submitting}>
						取消
					</button>
					<button type="submit" class="btn-accent" disabled={submitting}>
						{#if submitting}
							<div class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
							<span>创建中...</span>
						{:else}
							<span>创建用户</span>
						{/if}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}
