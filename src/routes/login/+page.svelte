<script lang="ts">
	import { goto } from '$app/navigation';
	import { trpc } from '$lib/trpc/client';
	import { onMount } from 'svelte';

	let { data } = $props<{
		data: {
			user: {
				id: string;
				username: string;
				email: string;
				fullName: string;
				role: string;
				phone?: string;
				avatar?: string;
			} | null;
		};
	}>();

	let username = $state('');
	let password = $state('');
	let isLoading = $state(false);
	let showPassword = $state(false);
	let error = $state<string | null>(null);
	let rememberMe = $state(false);
	let windowWidth = $state(1280);

	let isMobile = $derived(windowWidth < 768);

	let isValid = $derived(username.trim().length > 0 && password.length > 0);

	const handleLogin = async (e: SubmitEvent) => {
		e.preventDefault();

		if (!isValid || isLoading) return;

		isLoading = true;
		error = null;

		try {
			const result = await trpc.auth.login.mutate({
				username: username.trim(),
				password
			});

			if (result.user) {
				await goto('/');
			}
		} catch (err) {
			console.error('Login failed:', err);
			if (err instanceof Error) {
				error = err.message;
			} else {
				error = '登录失败，请检查用户名和密码';
			}
		} finally {
			isLoading = false;
		}
	};

	const togglePasswordVisibility = () => {
		showPassword = !showPassword;
	};

	onMount(() => {
		windowWidth = window.innerWidth;

		const handleResize = () => {
			windowWidth = window.innerWidth;
		};
		window.addEventListener('resize', handleResize);

		if (data.user) {
			goto('/');
		}

		return () => {
			window.removeEventListener('resize', handleResize);
		};
	});
</script>

<div class="min-h-screen flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8 bg-gradient-to-br from-primary-50 via-white to-accent-50">
	<div class="w-full max-w-md">
		<div class="text-center mb-8">
			<div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-600 text-white text-2xl font-bold mb-4 shadow-lg">
				🏗️
			</div>
			<h1 class="text-2xl sm:text-3xl font-bold text-gray-900">
				变更协同管理系统
			</h1>
			<p class="mt-2 text-sm text-gray-500">
				{isMobile ? '移动端登录' : '桌面端登录'}
			</p>
		</div>

		<div class="card">
			<div class="card-body">
				<form onsubmit={handleLogin} class="space-y-5">
					{#if error}
						<div class="toast-error relative !static !transform-none animate-fade-in">
							<div class="flex items-center gap-2">
								<svg class="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
									<path
										fill-rule="evenodd"
										d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
										clip-rule="evenodd"
									/>
								</svg>
								<span class="text-sm">{error}</span>
							</div>
							<button
								type="button"
								class="ml-auto text-red-400 hover:text-red-600 transition-colors"
								onclick={() => (error = null)}
							>
								<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width={2}
										d="M6 18L18 6M6 6l12 12"
									/>
								</svg>
							</button>
						</div>
					{/if}

					<div class="form-group">
						<label for="username" class="form-label">
							用户名
						</label>
						<div class="relative">
							<div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
								<svg
									class="h-5 w-5 text-gray-400"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width={2}
										d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
									/>
								</svg>
							</div>
							<input
								id="username"
								name="username"
								type="text"
								autocomplete="username"
								required
								bind:value={username}
								class="pl-10"
								placeholder="请输入用户名"
								disabled={isLoading}
							/>
						</div>
					</div>

					<div class="form-group">
						<label for="password" class="form-label">
							密码
						</label>
						<div class="relative">
							<div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
								<svg
									class="h-5 w-5 text-gray-400"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width={2}
										d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
									/>
								</svg>
							</div>
							<input
								id="password"
								name="password"
								type={showPassword ? 'text' : 'password'}
								autocomplete="current-password"
								required
								bind:value={password}
								class="pl-10 pr-10"
								placeholder="请输入密码"
								disabled={isLoading}
							/>
							<button
								type="button"
								class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
								onclick={togglePasswordVisibility}
								aria-label={showPassword ? '隐藏密码' : '显示密码'}
							>
								{#if showPassword}
									<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width={2}
											d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
										/>
									</svg>
								{:else}
									<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width={2}
											d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
										/>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width={2}
											d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
										/>
									</svg>
								{/if}
							</button>
						</div>
					</div>

					<div class="flex items-center justify-between">
						<div class="flex items-center">
							<input
								id="remember-me"
								name="remember-me"
								type="checkbox"
								bind:checked={rememberMe}
								class="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
								disabled={isLoading}
							/>
							<label for="remember-me" class="ml-2 block text-sm text-gray-700">
								记住我
							</label>
						</div>

						<div class="text-sm">
							<a
								href="/forgot-password"
								class="font-medium text-primary-600 hover:text-primary-500 transition-colors"
							>
								忘记密码?
							</a>
						</div>
					</div>

					<button
						type="submit"
						class="btn-primary w-full"
						disabled={!isValid || isLoading}
					>
						{#if isLoading}
							<svg
								class="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
							>
								<circle
									class="opacity-25"
									cx="12"
									cy="12"
									r="10"
									stroke="currentColor"
									stroke-width="4"
								/>
								<path
									class="opacity-75"
									fill="currentColor"
									d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
								/>
							</svg>
							登录中...
						{:else}
							登录
						{/if}
					</button>
				</form>

				<div class="mt-6">
					<div class="relative">
						<div class="absolute inset-0 flex items-center">
							<div class="w-full border-t border-gray-200" />
						</div>
						<div class="relative flex justify-center text-sm">
							<span class="px-2 bg-white text-gray-500">或者</span>
						</div>
					</div>

					<div class="mt-6 grid grid-cols-2 gap-3">
						<button class="btn-outline !min-h-11" disabled={isLoading}>
							<svg class="w-5 h-5 mr-2" viewBox="0 0 24 24">
								<path
									fill="currentColor"
									d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"
								/>
							</svg>
							<span class="hidden sm:inline">Google</span>
						</button>
						<button class="btn-outline !min-h-11" disabled={isLoading}>
							<svg class="w-5 h-5 mr-2" viewBox="0 0 24 24">
								<path
									fill="currentColor"
									d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.686.195 2.686.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z"
								/>
							</svg>
							<span class="hidden sm:inline">微信</span>
						</button>
					</div>
				</div>
			</div>
		</div>

		<p class="mt-8 text-center text-sm text-gray-500">
			还没有账号?
			<a href="/register" class="font-medium text-primary-600 hover:text-primary-500 transition-colors">
				立即注册
			</a>
		</p>

		<div class="mt-4 text-center text-xs text-gray-400">
			<p>登录即表示您同意我们的</p>
			<p>
				<a href="/terms" class="text-primary-600 hover:text-primary-500">服务条款</a>
				和
				<a href="/privacy" class="text-primary-600 hover:text-primary-500">隐私政策</a>
			</p>
		</div>
	</div>
</div>

<style>
	@keyframes fade-in {
		from {
			opacity: 0;
			transform: translateY(-10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.animate-fade-in {
		animation: fade-in 0.3s ease-out;
	}
</style>
