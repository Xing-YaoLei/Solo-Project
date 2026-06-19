<script lang="ts">
	import { trpc } from '$lib/trpc';
	import { goto } from '$app/navigation';

	let username = '';
	let password = '';
	let error = '';
	let loading = false;

	async function handleLogin(e: Event) {
		e.preventDefault();
		error = '';
		loading = true;
		try {
			await trpc().user.login.mutate({ username, password });
			await goto('/');
		} catch (e: any) {
			error = e?.message || '登录失败，请检查用户名和密码';
		} finally {
			loading = false;
		}
	}
</script>

<div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 to-brand-100">
	<div class="max-w-md w-full mx-4">
		<div class="text-center mb-8">
			<div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-600 text-white text-3xl mb-4">
				🏡
			</div>
			<h1 class="text-3xl font-bold text-gray-900">民宿保洁排班协同台</h1>
			<p class="text-gray-600 mt-2">高效协同 · 透明追溯 · 品质保障</p>
		</div>

		<form on:submit={handleLogin} class="bg-white rounded-2xl shadow-xl p-8">
			{#if error}
				<div class="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
					{error}
				</div>
			{/if}

			<div class="space-y-5">
				<div>
					<label for="username" class="label">用户名</label>
					<input
						id="username"
						type="text"
						bind:value={username}
						class="input"
						placeholder="请输入用户名"
						required
					/>
				</div>
				<div>
					<label for="password" class="label">密码</label>
					<input
						id="password"
						type="password"
						bind:value={password}
						class="input"
						placeholder="请输入密码"
						required
					/>
				</div>
			</div>

			<button
				type="submit"
				disabled={loading}
				class="btn-primary w-full mt-6 disabled:opacity-50"
			>
				{loading ? '登录中...' : '登 录'}
			</button>

			<div class="mt-6 pt-6 border-t border-gray-100">
				<p class="text-xs text-gray-500 mb-3">演示账号（密码均为 123456）：</p>
				<div class="grid grid-cols-2 gap-2 text-xs">
					<button type="button" on:click={() => { username = 'admin'; password = '123456'; }}
						class="p-2 rounded border border-gray-200 hover:bg-gray-50 text-left">
						<div class="font-medium text-gray-800">admin</div>
						<div class="text-gray-500">系统管理员</div>
					</button>
					<button type="button" on:click={() => { username = 'manager'; password = '123456'; }}
						class="p-2 rounded border border-gray-200 hover:bg-gray-50 text-left">
						<div class="font-medium text-gray-800">manager</div>
						<div class="text-gray-500">运营经理</div>
					</button>
					<button type="button" on:click={() => { username = 'cleaner1'; password = '123456'; }}
						class="p-2 rounded border border-gray-200 hover:bg-gray-50 text-left">
						<div class="font-medium text-gray-800">cleaner1</div>
						<div class="text-gray-500">张阿姨</div>
					</button>
					<button type="button" on:click={() => { username = 'viewer'; password = '123456'; }}
						class="p-2 rounded border border-gray-200 hover:bg-gray-50 text-left">
						<div class="font-medium text-gray-800">viewer</div>
						<div class="text-gray-500">只读查看</div>
					</button>
				</div>
			</div>
		</form>

		<p class="text-center text-xs text-gray-400 mt-6">
			© 2026 民宿保洁排班协同台 · 全流程可追溯
		</p>
	</div>
</div>

<script lang="ts" context="module">
	export const ssr = false;
</script>
