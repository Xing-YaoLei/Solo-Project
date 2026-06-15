<script lang="ts">
	import { page } from '$app/stores';

	const currentPath = $derived($page.url.pathname);

	const navItems = [
		{ path: '/', label: '监测总览', icon: '📊' },
		{ path: '/tags', label: '题目标签', icon: '🏷️' },
		{ path: '/progress', label: '学习进度', icon: '📈' },
		{ path: '/scores', label: '成绩反馈', icon: '✅' },
		{ path: '/review', label: '复盘材料', icon: '📋' },
		{ path: '/thresholds', label: '阈值配置', icon: '⚙️' }
	];

	function isActive(path: string): boolean {
		if (path === '/') {
			return currentPath === '/';
		}
		return currentPath.startsWith(path);
	}
</script>

<nav class="bg-white shadow-sm border-b">
	<div class="max-w-7xl mx-auto px-4">
		<div class="flex items-center justify-between h-16">
			<div class="flex items-center gap-3">
				<span class="text-2xl">🎓</span>
				<h1 class="text-lg font-bold text-gray-800">作业批改风险监测系统</h1>
			</div>
			<div class="flex items-center gap-1">
				{#each navItems as item (item.path)}
					<a
						href={item.path}
						class="px-3 py-2 rounded-lg text-sm font-medium transition-colors
							{isActive(item.path)
								? 'bg-primary-100 text-primary-700'
								: 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}"
					>
						<span class="mr-1">{item.icon}</span>
						<span class="hidden md:inline">{item.label}</span>
					</a>
				{/each}
			</div>
		</div>
	</div>
</nav>
