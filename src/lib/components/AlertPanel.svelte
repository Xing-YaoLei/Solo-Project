<script lang="ts">
	export interface AlertItem {
		type: string;
		level: 'low' | 'medium' | 'high' | 'critical';
		message: string;
		detail: string;
		affectedStudents?: number;
		affectedAssignments?: number;
	}

	let { alerts = [] } = $props<{
		alerts?: AlertItem[];
	}>();

	function getLevelClass(level: string): string {
		switch (level) {
			case 'critical':
				return 'bg-red-50 border-red-200 text-red-800';
			case 'high':
				return 'bg-orange-50 border-orange-200 text-orange-800';
			case 'medium':
				return 'bg-yellow-50 border-yellow-200 text-yellow-800';
			default:
				return 'bg-green-50 border-green-200 text-green-800';
		}
	}

	function getLevelBadgeClass(level: string): string {
		switch (level) {
			case 'critical':
				return 'bg-red-500';
			case 'high':
				return 'bg-orange-500';
			case 'medium':
				return 'bg-yellow-500';
			default:
				return 'bg-green-500';
		}
	}

	function getLevelText(level: string): string {
		switch (level) {
			case 'critical':
				return '危急';
			case 'high':
				return '预警';
			case 'medium':
				return '关注';
			default:
				return '正常';
		}
	}

	function getTypeIcon(type: string): string {
		switch (type) {
			case 'completion':
				return '📊';
			case 'score':
				return '📈';
			case 'feedback':
				return '💬';
			case 'progress':
				return '⏰';
			case 'tags':
				return '🏷️';
			default:
				return '⚠️';
		}
	}
</script>

<div class="bg-white rounded-lg shadow-sm p-4">
	<h3 class="text-lg font-medium mb-4 flex items-center gap-2">
		<span>🚨</span>
		<span>风险预警</span>
		{#if alerts.length > 0}
			<span class="text-sm font-normal text-gray-500">共 {alerts.length} 条</span>
		{/if}
	</h3>

	{#if alerts.length === 0}
		<div class="text-center py-8 text-gray-500">
			<div class="text-4xl mb-2">✅</div>
			<p>暂无风险预警</p>
		</div>
	{:else}
		<div class="space-y-3 max-h-96 overflow-y-auto">
			{#each alerts as alert (alert.type + alert.message)}
				<div class="border rounded-lg p-3 {getLevelClass(alert.level)}">
					<div class="flex items-start gap-3">
						<span class="text-2xl">{getTypeIcon(alert.type)}</span>
						<div class="flex-1 min-w-0">
							<div class="flex items-center gap-2 mb-1">
								<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium text-white {getLevelBadgeClass(alert.level)}">
									{getLevelText(alert.level)}
								</span>
								<span class="font-medium">{alert.message}</span>
							</div>
							<p class="text-sm opacity-80">{alert.detail}</p>
							{#if alert.affectedStudents}
								<p class="text-xs mt-1 opacity-70">影响学生: {alert.affectedStudents} 人</p>
							{/if}
							{#if alert.affectedAssignments}
								<p class="text-xs mt-1 opacity-70">涉及知识点: {alert.affectedAssignments} 个</p>
							{/if}
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
