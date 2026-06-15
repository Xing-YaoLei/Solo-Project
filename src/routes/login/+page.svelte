<script lang="ts">
	import { goto } from '$app/navigation';
	import { createMutation } from '$lib/trpc/query';
	import { page } from '$app/stores';

	let email = '';
	let password = '';
	let errorMessage = '';

	const loginMutation = createMutation<{ email: string; password: string }, any>('auth.login');

	async function handleLogin(e: Event) {
		e.preventDefault();
		errorMessage = '';

		try {
			await loginMutation.mutate({ email, password });
			goto('/dashboard');
		} catch (err: any) {
			errorMessage = err?.message || '登录失败，请重试';
		}
	}

	$: isLoading = $loginMutation.isLoading;
</script>

<div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 py-12 px-4">
	<div class="card p-8 w-full max-w-md">
		<div class="text-center mb-8">
			<div class="w-16 h-16 bg-primary-600 rounded-xl flex items-center justify-center mx-auto mb-4">
				<svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
				</svg>
			</div>
			<h1 class="text-2xl font-bold text-gray-900">职业教育证书考试协同平台</h1>
			<p class="text-gray-500 mt-2">请登录您的账户</p>
		</div>

		<form on:submit={handleLogin} class="space-y-4">
			{#if errorMessage}
				<div class="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
					{errorMessage}
				</div>
			{/if}

			<div>
				<label class="label" for="email">邮箱</label>
				<input
					id="email"
					type="email"
					class="input"
					bind:value={email}
					placeholder="请输入邮箱"
					required
					disabled={isLoading}
				/>
			</div>

			<div>
				<label class="label" for="password">密码</label>
				<input
					id="password"
					type="password"
					class="input"
					bind:value={password}
					placeholder="请输入密码"
					required
					disabled={isLoading}
				/>
			</div>

			<button
				type="submit"
				class="btn btn-primary w-full"
				disabled={isLoading}
			>
				{#if isLoading}
					登录中...
				{:else}
					登录
				{/if}
			</button>
		</form>

		<p class="text-center text-sm text-gray-500 mt-6">
			还没有账户？
			<a href="/register" class="text-primary-600 hover:text-primary-700 font-medium">立即注册</a>
		</p>
	</div>
</div>
