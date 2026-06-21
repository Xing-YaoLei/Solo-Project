<script lang="ts">
	import { goto } from '$app/navigation';

	let username = '';
	let password = '';
	let confirmPassword = '';
	let role = 'operator';
	let error = '';
	let loading = false;

	async function handleSubmit() {
		if (password !== confirmPassword) {
			error = '两次输入的密码不一致';
			return;
		}

		loading = true;
		error = '';

		try {
			const res = await fetch('/api/trpc/auth.register', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					json: { username, password, role }
				})
			});
			const data = await res.json();
			if (data.error) {
				error = data.error.message || '注册失败';
			} else {
				await goto('/login');
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
				注册账号
			</h2>
			<p class="mt-2 text-center text-sm text-gray-600">
				创建您的核验协同台账号
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
					<label class="label" for="role">角色</label>
					<select id="role" class="select" bind:value={role} disabled={loading}>
						<option value="operator">一线操作员</option>
						<option value="reviewer">复核员</option>
						<option value="admin">管理员</option>
					</select>
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

				<div>
					<label class="label" for="confirmPassword">确认密码</label>
					<input
						id="confirmPassword"
						name="confirmPassword"
						type="password"
						required
						class="input"
						bind:value={confirmPassword}
						disabled={loading}
					/>
				</div>
			</div>

			<div>
				<button type="submit" class="btn-primary w-full" disabled={loading}>
					{loading ? '注册中...' : '注册'}
				</button>
			</div>

			<div class="text-center text-sm text-gray-600">
				已有账号？
				<a href="/login" class="font-medium text-indigo-600 hover:text-indigo-500">
					立即登录
				</a>
			</div>
		</form>
	</div>
</div>
