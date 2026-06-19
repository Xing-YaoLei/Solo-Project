<script lang="ts">
	import { trpc } from '$lib/client/trpc';
	import type { PageData } from './$types';
	import { invalidateAll } from '$app/navigation';

	let { data }: { data: PageData } = $props();

	let showCreateModal = $state(false);
	let showEditModal = $state(false);
	let editingUser = $state<{ id: string; displayName: string; phone: string | null; roleId: string } | null>(null);

	let newUsername = $state('');
	let newPassword = $state('');
	let newDisplayName = $state('');
	let newPhone = $state('');
	let newRoleId = $state('');
	let submitting = $state(false);

	let editDisplayName = $state('');
	let editPhone = $state('');
	let editRoleId = $state('');

	function formatDate(date: string | Date | null): string {
		if (!date) return '-';
		return new Date(date).toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' });
	}

	async function handleCreate() {
		if (!newUsername || !newPassword || !newDisplayName || !newRoleId) return;
		submitting = true;
		try {
			await trpc.user.create.mutate({
				username: newUsername,
				password: newPassword,
				displayName: newDisplayName,
				phone: newPhone || undefined,
				roleId: newRoleId
			});
			showCreateModal = false;
			newUsername = '';
			newPassword = '';
			newDisplayName = '';
			newPhone = '';
			newRoleId = '';
			await invalidateAll();
		} catch (e: any) {
			alert(e?.message || '创建失败');
		} finally {
			submitting = false;
		}
	}

	function openEditModal(user: any) {
		editingUser = user;
		editDisplayName = user.displayName;
		editPhone = user.phone ?? '';
		editRoleId = user.roleId;
		showEditModal = true;
	}

	async function handleEdit() {
		if (!editingUser) return;
		submitting = true;
		try {
			await trpc.user.update.mutate({
				id: editingUser.id,
				displayName: editDisplayName,
				phone: editPhone || undefined,
				roleId: editRoleId
			});
			showEditModal = false;
			editingUser = null;
			await invalidateAll();
		} catch (e: any) {
			alert(e?.message || '更新失败');
		} finally {
			submitting = false;
		}
	}

	async function handleDelete(userId: string) {
		if (!confirm('确认删除该用户？此操作不可恢复。')) return;
		try {
			await trpc.user.delete.mutate({ id: userId });
			await invalidateAll();
		} catch (e: any) {
			alert(e?.message || '删除失败');
		}
	}

	const roleLabels: Record<string, string> = {
		visitor: '游客',
		ticket_agent: '票务员',
		patrol_agent: '巡场员',
		operator: '运营'
	};
</script>

<svelte:head>
	<title>用户管理 - 景区投诉协同台</title>
</svelte:head>

