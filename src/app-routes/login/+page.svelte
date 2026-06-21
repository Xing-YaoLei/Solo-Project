<script lang="ts">
	import { goto } from '$app/navigation';
	import { trpc } from '$trpc/client';
	import { page } from '$app/stores';

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
			await trpc.auth.login.mutate({ username, password });
			goto('/');
		} catch (e: any) {
			error = e.message || '登录失败，请重试';
		} finally {
			loading = false;
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			handleLogin();
		}
	}
</script>

<div class="auth-card">
	<div class="auth-header">
		<h1>🏠 家装工地协同台</h1>
		<p>客户确认 · 变更追踪 · 资料管理</p>
	</div>

	<form class="auth-form" on:submit|preventDefault={handleLogin}>
		{#if error}
			<div class="error-message">{error}</div>
		{/if}

		<div class="form-group">
			<label>用户名</label>
			<input
				type="text"
				bind:value={username}
				on:keydown={handleKeydown}
				placeholder="请输入用户名"
				disabled={loading}
			/>
		</div>

		<div class="form-group">
			<label>密码</label>
			<input
				type="password"
				bind:value={password}
				on:keydown={handleKeydown}
				placeholder="请输入密码"
				disabled={loading}
			/>
		</div>

		<button type="submit" class="submit-btn" disabled={loading}>
			{loading ? '登录中...' : '登 录'}
		</button>
	</form>

	<div class="auth-footer">
		还没有账号？ <a href="/signup">立即注册</a>
	</div>
</div>

<style>
	.auth-card {
		width: 100%;
		max-width: 420px;
		background: white;
		border-radius: 16px;
		padding: 40px;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
	}

	.auth-header {
		text-align: center;
		margin-bottom: 32px;
	}

	.auth-header h1 {
		font-size: 24px;
		font-weight: 700;
		color: #1e3a5f;
		margin-bottom: 8px;
	}

	.auth-header p {
		color: #64748b;
		font-size: 14px;
	}

	.auth-form {
		display: flex;
		flex-direction: column;
		gap: 20px;
	}

	.error-message {
		background: #fef2f2;
		color: #dc2626;
		padding: 12px 16px;
		border-radius: 8px;
		font-size: 14px;
		border: 1px solid #fecaca;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.form-group label {
		font-size: 14px;
		font-weight: 500;
		color: #374151;
	}

	.form-group input {
		padding: 12px 16px;
		border: 1px solid #d1d5db;
		border-radius: 8px;
		font-size: 14px;
		transition: all 0.2s;
	}

	.form-group input:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}

	.form-group input:disabled {
		background: #f3f4f6;
		cursor: not-allowed;
	}

	.submit-btn {
		padding: 14px;
		background: linear-gradient(135deg, #3b82f6, #2563eb);
		color: white;
		border: none;
		border-radius: 8px;
		font-size: 16px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
	}

	.submit-btn:hover:not(:disabled) {
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
	}

	.submit-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.auth-footer {
		text-align: center;
		margin-top: 24px;
		font-size: 14px;
		color: #64748b;
	}

	.auth-footer a {
		color: #3b82f6;
		text-decoration: none;
		font-weight: 500;
	}

	.auth-footer a:hover {
		text-decoration: underline;
	}
</style>
