<script lang="ts">
	import { trpc } from '$lib/client/trpc';
	import type { PageData } from './$types';
	import { invalidateAll } from '$app/navigation';

	let { data }: { data: PageData } = $props();

	let selectedRoleId = $state<string | null>(null);
	let selectedPermissions = $state<string[]>([]);
	let saving = $state(false);

	const permissionCategories = [
		{ key: 'complaint', label: '投诉管理' },
		{ key: 'user', label: '用户管理' },
		{ key: 'role', label: '角色管理' },
		{ key: 'tag', label: '标签管理' },
		{ key: 'dashboard', label: '工作台' },
		{ key: 'report', label: '报表管理' },
		{ key: 'system', label: '系统设置' }
	];

	function getPermissionsByRole(roleId: string): string[] {
		const role = data.roles.find((r) => r.id === roleId);
		if (!role) return [];
		return (role.permissions as any[])?.map((p: any) => p.permissionCode) ?? [];
	}

	function getAllPermissionsByCategory(category: string): any[] {
		const allPerms: any[] = [];
		for (const role of data.roles) {
			for (const perm of (role.permissions as any[]) ?? []) {
				if (perm.permissionCategory === category && !allPerms.find((p) => p.permissionCode === perm.permissionCode)) {
					allPerms.push(perm);
				}
			}
		}
		return allPerms.sort((a, b) => a.permissionCode.localeCompare(b.permissionCode));
	}

	function selectRole(roleId: string) {
		selectedRoleId = roleId;
		selectedPermissions = getPermissionsByRole(roleId);
	}

	function togglePermission(code: string) {
		if (selectedPermissions.includes(code)) {
			selectedPermissions = selectedPermissions.filter((p) => p !== code);
		} else {
			selectedPermissions = [...selectedPermissions, code];
		}
	}

	async function savePermissions() {
		if (!selectedRoleId) return;
		saving = true;
		try {
			await trpc.role.updatePermissions.mutate({
				roleId: selectedRoleId,
				permissionCodes: selectedPermissions
			});
			await invalidateAll();
		} catch (e: any) {
			alert(e?.message || '保存失败');
		} finally {
			saving = false;
		}
	}

	function getAllPermissions() {
		const map = new Map<string, any>();
		for (const role of data.roles) {
			for (const perm of (role.permissions as any[]) ?? []) {
				if (!map.has(perm.permissionCode)) {
					map.set(perm.permissionCode, perm);
				}
			}
		}
		return Array.from(map.values());
	}
</script>

<svelte:head>
	<title>角色管理 - 景区投诉协同台</title>
</svelte:head>

<div class="space-y-4">
	<div class="flex items-center justify-between">
		<h1 class="text-2xl font-bold text-slate-800">角色管理</h1>
	</div>

	<div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
		<div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
			<div class="px-4 py-3 border-b border-slate-200 bg-slate-50">
				<h3 class="text-sm font-semibold text-slate-800">角色列表</h3>
			</div>
			<div class="p-2">
				{#each data.roles as role}
					<button
						onclick={() => selectRole(role.id)}
						class="w-full text-left px-3 py-2.5 rounded-lg mb-1 transition {selectedRoleId === role.id
							? 'bg-primary-50 text-primary-700'
							: 'text-slate-700 hover:bg-slate-50'}"
					>
						<div class="font-medium text-sm">{role.label}</div>
						<div class="text-xs text-slate-400 mt-0.5">
							{(role.permissions as any[])?.length ?? 0} 个权限
						</div>
					</button>
				{/each}
			</div>
		</div>

		<div class="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
			<div class="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
				<h3 class="text-sm font-semibold text-slate-800">
					{#if selectedRoleId}
						{data.roles.find((r) => r.id === selectedRoleId)?.label} - 权限配置
					{:else}
						请选择角色
					{/if}
				</h3>
				{#if selectedRoleId}
					<button
						onclick={savePermissions}
						disabled={saving}
						class="px-3 py-1.5 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 transition disabled:opacity-50"
					>
						{saving ? '保存中...' : '保存配置'}
					</button>
				{/if}
			</div>

			{#if !selectedRoleId}
				<div class="text-center py-16 text-slate-400 text-sm">
					请从左侧选择一个角色进行权限配置
				</div>
			{:else}
				<div class="p-4 space-y-5 max-h-[600px] overflow-y-auto">
					{#each permissionCategories as cat}
						{@const perms = getAllPermissions().filter((p) => p.permissionCategory === cat.key)}
						{#if perms.length > 0}
							<div>
								<h4 class="text-sm font-medium text-slate-700 mb-2">{cat.label}</h4>
								<div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
									{#each perms as perm}
										<label class="flex items-start gap-2 p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition">
											<input
												type="checkbox"
												checked={selectedPermissions.includes(perm.permissionCode)}
												onchange={() => togglePermission(perm.permissionCode)}
												class="w-4 h-4 mt-0.5 text-primary-600 rounded"
											/>
											<div>
												<p class="text-sm text-slate-800">{perm.permissionLabel}</p>
												<p class="text-xs text-slate-400">{perm.permissionCode}</p>
											</div>
										</label>
									{/each}
								</div>
							</div>
						{/if}
					{/each}
				</div>
			{/if}
		</div>
	</div>
</div>
