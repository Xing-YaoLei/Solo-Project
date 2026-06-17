<script lang="ts">
	import { goto } from '$app/navigation';
	import { trpc } from '$lib/trpc';
	import { ShieldCheck, User as UserIcon, Lock, AlertCircle, Loader2 } from 'lucide-svelte';

	let username = $state('');
	let password = $state('');
	let loading = $state(false);
	let error = $state('');

	async function handleLogin(e: Event) {
		e.preventDefault();
		if (!username.trim() || !password.trim()) {
			error = '请输入用户名和密码';
			return;
		}

		loading = true;
		error = '';

		try {
			await trpc.auth.login.mutate({ username, password });
			goto('/');
		} catch (e: any) {
			error = e?.message ?? '登录失败，请重试';
		} finally {
			loading = false;
		}
	}
</script>

<div class="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-dark via-primary to-primary-light p-4">
	<div class="w-full max-w-md animate-fade-in">
		<div class="mb-8 text-center text-white">
			<div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
				<ShieldCheck class="h-8 w-8" />
			</div>
			<h1 class="text-2xl font-bold">园区物业协同平台</h1>
			<p class="mt-2 text-sm text-white/70">招商租户一体化管理系统</p>
		</div>

		<form onsubmit={handleLogin} class="rounded-2xl bg-surface p-6 shadow-xl sm:p-8">
			<h2 class="mb-6 text-lg font-semibold text-text">登录账号</h2>

			{#if error}
				<div class="mb-4 flex items-start gap-2 rounded-lg bg-danger-bg p-3 text-sm text-danger">
					<AlertCircle class="mt-0.5 h-4 w-4 flex-shrink-0" />
					<span>{error}</span>
				</div>
			{/if}

			<div class="space-y-4">
				<div>
					<label class="mb-1.5 block text-sm font-medium text-text">用户名</label>
					<div class="relative">
						<UserIcon class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
						<input
							type="text"
							bind:value={username}
							placeholder="请输入用户名"
							class="w-full rounded-lg border border-border bg-surface-alt py-2.5 pl-9 pr-4 text-sm text-text placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors"
							autocomplete="username"
						/>
					</div>
				</div>

				<div>
					<label class="mb-1.5 block text-sm font-medium text-text">密码</label>
					<div class="relative">
						<Lock class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
						<input
							type="password"
							bind:value={password}
							placeholder="请输入密码"
							class="w-full rounded-lg border border-border bg-surface-alt py-2.5 pl-9 pr-4 text-sm text-text placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors"
							autocomplete="current-password"
						/>
					</div>
				</div>
			</div>

			<button
				type="submit"
				disabled={loading}
				class="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-medium text-white hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
			>
				{#if loading}
					<Loader2 class="h-4 w-4 animate-spin" />
					登录中...
				{:else}
					登 录
				{/if}
			</button>

			<div class="mt-6 rounded-lg bg-surface-alt p-4 text-xs text-text-secondary">
				<div class="mb-2 font-medium text-text">演示账号：</div>
				<div class="space-y-1">
					<div>管理员：admin / admin123</div>
					<div>巡检员：inspector / insp123</div>
					<div>维修员：maintenance / maint123</div>
					<div>财务员：finance / fina123</div>
					<div>租户：tenant / tenant123</div>
				</div>
			</div>
		</form>
	</div>
</div>
