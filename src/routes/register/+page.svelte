<script lang="ts">
	import { goto } from '$app/navigation';
	import { createMutation } from '$lib/trpc/query';

	let name = '';
	let email = '';
	let password = '';
	let confirmPassword = '';
	let role = 'student';
	let errorMessage = '';

	const registerMutation = createMutation<{ email: string; password: string; name: string; role: string }, any>('auth.register');

	async function handleRegister(e: Event) {
		e.preventDefault();
		errorMessage = '';

		if (password !== confirmPassword) {
			errorMessage = '两次输入的密码不一致';
			return;
		}

		try {
			await registerMutation.mutate({ email, password, name, role });
			goto('/dashboard');
		} catch (err: any) {
			errorMessage = err?.message || '注册失败，请重试';
		}
	}

	$: isLoading = $registerMutation.isLoading;
</script>

<div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 py-12 px-4">
	<div class="card p-8 w-full max-w-md">
		<div class="text-center mb-8">
			<div class="w-16 h-16 bg-primary-600 rounded-xl flex items-center justify-center mx-auto mb-4">
				<svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path>
				</svg>
			</div>
			<h1 class="text-2xl font-bold text-gray-900">创建账户</h1>
			<p class="text-gray-500 mt-2">加入职业教育证书考试协同平台</p>
		</div>

		<form on:submit={handleRegister} class="space-y-4">
			{#if errorMessage}
				<div class="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
					{errorMessage}
				</div>
			{/if}

			<div>
				<label class="label" for="name">姓名</label>
				<input
					id="name"
					type="text"
					class="input"
					bind:value={name}
					placeholder="请输入姓名"
					required
					disabled={isLoading}
				/>
			</div>

			<div>
				<label class="label" for="email">邮箱</label>
				<input
					id="email"
					type="email"
					class="input"
					bind:value={email}
					placeholder="请输入邮箱"
					required
					disabled={isLoading}
				/>
			</div>

			<div>
				<label class="label" for="password">密码</label>
				<input
					id="password"
					type="password"
					class="input"
					bind:value={password}
					placeholder="请输入密码（至少6位）"
					required
					disabled={isLoading}
				/>
			</div>

			<div>
				<label class="label" for="confirmPassword">确认密码</label>
				<input
					id="confirmPassword"
					type="password"
					class="input"
					bind:value={confirmPassword}
					placeholder="请再次输入密码"
					required
					disabled={isLoading}
				/>
			</div>

			<div>
				<label class="label" for="role">角色</label>
				<select
					id="role"
					class="input"
					bind:value={role}
					disabled={isLoading}
				>
					<option value="student">学员</option>
					<option value="assistant">助教</option>
					<option value="lecturer">讲师</option>
					<option value="admin">教务</option>
				</select>
			</div>

			<button
				type="submit"
				class="btn btn-primary w-full"
				disabled={isLoading}
			>
				{#if isLoading}
					注册中...
				{:else}
					注册
				{/if}
			</button>
		</form>

		<p class="text-center text-sm text-gray-500 mt-6">
			已有账户？
			<a href="/login" class="text-primary-600 hover:text-primary-700 font-medium">立即登录</a>
		</p>
	</div>
</div>
