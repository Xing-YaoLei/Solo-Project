<script lang="ts">
	import { onMount } from 'svelte';
	import { Mail, Lock, LogIn, AlertCircle } from 'lucide-svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { auth } from '$lib/stores/auth';
	import { createTRPCProxyClient, resetTRPCClient } from '$lib/trpc/client';
	import { cn } from '$lib/utils/cn';
	import type { UserRole } from '$shared/types';

	let email = '';
	let password = '';
	let loading = false;
	let error = '';

	const testAccounts: { email: string; password: string; role: UserRole; label: string }[] = [
		{ email: 'admin@eldercare.com', password: 'admin123', role: 'admin', label: '机构管理员' },
		{ email: 'supervisor@eldercare.com', password: 'super123', role: 'supervisor', label: '护理主管' },
		{ email: 'nurse@eldercare.com', password: 'nurse123', role: 'nurse', label: '护理员' },
		{ email: 'doctor@eldercare.com', password: 'doctor123', role: 'doctor', label: '驻院医生' }
	];

	function fillAccount(account: typeof testAccounts[0]) {
		email = account.email;
		password = account.password;
		error = '';
	}

	async function handleLogin() {
		error = '';
		if (!email || !password) {
			error = '请输入邮箱和密码';
			return;
		}

		loading = true;
		try {
			const trpc = createTRPCProxyClient();
			const result = await trpc.auth.login.mutate({ email, password });

			if (!result.success) {
				throw new Error('登录失败');
			}

			auth.set(result.user, result.token);
			resetTRPCClient();
			goto('/');
		} catch (err) {
			error = err instanceof Error ? err.message : '登录失败，请重试';
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		if ($page.data.user) {
			goto('/');
		}
	});
</script>

<div class="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary-50 via-ivory to-accent-50">
	<div class="w-full max-w-md">
		<div class="text-center mb-8">
			<div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-600 mb-4 shadow-card">
				<LogIn class="w-8 h-8 text-white" />
			</div>
			<h1 class="text-2xl font-serif font-bold text-primary-800 mb-1">养老护理入住评估协同台</h1>
			<p class="text-sm text-gray-500">Elder Care Assessment Platform</p>
		</div>

		<div class="card p-6 md:p-8">
			<h2 class="text-lg font-semibold text-gray-800 mb-6">账号登录</h2>

			{#if error}
				<div class="mb-4 p-3 rounded-xl bg-danger-50 border border-danger-200 flex items-start gap-2">
					<AlertCircle class="w-5 h-5 text-danger-500 flex-shrink-0 mt-0.5" />
					<p class="text-sm text-danger-700">{error}</p>
				</div>
			{/if}

			<form on:submit|preventDefault={handleLogin} class="space-y-4">
				<div>
					<label for="email" class="label">邮箱</label>
					<div class="relative">
						<Mail class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
						<input
							id="email"
							type="email"
							bind:value={email}
							placeholder="请输入邮箱"
							class="input pl-10"
							disabled={loading}
						/>
					</div>
				</div>

				<div>
					<label for="password" class="label">密码</label>
					<div class="relative">
						<Lock class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
						<input
							id="password"
							type="password"
							bind:value={password}
							placeholder="请输入密码"
							class="input pl-10"
							disabled={loading}
						/>
					</div>
				</div>

				<button type="submit" class={cn('btn-primary w-full py-3', loading && 'opacity-70')} disabled={loading}>
					{#if loading}
						<div class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
						<span>登录中...</span>
					{:else}
						<LogIn class="w-5 h-5" />
						<span>登 录</span>
					{/if}
				</button>
			</form>

			<div class="my-6 flex items-center gap-3">
				<div class="flex-1 h-px bg-gray-200" />
				<span class="text-xs text-gray-400">测试账号</span>
				<div class="flex-1 h-px bg-gray-200" />
			</div>

			<div class="grid grid-cols-2 gap-2">
				{#each testAccounts as account}
					<button
						type="button"
						on:click={() => fillAccount(account)}
						class="btn-secondary text-xs py-2 px-3"
						disabled={loading}
					>
						{account.label}
					</button>
				{/each}
			</div>

			<p class="mt-6 text-xs text-center text-gray-400">
				点击测试账号按钮可自动填充邮箱和密码
			</p>
		</div>

		<p class="text-center text-xs text-gray-400 mt-6">
			© 2024 养老护理入住评估协同台 · 专业守护每一位长者
		</p>
	</div>
</div>
