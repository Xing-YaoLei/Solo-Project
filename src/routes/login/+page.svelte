<script lang="ts">
	import { goto } from '$app/navigation';
	import { getTrpcClient } from '$lib/trpc';

	let username = $state('admin');
	let password = $state('admin123');
	let error = $state('');
	let loading = $state(false);

	async function handleLogin(e?: Event) {
		e?.preventDefault();
		if (!username || !password) {
			error = '请输入用户名和密码';
			return;
		}

		loading = true;
		error = '';

		try {
			const result = await getTrpcClient().auth.login.mutate({ username, password });

			if (result.success && result.sessionCookie) {
				document.cookie = `${result.sessionCookie.name}=${result.sessionCookie.value}; path=/; max-age=${60 * 60 * 24 * 7}`;
				goto('/todo');
			} else {
				error = (result as any).error || '登录失败';
			}
		} catch (e: any) {
			error = e.message || '登录失败，请重试';
		} finally {
			loading = false;
		}
	}
</script>

<div class="login-container">
	<div class="login-card">
		<div class="login-header">
			<h1>社区团购售后协同台</h1>
			<p>Community Refund Management</p>
		</div>

		{#if error}
			<div class="error-message">{error}</div>
		{/if}

		<form onsubmit={handleLogin}>
			<div class="form-group">
				<label class="form-label">用户名</label>
				<input
					type="text"
					class="form-input"
					bind:value={username}
					placeholder="请输入用户名"
					disabled={loading}
				/>
			</div>

			<div class="form-group">
				<label class="form-label">密码</label>
				<input
					type="password"
					class="form-input"
					bind:value={password}
					placeholder="请输入密码"
					disabled={loading}
					onkeypress={(e) => e.key === 'Enter' && handleLogin(e)}
				/>
			</div>

			<button type="submit" class="btn btn-primary btn-lg" disabled={loading} style="width: 100%">
				{loading ? '登录中...' : '登 录'}
			</button>
		</form>

		<div class="login-tip">
			<p>演示账号：admin / admin123</p>
		</div>
	</div>
</div>

<style>
	.login-container {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		padding: 20px;
	}

	.login-card {
		background: white;
		border-radius: 12px;
		padding: 40px;
		width: 100%;
		max-width: 400px;
		box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
	}

	.login-header {
		text-align: center;
		margin-bottom: 30px;
	}

	.login-header h1 {
		margin: 0 0 8px 0;
		font-size: 22px;
		font-weight: 600;
		color: #1f2937;
	}

	.login-header p {
		margin: 0;
		color: #6b7280;
		font-size: 13px;
	}

	.error-message {
		background: #fef2f2;
		color: #dc2626;
		padding: 10px 12px;
		border-radius: 6px;
		margin-bottom: 16px;
		font-size: 13px;
	}

	.login-tip {
		margin-top: 20px;
		text-align: center;
		color: #9ca3af;
		font-size: 12px;
	}

	.login-tip p {
		margin: 0;
	}
</style>
