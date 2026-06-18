<script lang="ts">
	import { goto } from '$app/navigation';
	import { currentUser } from '$lib/stores/auth';

	let username = '';
	let password = '';
	let loading = false;
	let error = '';

	async function handleLogin() {
		if (!username || !password) {
			error = '请输入用户名和密码';
			return;
		}

		loading = true;
		error = '';

		try {
			const res = await fetch('/api/auth/login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ username, password })
			});

			const data = await res.json();
			if (!res.ok) throw new Error(data.error);

			currentUser.set(data.user);
			await goto('/dashboard');
		} catch (e) {
			error = (e as Error).message;
		} finally {
			loading = false;
		}
	}
</script>

<div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-navy-950 via-navy-900 to-navy-950 relative overflow-hidden">
	<div class="absolute inset-0 overflow-hidden">
		<div class="absolute -top-40 -right-40 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
		<div class="absolute -bottom-40 -left-40 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
	</div>

	<div class="relative z-10 w-full max-w-md mx-4">
		<div class="text-center mb-10 animate-fade-in">
			<div class="inline-flex w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-400 to-cyan-600 items-center justify-center mb-5 shadow-lg shadow-cyan-500/30">
				<svg viewBox="0 0 24 24" fill="none" class="w-8 h-8 text-navy-950" stroke="currentColor" stroke-width="2.5">
					<path stroke-linecap="round" stroke-linejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
				</svg>
			</div>
			<h1 class="text-2xl font-bold text-white mb-2">二手车试驾预约漏斗报表</h1>
			<p class="text-navy-400 text-sm">追踪试驾预约全流程转化</p>
		</div>

		<div class="card p-8 animate-slide-up">
			<form on:submit|preventDefault={handleLogin} class="space-y-5">
				<div>
					<label for="username" class="block text-navy-300 text-sm font-medium mb-2">用户名</label>
					<input
						id="username"
						bind:value={username}
						type="text"
						class="input-field"
						placeholder="请输入用户名"
						autocomplete="username"
					/>
				</div>

				<div>
					<label for="password" class="block text-navy-300 text-sm font-medium mb-2">密码</label>
					<input
						id="password"
						bind:value={password}
						type="password"
						class="input-field"
						placeholder="请输入密码"
						autocomplete="current-password"
					/>
				</div>

				{#if error}
					<div class="bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm px-4 py-2.5 rounded-lg">
						{error}
					</div>
				{/if}

				<button type="submit" class="btn-primary w-full py-2.5" disabled={loading}>
					{#if loading}
						<span class="inline-flex items-center">
							<svg class="animate-spin -ml-1 mr-2 h-4 w-4" viewBox="0 0 24 24" fill="none">
								<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
								<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
							</svg>
							登录中...
						</span>
					{:else}
						登 录
					{/if}
				</button>
			</form>

			<div class="mt-6 pt-6 border-t border-navy-700/40">
				<p class="text-navy-400 text-xs mb-2">演示账号：</p>
				<div class="text-xs text-navy-300 space-y-1">
					<div>管理层：<span class="text-cyan-400 font-medium">李店长 / manager123</span></div>
					<div>一线销售：<span class="text-cyan-400 font-medium">张销售 / sales_zhang</span></div>
				</div>
			</div>
		</div>
	</div>
</div>
