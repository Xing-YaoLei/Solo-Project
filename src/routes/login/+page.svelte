<script lang="ts">
	import { Lock, User, Wrench, Eye, EyeOff, AlertCircle } from 'lucide-svelte';

	export let form: { username?: string; error?: string } | undefined | null = null;

	let username: string;
	let password = '';
	let showPassword = false;
	let submitting = false;

	$: if (form?.username) {
		username = form.username;
	} else {
		username = '';
	}

	function handleSubmit(e: Event) {
		submitting = true;
	}
</script>

<div class="min-h-screen flex bg-slate-50">
	<div class="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-800 via-primary-700 to-primary-600 relative overflow-hidden">
		<div class="absolute inset-0 opacity-10">
			<div class="absolute top-10 left-10 w-72 h-72 rounded-full bg-accent-500 blur-3xl"></div>
			<div class="absolute bottom-20 right-10 w-96 h-96 rounded-full bg-blue-400 blur-3xl"></div>
		</div>
		<div class="relative z-10 w-full flex flex-col justify-between p-16">
			<div class="flex items-center gap-3">
				<div class="w-12 h-12 rounded-xl bg-accent-500 flex items-center justify-center">
					<Wrench class="w-7 h-7 text-white" />
				</div>
				<div>
					<h1 class="text-2xl font-bold text-white font-display">AutoCare Pro</h1>
					<p class="text-primary-200 text-sm">汽修厂协作管理系统</p>
				</div>
			</div>

			<div class="space-y-8">
				<div class="space-y-4">
					<h2 class="text-4xl font-bold text-white font-display leading-tight">
						专业汽修<br />
						<span class="text-accent-400">一站式管理</span>
					</h2>
					<p class="text-primary-200 text-lg max-w-md leading-relaxed">
						工单调度、配件库存、异常追溯、经营数据，全流程数字化管理，让每一辆车的维修透明高效。
					</p>
				</div>

				<div class="relative">
					<svg viewBox="0 0 500 320" class="w-full max-w-lg drop-shadow-2xl">
						<defs>
							<linearGradient id="carGrad" x1="0%" y1="0%" x2="100%" y2="100%">
								<stop offset="0%" style="stop-color:#f97316" />
								<stop offset="100%" style="stop-color:#ea580c" />
							</linearGradient>
							<linearGradient id="liftGrad" x1="0%" y1="0%" x2="0%" y2="100%">
								<stop offset="0%" style="stop-color:#64748b" />
								<stop offset="100%" style="stop-color:#334155" />
							</linearGradient>
						</defs>

						<rect x="40" y="220" width="420" height="8" rx="4" fill="#1e293b" opacity="0.6" />
						<rect x="60" y="160" width="20" height="70" rx="4" fill="url(#liftGrad)" />
						<rect x="420" y="160" width="20" height="70" rx="4" fill="url(#liftGrad)" />
						<rect x="50" y="150" width="400" height="18" rx="6" fill="#475569" />
						<rect x="55" y="152" width="18" height="14" rx="3" fill="#22c55e" />
						<rect x="427" y="152" width="18" height="14" rx="3" fill="#22c55e" />

						<path d="M 120 145 Q 120 95 170 85 L 340 85 Q 390 95 390 145 L 390 148 Q 385 152 380 152 L 130 152 Q 125 152 120 148 Z" fill="url(#carGrad)" />
						<path d="M 155 88 Q 160 70 185 65 L 325 65 Q 350 70 355 88 L 345 92 Q 340 98 170 98 Q 165 92 160 92 Z" fill="#0ea5e9" opacity="0.85" />
						<path d="M 290 68 L 340 88 L 330 92 L 285 72 Z" fill="#0284c7" opacity="0.6" />
						<circle cx="185" cy="152" r="28" fill="#0f172a" />
						<circle cx="185" cy="152" r="16" fill="#334155" />
						<circle cx="185" cy="152" r="8" fill="#94a3b8" />
						<circle cx="325" cy="152" r="28" fill="#0f172a" />
						<circle cx="325" cy="152" r="16" fill="#334155" />
						<circle cx="325" cy="152" r="8" fill="#94a3b8" />

						<ellipse cx="130" cy="118" rx="10" ry="8" fill="#fbbf24" />
						<ellipse cx="122" cy="118" rx="4" ry="6" fill="#fde68a" />
						<ellipse cx="380" cy="118" rx="10" ry="8" fill="#ef4444" />
						<ellipse cx="388" cy="118" rx="4" ry="6" fill="#fca5a5" />
						<line x1="170" y1="135" x2="340" y2="135" stroke="#1e40af" stroke-width="2" opacity="0.5" />

						<g transform="translate(250, 40)">
							<circle r="24" fill="#f97316" opacity="0.2" />
							<circle r="34" fill="#f97316" opacity="0.1" />
							<path d="M -8 -4 L -2 6 L 8 -8" stroke="#f97316" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round" />
						</g>
					</svg>
				</div>

				<div class="grid grid-cols-3 gap-6 max-w-lg">
					<div class="space-y-1">
						<div class="text-3xl font-bold text-white">12</div>
						<div class="text-primary-300 text-sm">今日工单</div>
					</div>
					<div class="space-y-1">
						<div class="text-3xl font-bold text-accent-400">98%</div>
						<div class="text-primary-300 text-sm">准时率</div>
					</div>
					<div class="space-y-1">
						<div class="text-3xl font-bold text-white">3.2%</div>
						<div class="text-primary-300 text-sm">返修率</div>
					</div>
				</div>
			</div>

			<div class="text-primary-300 text-sm">
				© 2026 AutoCare Pro · 工业级汽修管理解决方案
			</div>
		</div>
	</div>

	<div class="w-full lg:w-1/2 flex items-center justify-center p-8">
		<div class="w-full max-w-md space-y-8">
			<div class="lg:hidden flex items-center gap-3 justify-center mb-8">
				<div class="w-12 h-12 rounded-xl bg-primary-700 flex items-center justify-center">
					<Wrench class="w-7 h-7 text-white" />
				</div>
				<div>
					<h1 class="text-2xl font-bold text-primary-800 font-display">AutoCare Pro</h1>
					<p class="text-slate-500 text-sm">汽修厂协作管理系统</p>
				</div>
			</div>

			<div class="space-y-2">
				<h2 class="text-3xl font-bold text-slate-900 font-display">欢迎回来</h2>
				<p class="text-slate-500">请登录您的账户以继续工作</p>
			</div>

			<form method="POST" class="space-y-6" on:submit={handleSubmit}>
				{#if form?.error}
					<div class="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200">
						<AlertCircle class="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
						<p class="text-sm text-red-600">{form.error}</p>
					</div>
				{/if}

				<div class="space-y-2">
					<label for="login-username" class="block text-sm font-medium text-slate-700">用户名</label>
					<div class="relative">
						<User class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
						<input
							id="login-username"
							name="username"
							type="text"
							value={username}
							placeholder="请输入用户名"
							class="w-full pl-12 pr-4 py-3.5 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
						/>
					</div>
				</div>

				<div class="space-y-2">
					<label for="login-password" class="block text-sm font-medium text-slate-700">密码</label>
					<div class="relative">
						<Lock class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
						{#if showPassword}
							<input
								id="login-password"
								name="password"
								type="text"
								bind:value={password}
								placeholder="请输入密码"
								class="w-full pl-12 pr-12 py-3.5 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
							/>
						{:else}
							<input
								id="login-password"
								name="password"
								type="password"
								bind:value={password}
								placeholder="请输入密码"
								class="w-full pl-12 pr-12 py-3.5 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
							/>
						{/if}
						<button
							type="button"
							on:click={() => showPassword = !showPassword}
							class="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
						>
							{#if showPassword}
								<EyeOff class="w-5 h-5" />
							{:else}
								<Eye class="w-5 h-5" />
							{/if}
						</button>
					</div>
				</div>

				<div class="flex items-center justify-between">
					<label for="login-remember" class="flex items-center gap-2 cursor-pointer">
						<input id="login-remember" type="checkbox" class="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500" />
						<span class="text-sm text-slate-600">记住我</span>
					</label>
					<button
						type="button"
						on:click={() => alert('忘记密码功能开发中')}
						class="text-sm text-primary-600 hover:text-primary-700 font-medium bg-transparent p-0 border-none cursor-pointer"
					>
						忘记密码？
					</button>
				</div>

				<button
					type="submit"
					disabled={submitting}
					class="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-primary-700 to-primary-600 hover:from-primary-800 hover:to-primary-700 text-white font-semibold shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/30 disabled:opacity-70 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
				>
					{#if submitting}
						<svg class="animate-spin h-5 w-5" viewBox="0 0 24 24">
							<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" />
							<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
						</svg>
						登录中...
					{:else}
						登 录
					{/if}
				</button>
			</form>

			<div class="p-4 rounded-xl bg-slate-50 border border-slate-100">
				<p class="text-xs text-slate-500 leading-relaxed">
					<span class="font-semibold text-slate-700">测试账号：</span> admin / admin123
					<br />
					生产环境请使用真实账号登录。
				</p>
			</div>
		</div>
	</div>
</div>