<div class="space-y-4">
	<div class="flex items-center justify-between">
		<h1 class="text-2xl font-bold text-slate-800">用户管理</h1>
		<button
			onclick={() => showCreateModal = true}
			class="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition"
		>
			<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
				<path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
			</svg>
			添加用户
		</button>
	</div>

	<div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
		<div class="overflow-x-auto">
			<table class="w-full text-sm">
				<thead>
					<tr class="bg-slate-50 border-b border-slate-200">
						<th class="text-left px-4 py-3 text-slate-600 font-semibold">用户</th>
						<th class="text-left px-4 py-3 text-slate-600 font-semibold">用户名</th>
						<th class="text-left px-4 py-3 text-slate-600 font-semibold">手机号</th>
						<th class="text-left px-4 py-3 text-slate-600 font-semibold">角色</th>
						<th class="text-left px-4 py-3 text-slate-600 font-semibold">创建时间</th>
						<th class="text-right px-4 py-3 text-slate-600 font-semibold">操作</th>
					</tr>
				</thead>
				<tbody>
					{#each data.users as user}
						<tr class="border-b border-slate-100 hover:bg-slate-50 transition">
							<td class="px-4 py-3">
								<div class="flex items-center gap-3">
									<div class="w-8 h-8 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-sm font-medium">
										{user.displayName[0]}
									</div>
									<span class="text-slate-800 font-medium">{user.displayName}</span>
								</div>
							</td>
							<td class="px-4 py-3 text-slate-600">{user.username}</td>
							<td class="px-4 py-3 text-slate-600">{user.phone ?? '-'}</td>
							<td class="px-4 py-3">
								<span class="inline-block px-2.5 py-1 rounded-full text-xs bg-slate-100 text-slate-700">
									{user.roleLabel ?? roleLabels[user.roleName] ?? user.roleName}
								</span>
							</td>
							<td class="px-4 py-3 text-slate-500">{formatDate(user.createdAt)}</td>
							<td class="px-4 py-3 text-right">
								<div class="flex items-center justify-end gap-2">
									<button
										onclick={() => openEditModal(user)}
										class="text-primary-600 hover:text-primary-700 text-sm transition"
									>
										编辑
									</button>
									<button
										onclick={() => handleDelete(user.id)}
										class="text-red-500 hover:text-red-600 text-sm transition"
									>
										删除
									</button>
								</div>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>
</div>

{#if showCreateModal}
	<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onclick={() => showCreateModal = false}>
		<div class="bg-white rounded-xl p-6 w-full max-w-md mx-4 animate-fade-in" onclick={(e) => e.stopPropagation()}>
			<h3 class="text-lg font-semibold text-slate-800 mb-4">添加用户</h3>
			<div class="space-y-4">
				<div>
					<label class="block text-sm font-medium text-slate-700 mb-1">用户名</label>
					<input
						type="text"
						bind:value={newUsername}
						class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
						placeholder="请输入用户名"
					/>
				</div>
				<div>
					<label class="block text-sm font-medium text-slate-700 mb-1">密码</label>
					<input
						type="password"
						bind:value={newPassword}
						class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
						placeholder="请输入密码"
					/>
				</div>
				<div>
					<label class="block text-sm font-medium text-slate-700 mb-1">显示名称</label>
					<input
						type="text"
						bind:value={newDisplayName}
						class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
						placeholder="请输入显示名称"
					/>
				</div>
				<div>
					<label class="block text-sm font-medium text-slate-700 mb-1">手机号</label>
					<input
						type="text"
						bind:value={newPhone}
						class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
						placeholder="请输入手机号（可选）"
					/>
				</div>
				<div>
					<label class="block text-sm font-medium text-slate-700 mb-1">角色</label>
					<select
						bind:value={newRoleId}
						class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
					>
						<option value="">请选择角色</option>
						{#each data.roles as role}
							<option value={role.id}>{role.label}</option>
						{/each}
					</select>
				</div>
				<div class="flex justify-end gap-3 pt-2">
					<button onclick={() => showCreateModal = false} class="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 transition">
						取消
					</button>
					<button
						onclick={handleCreate}
						disabled={submitting || !newUsername || !newPassword || !newDisplayName || !newRoleId}
						class="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition disabled:opacity-50"
					>
						创建
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}

{#if showEditModal && editingUser}
	<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onclick={() => showEditModal = false}>
		<div class="bg-white rounded-xl p-6 w-full max-w-md mx-4 animate-fade-in" onclick={(e) => e.stopPropagation()}>
			<h3 class="text-lg font-semibold text-slate-800 mb-4">编辑用户</h3>
			<div class="space-y-4">
				<div>
					<label class="block text-sm font-medium text-slate-700 mb-1">显示名称</label>
					<input
						type="text"
						bind:value={editDisplayName}
						class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
					/>
				</div>
				<div>
					<label class="block text-sm font-medium text-slate-700 mb-1">手机号</label>
					<input
						type="text"
						bind:value={editPhone}
						class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
					/>
				</div>
				<div>
					<label class="block text-sm font-medium text-slate-700 mb-1">角色</label>
					<select
						bind:value={editRoleId}
						class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
					>
						{#each data.roles as role}
							<option value={role.id}>{role.label}</option>
						{/each}
					</select>
				</div>
				<div class="flex justify-end gap-3 pt-2">
					<button onclick={() => showEditModal = false} class="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 transition">
						取消
					</button>
					<button
						onclick={handleEdit}
						disabled={submitting}
						class="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition disabled:opacity-50"
					>
						保存
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}
