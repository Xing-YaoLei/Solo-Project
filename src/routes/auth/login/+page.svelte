<script lang="ts">
	import { auth } from '$lib/stores/auth';

	let email = 'admin@example.com';
	let password = 'admin123';
	let error = '';
	let submitting = false;

	async function handleLogin() {
		submitting = true;
		error = '';
		const result = await auth.login(email, password);
		if (!result.success) {
			error = result.error ?? '登录失败';
		}
		submitting = false;
	}
</script>

<div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 py-12 px-4 sm:px-6 lg:px-8">
	<div class="max-w-md w-full space-y-8">
		<div>
			<div class="mx-auto h-16 w-16 bg-primary-600 rounded-2xl flex items-center justify-center">
				<svg class="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
				</svg>
			</div>
			<h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">民宿房态管理协同台</h2>
			<p class="mt-2 text-center text-sm text-gray-600">高效协同管理房态、订单与运营</p>
		</div>
		<form class="mt-8 space-y-6 card card-body" on:submit|preventDefault={handleLogin}>
			<div class="space-y-4">
				<div>
					<label class="label" for="email">邮箱</label>
					<input id="email" type="email" bind:value={email} class="input" required placeholder="admin@example.com" />
				</div>
				<div>
					<label class="label" for="password">密码</label>
					<input id="password" type="password" bind:value={password} class="input" required placeholder="admin123" />
				</div>
			</div>

			{#if error}
				<div class="rounded-md bg-red-50 p-4 border border-red-200">
					<div class="text-sm text-red-700">{error}</div>
				</div>
			{/if}

			<div>
				<button type="submit" class="w-full btn-primary" disabled={submitting}>
					{submitting ? '登录中...' : '登 录'}
				</button>
			</div>

			<div class="text-center">
				<a href="/auth/register" class="text-sm text-primary-600 hover:text-primary-500">没有账号？立即注册</a>
			</div>

			<div class="mt-4 p-3 bg-blue-50 rounded-md text-xs text-blue-700 border border-blue-100">
				<div class="font-semibold mb-1">首次使用提示：</div>
				<div>首次注册的用户将自动成为管理员。您也可以使用上方默认的演示账号体验。</div>
			</div>
		</form>
	</div>
</div>
