<script lang="ts">
	let { status }: { status: string } = $props();

	const statusConfig: Record<string, { label: string; class: string }> = {
		draft: { label: '草稿', class: 'bg-gray-100 text-gray-800' },
		pending: { label: '待处理', class: 'bg-yellow-100 text-yellow-800' },
		processing: { label: '处理中', class: 'bg-blue-100 text-blue-800' },
		approved: { label: '已批准', class: 'bg-green-100 text-green-800' },
		rejected: { label: '已拒绝', class: 'bg-red-100 text-red-800' },
		completed: { label: '已完成', class: 'bg-emerald-100 text-emerald-800' },
		cancelled: { label: '已取消', class: 'bg-gray-100 text-gray-600' }
	};

	const config = statusConfig[status] || { label: status, class: 'bg-gray-100 text-gray-800' };
</script>

<span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium {config.class}">
	{config.label}
</span>
