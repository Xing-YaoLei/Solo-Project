<script lang="ts">
	import { goto } from '$app/navigation';
	import { trpc } from '$lib/trpc/client';

	let username = '';
	let password = '';
	let error = '';
	let loading = false;
	let mode: 'login' | 'signup' = 'login';
	let displayName = '';
	let email = '';

	async function submit() {
		error = '';
		loading = true;
		try {
			if (mode === 'login') {
				await trpc.auth.login.mutate({ username, password });
			} else {
				await trpc.auth.signup.mutate({ username, email, password, displayName });
			}
			goto('/');
		} catch (e: any) {
			error = e?.message ?? '操作失败，请重试';
		} finally {
			loading = false;
		}
	}
</script>

<div class="min-h-screen flex items-center justify-center p-6">
	<div class="w-full max-w-md">
		<div class="card card-body p-8 space-y-6">
			<div class="text-center space-y-2">
				<div class="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center text-white text-3xl shadow-lg">
					🎭
				</div>
				<h1>活动票务协同台</h1>
				<p class="text-sm text-slate-500">
					{mode === 'login' ? '欢迎回来，请登录以继续' : '创建新账号'}
				</p>
			</div>

			{#if error}
				<div class="badge-red w-full py-2 px-3 rounded-lg text-sm">
					{error}
				</div>
			{/if}

			<form class="space-y-4" on:submit|preventDefault={submit}>
				<div>
					<label class="label">用户名</label>
					<input
						class="input"
						type="text"
						bind:value={username}
						placeholder="请输入用户名"
						required
						disabled={loading}
					/>
				</div>

				{#if mode === 'signup'}
					<div>
						<label class="label">邮箱</label>
						<input
							class="input"
							type="email"
							bind:value={email}
							placeholder="name@example.com"
							required
							disabled={loading}
						/>
					</div>
					<div>
						<label class="label">显示名称（可选）</label>
						<input
							class="input"
							type="text"
							bind:value={displayName}
							placeholder="如何称呼您"
							disabled={loading}
						/>
					</div>
				{/if}

				<div>
					<label class="label">密码</label>
					<input
						class="input"
						type="password"
						bind:value={password}
						placeholder={mode === 'signup' ? '至少8位' : '请输入密码'}
						required
						minlength={mode === 'signup' ? 8 : undefined}
						disabled={loading}
					/>
				</div>

				<button
					type="submit"
					class="btn-primary w-full py-2.5"
					disabled={loading || !username || !password}
				>
					{#if loading}处理中...{:else}{mode === 'login' ? '登录' : '注册'}{/if}
				</button>
			</form>

			<div class="text-center text-sm text-slate-500">
				{mode === 'login' ? '还没有账号？' : '已有账号？'}
				<button
					type="button"
					class="text-brand-600 hover:text-brand-700 font-medium"
					on:click={() => (mode = mode === 'login' ? 'signup' : 'login')}
				>
					{mode === 'login' ? '立即注册' : '去登录'}
				</button>
			</div>

			<div class="pt-4 border-t border-slate-200">
				<div class="text-xs text-slate-500 text-center space-y-1">
					<div>功能演示环境快速上手：</div>
					<div class="font-mono bg-slate-50 rounded-md p-2 text-left">
						<div># 运行前请先配置 .env<br/>DATABASE_URL=postgresql://...<br/><br/>npm install<br/>npm run db:push<br/>npm run dev
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
