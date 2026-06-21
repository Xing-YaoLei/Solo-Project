<script lang="ts">
	import { goto } from '$app/navigation';
	import { trpc } from '$trpc/client';

	let formData = {
		username: '',
		password: '',
		confirmPassword: '',
		fullName: '',
		phone: '',
		role: 'worker' as 'worker' | 'manager' | 'admin'
	};

	let loading = false;
	let error = '';

	async function handleSignup() {
		if (!formData.username || !formData.password || !formData.fullName) {
			error = '请填写必填项';
			return;
		}

		if (formData.password !== formData.confirmPassword) {
			error = '两次输入的密码不一致';
			return;
		}

		if (formData.password.length < 6) {
			error = '密码长度至少6位';
			return;
		}

		loading = true;
		error = '';

		try {
			await trpc.auth.signup.mutate({
				username: formData.username,
				password: formData.password,
				fullName: formData.fullName,
				phone: formData.phone || undefined,
				role: formData.role
			});
			goto('/');
		} catch (e: any) {
			error = e.message || '注册失败，请重试';
		} finally {
			loading = false;
		}
	}
</script>

<div class="auth-card">
	<div class="auth-header">
		<h1>🏠 创建账号</h1>
		<p>加入家装工地协同台</p>
	</div>

	<form class="auth-form" on:submit|preventDefault={handleSignup}>
		{#if error}
			<div class="error-message">{error}</div>
		{/if}

		<div class="form-group">
			<label>用户名 *</label>
			<input
				type="text"
				bind:value={formData.username}
				placeholder="请输入用户名"
				disabled={loading}
			/>
		</div>

		<div class="form-group">
			<label>真实姓名 *</label>
			<input
				type="text"
				bind:value={formData.fullName}
				placeholder="请输入真实姓名"
				disabled={loading}
			/>
		</div>

		<div class="form-row">
			<div class="form-group">
				<label>手机号</label>
				<input
					type="tel"
					bind:value={formData.phone}
					placeholder="请输入手机号"
					disabled={loading}
				/>
			</div>

			<div class="form-group">
				<label>角色</label>
				<select bind:value={formData.role} disabled={loading}>
					<option value="worker">施工员</option>
					<option value="manager">项目经理</option>
					<option value="admin">管理员</option>
				</select>
			</div>
		</div>

		<div class="form-group">
			<label>密码 *</label>
			<input
				type="password"
				bind:value={formData.password}
				placeholder="请输入密码（至少6位）"
				disabled={loading}
			/>
		</div>

		<div class="form-group">
			<label>确认密码 *</label>
			<input
				type="password"
				bind:value={formData.confirmPassword}
				placeholder="请再次输入密码"
				disabled={loading}
			/>
		</div>

		<button type="submit" class="submit-btn" disabled={loading}>
			{loading ? '注册中...' : '注 册'}
		</button>
	</form>

	<div class="auth-footer">
		已有账号？ <a href="/login">立即登录</a>
	</div>
</div>

<style>
	.auth-card {
		width: 100%;
		max-width: 480px;
		background: white;
		border-radius: 16px;
		padding: 40px;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
		max-height: 90vh;
		overflow-y: auto;
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
		gap: 16px;
	}

	.error-message {
		background: #fef2f2;
		color: #dc2626;
		padding: 12px 16px;
		border-radius: 8px;
		font-size: 14px;
		border: 1px solid #fecaca;
	}

	.form-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 16px;
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

	.form-group input,
	.form-group select {
		padding: 12px 16px;
		border: 1px solid #d1d5db;
		border-radius: 8px;
		font-size: 14px;
		transition: all 0.2s;
		background: white;
	}

	.form-group input:focus,
	.form-group select:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}

	.submit-btn {
		padding: 14px;
		background: linear-gradient(135deg, #10b981, #059669);
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
		box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
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
