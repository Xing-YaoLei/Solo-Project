<script lang="ts">
	let { form } = $props();
</script>

<svelte:head>
	<title>注册 - 演出排期协同台</title>
</svelte:head>

<div class="register-page">
	<div class="card">
		<div class="header">
			<h1 class="title">演出排期协同台</h1>
			<p class="subtitle">注册</p>
		</div>

		{#if form?.message}
			<div class="error">{form.message}</div>
		{/if}

		<form method="POST" class="form">
			<input type="text" name="username" placeholder="用户名" required class="input" />
			<input type="text" name="displayName" placeholder="显示名称" class="input" />
			<input type="password" name="password" placeholder="密码" required class="input" />
			<input type="password" name="confirmPassword" placeholder="确认密码" class="input" />
			<button type="submit" class="btn">注册</button>
		</form>

		<div class="footer">
			已有账号？<a href="/login" class="link">登录</a>
		</div>
	</div>
</div>

<style>
	.register-page {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		background: #f1f5f9;
		padding: 24px;
	}

	.card {
		width: 100%;
		max-width: 400px;
		background: #ffffff;
		border-radius: 12px;
		padding: 40px 32px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.header {
		text-align: center;
		margin-bottom: 32px;
	}

	.title {
		font-size: 24px;
		font-weight: 700;
		color: #1e293b;
		margin: 0 0 8px;
	}

	.subtitle {
		font-size: 16px;
		color: #64748b;
		margin: 0;
	}

	.error {
		background: #fef2f2;
		color: #dc2626;
		padding: 10px 14px;
		border-radius: 8px;
		font-size: 14px;
		margin-bottom: 20px;
		border: 1px solid #fecaca;
	}

	.form {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.input {
		width: 100%;
		padding: 10px 14px;
		border: 1px solid #d1d5db;
		border-radius: 8px;
		font-size: 15px;
		outline: none;
		box-sizing: border-box;
		transition: border-color 0.15s;
	}

	.input:focus {
		border-color: #3b82f6;
	}

	.btn {
		width: 100%;
		padding: 10px;
		background: #3b82f6;
		color: #ffffff;
		border: none;
		border-radius: 8px;
		font-size: 15px;
		font-weight: 600;
		cursor: pointer;
		transition: background 0.15s;
	}

	.btn:hover {
		background: #2563eb;
	}

	.footer {
		text-align: center;
		margin-top: 24px;
		font-size: 14px;
		color: #64748b;
	}

	.link {
		color: #3b82f6;
		text-decoration: none;
		font-weight: 500;
	}

	.link:hover {
		text-decoration: underline;
	}
</style>
