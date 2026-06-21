<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';

	let username = '';
	let password = '';
	let error = '';
	let loading = false;

	async function handleSubmit() {
		loading = true;
		error = '';
		try {
			const res = await fetch('/api/trpc/auth.login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					json: { username, password }
				})
			});
			const data = await res.json();
			if (data.error) {
				error = data.error.message || '登录失败';
			} else {
				await goto('/');
			}
		} catch (e) {
			error = '网络错误，请稍后重试';
		} finally {
			loading = false;
		}
	}
</script>

<div class="flex min-h-screen items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
	<div class="w-full max-w-md space-y-8">
		<div>
			<h2 class="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
				跑腿物品核验协同台
			</h2>
			<p class="mt-2 text-center text-sm text-gray-600">
				请登录您的账号
			</p>
		</div>

		<form class="mt-8 space-y-6" on:submit|preventDefault={handleSubmit}>
			{#if error}
				<div class="rounded-md bg-red-50 p-4">
					<div class="text-sm text-red-700">{error}</div>
				</div>
			{/if}

			<div class="space-y-4">
				<div>
					<label class="label" for="username">用户名</label>
					<input
						id="username"
						name="username"
						type="text"
						required
						class="input"
						bind:value={username}
						disabled={loading}
					/>
				</div>

				<div>
					<label class="label" for="password">密码</label>
					<input
						id="password"
						name="password"
						type="password"
						required
						class="input"
						bind:value={password}
						disabled={loading}
					/>
				</div>
			</div>

			<div>
				<button type="submit" class="btn-primary w-full" disabled={loading}>
					{loading ? '登录中...' : '登录'}
				</button>
			</div>

			<div class="text-center text-sm text-gray-600">
				还没有账号？
				<a href="/register" class="font-medium text-indigo-600 hover:text-indigo-500">
					立即注册
				</a>
			</div>
		</form>
	</div>
</div>
