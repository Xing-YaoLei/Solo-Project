<script lang="ts">
	import { auth } from '$lib/stores/auth';

	let email = '';
	let username = '';
	let password = '';
	let phone = '';
	let error = '';
	let submitting = false;

	async function handleRegister() {
		submitting = true;
		error = '';
		const result = await auth.register({ email, username, password, phone: phone || undefined });
		if (!result.success) {
			error = result.error ?? '注册失败';
		}
		submitting = false;
	}
</script>

<div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 py-12 px-4 sm:px-6 lg:px-8">
	<div class="max-w-md w-full space-y-8">
		<div>
			<div class="mx-auto h-16 w-16 bg-primary-600 rounded-2xl flex items-center justify-center">
				<svg class="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path>
				</svg>
			</div>
			<h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">注册新账号</h2>
			<p class="mt-2 text-center text-sm text-gray-600">首个注册账号将自动成为管理员</p>
		</div>
		<form class="mt-8 space-y-6 card card-body" on:submit|preventDefault={handleRegister}>
			<div class="space-y-4">
				<div>
					<label class="label" for="username">用户名</label>
					<input id="username" type="text" bind:value={username} class="input" required minlength="2" placeholder="请输入姓名" />
				</div>
				<div>
					<label class="label" for="email">邮箱</label>
					<input id="email" type="email" bind:value={email} class="input" required placeholder="your@email.com" />
				</div>
				<div>
					<label class="label" for="phone">手机号（选填）</label>
					<input id="phone" type="tel" bind:value={phone} class="input" placeholder="请输入手机号" />
				</div>
				<div>
					<label class="label" for="password">密码</label>
					<input id="password" type="password" bind:value={password} class="input" required minlength="6" placeholder="至少6位" />
				</div>
			</div>

			{#if error}
				<div class="rounded-md bg-red-50 p-4 border border-red-200">
					<div class="text-sm text-red-700">{error}</div>
				</div>
			{/if}

			<div>
				<button type="submit" class="w-full btn-primary" disabled={submitting}>
					{submitting ? '注册中...' : '注 册'}
				</button>
			</div>

			<div class="text-center">
				<a href="/auth/login" class="text-sm text-primary-600 hover:text-primary-500">已有账号？返回登录</a>
			</div>
		</form>
	</div>
</div>
