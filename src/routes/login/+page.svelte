<script lang="ts">
	import { goto } from '$app/navigation';

	let username = 'admin';
	let password = 'admin123';
	let error = '';
	let loading = false;

	async function handleLogin(e: SubmitEvent) {
		e.preventDefault();
		error = '';
		loading = true;

		try {
			const res = await fetch('/api/trpc/auth.login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					jsonrpc: '2.0',
					id: 1,
					method: 'auth.login',
					params: { input: { username, password } }
				})
			});

			const data = await res.json();
			if (data.error) {
				error = data.error.message || '登录失败';
			} else {
				goto('/');
			}
		} catch (err) {
			error = '登录失败，请检查网络连接';
			console.error(err);
		} finally {
			loading = false;
		}
	}

	async function handleRegister() {
		try {
			await fetch('/api/trpc/auth.register', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					jsonrpc: '2.0',
					id: 1,
					method: 'auth.register',
					params: {
						input: {
							username: 'admin',
							password: 'admin123',
							fullName: '系统管理员',
							role: 'admin'
						}
					}
				})
			});

			await fetch('/api/trpc/auth.register', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					jsonrpc: '2.0',
					id: 2,
					method: 'auth.register',
					params: {
						input: {
							username: 'nurse',
							password: 'nurse123',
							fullName: '李护士',
							role: 'nurse'
						}
					}
				})
			});

			await fetch('/api/trpc/auth.register', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					jsonrpc: '2.0',
					id: 3,
					method: 'auth.register',
					params: {
						input: {
							username: 'caregiver',
							password: 'care123',
							fullName: '王护工',
							role: 'caregiver'
						}
					}
				})
			});

			await fetch('/api/trpc/auth.register', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					jsonrpc: '2.0',
					id: 4,
					method: 'auth.register',
					params: {
						input: {
							username: 'manager',
							password: 'mgr123',
							fullName: '张院长',
							role: 'manager'
						}
					}
				})
			});

			alert('初始账号已创建！\n管理员: admin / admin123\n护士: nurse / nurse123\n护工: caregiver / care123\n院长: manager / mgr123');
		} catch (err) {
			console.error(err);
			alert('账号可能已存在');
		}
	}
</script>

<div class="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50 flex items-center justify-center p-4">
	<div class="w-full max-w-md">
		<div class="text-center mb-8">
			<div class="text-6xl mb-4">🏥</div>
			<h1 class="text-3xl font-bold text-gray-800">养老护理协同台</h1>
			<p class="text-gray-500 mt-2">用药提醒 · 活动签到 · 风险管理</p>
		</div>

		<div class="bg-white rounded-2xl shadow-xl p-8">
			<form on:submit={handleLogin} class="space-y-5">
				<div>
					<label class="label">用户名</label>
					<input
						type="text"
						class="input"
						bind:value={username}
						placeholder="请输入用户名"
						disabled={loading}
					/>
				</div>
				<div>
					<label class="label">密码</label>
					<input
						type="password"
						class="input"
						bind:value={password}
						placeholder="请输入密码"
						disabled={loading}
					/>
				</div>

				{#if error}
					<div class="p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>
				{/if}

				<button type="submit" class="btn btn-primary w-full" disabled={loading}>
					{loading ? '登录中...' : '登 录'}
				</button>
			</form>

			<div class="mt-6 text-center">
				<button on:click={handleRegister} class="text-sm text-primary-600 hover:underline">
					初始化测试账号
				</button>
			</div>

			<div class="mt-4 p-4 bg-gray-50 rounded-lg text-xs text-gray-500">
				<p class="font-medium mb-2">测试账号：</p>
				<p>管理员：admin / admin123</p>
				<p>院长：manager / mgr123</p>
				<p>护士：nurse / nurse123</p>
				<p>护工：caregiver / care123</p>
			</div>
		</div>
	</div>
</div>
