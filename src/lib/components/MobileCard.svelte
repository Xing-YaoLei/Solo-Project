<script lang="ts">
	let {
		title,
		subtitle,
		description,
		status,
		statusText,
		icon,
		rightContent,
		onClick,
		showArrow = true,
		badge,
		badgeType = 'default'
	}: {
		title: string;
		subtitle?: string;
		description?: string;
		status?: string;
		statusText?: string;
		icon?: string;
		rightContent?: string;
		onClick?: () => void;
		showArrow?: boolean;
		badge?: string;
		badgeType?: 'default' | 'success' | 'warning' | 'error' | 'info';
	} = $props();

	const statusColors: Record<string, string> = {
		draft: 'bg-gray-100 text-gray-600',
		pending: 'bg-yellow-100 text-yellow-700',
		processing: 'bg-blue-100 text-blue-700',
		approved: 'bg-green-100 text-green-700',
		rejected: 'bg-red-100 text-red-700',
		completed: 'bg-green-100 text-green-700',
		cancelled: 'bg-gray-100 text-gray-500'
	};

	const badgeColors: Record<string, string> = {
		default: 'bg-gray-100 text-gray-600',
		success: 'bg-green-100 text-green-700',
		warning: 'bg-yellow-100 text-yellow-700',
		error: 'bg-red-100 text-red-700',
		info: 'bg-blue-100 text-blue-700'
	};

	const statusMap: Record<string, string> = {
		draft: '草稿',
		pending: '待审批',
		processing: '处理中',
		approved: '已批准',
		rejected: '已驳回',
		completed: '已完成',
		cancelled: '已取消'
	};

	const iconMap: Record<string, string> = {
		change: '📋',
		acceptance: '📷',
		checkin: '⏰',
		aftersales: '🔧',
		material: '📦',
		default: '📄'
	};

	$effect(() => {
		if (!statusText && status) {
			statusText = statusMap[status] || status;
		}
	});
</script>

<div
	class="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-3 active:bg-gray-50 transition-colors"
	onclick={onClick}
	role={onClick ? 'button' : undefined}
	tabindex={onClick ? 0 : undefined}
	onkeydown={(e) => {
		if (onClick && (e.key === 'Enter' || e.key === ' ')) {
			e.preventDefault();
			onClick();
		}
	}}
>
	<div class="flex items-start gap-3">
		{#if icon}
			<div class="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center text-2xl flex-shrink-0">
				{iconMap[icon] || iconMap.default}
			</div>
		{/if}
		<div class="flex-1 min-w-0">
			<div class="flex items-center gap-2 flex-wrap">
				<h3 class="font-semibold text-gray-900 truncate">{title}</h3>
				{#if status}
					<span class="px-2 py-0.5 rounded-full text-xs font-medium {statusColors[status] || statusColors.default}">
						{statusText || statusMap[status] || status}
					</span>
				{/if}
				{#if badge}
					<span class="px-2 py-0.5 rounded-full text-xs font-medium {badgeColors[badgeType]}">
						{badge}
					</span>
				{/if}
			</div>
			{#if subtitle}
				<p class="text-sm text-gray-500 mt-1">{subtitle}</p>
			{/if}
			{#if description}
				<p class="text-sm text-gray-600 mt-2 line-clamp-2">{description}</p>
			{/if}
			{#if rightContent}
				<p class="text-sm text-primary-600 mt-2">{rightContent}</p>
			{/if}
			<slot />
		</div>
		{#if showArrow && onClick}
			<div class="flex-shrink-0 text-gray-400 self-center">
				<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
				</svg>
			</div>
		{/if}
	</div>
</div>
