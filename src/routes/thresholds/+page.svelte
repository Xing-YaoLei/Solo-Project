<script lang="ts">
	import { onMount } from 'svelte';

	interface ThresholdConfig {
		id?: number;
		config_key: string;
		config_value: string;
		description?: string;
		category?: string;
		updated_at?: string;
	}

	let loading = $state(true);
	let saving = $state(false);
	let thresholds: ThresholdConfig[] = $state([]);
	let categories: string[] = $state([]);
	let activeCategory = $state('');
	let saveMessage = $state('');
	let saveSuccess = $state(false);

	const filteredThresholds = $derived(activeCategory
		? thresholds.filter((t) => t.category === activeCategory)
		: thresholds);

	async function loadData() {
		loading = true;
		saveMessage = '';
		try {
			const res = await fetch('/api/thresholds');
			const data = await res.json();
			thresholds = data.data.thresholds || [];
			categories = data.data.categories || [];
		} catch (e) {
			console.error('加载数据失败', e);
		} finally {
			loading = false;
		}
	}

	async function saveThresholds() {
		saving = true;
		saveMessage = '';
		try {
			const configs = thresholds.map((t) => ({
				key: t.config_key,
				value: t.config_value
			}));

			const res = await fetch('/api/thresholds', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ configs })
			});

			const data = await res.json();
			saveSuccess = data.success;
			saveMessage = data.message;

			if (data.success) {
				setTimeout(() => {
					saveMessage = '';
				}, 3000);
			}
		} catch (e) {
			saveSuccess = false;
			saveMessage = e instanceof Error ? e.message : '保存失败';
		} finally {
			saving = false;
		}
	}

	function getCategoryLabel(category: string): string {
		const labels: Record<string, string> = {
			completion: '📊 完成率',
			score: '📈 成绩',
			timeliness: '⏰ 时效性',
			feedback: '💬 反馈',
			tag: '🏷️ 知识点',
			progress: '📅 进度',
			review: '📋 复盘'
		};
		return labels[category] || category;
	}

	function getInputType(key: string): string {
		if (key.includes('rate') || key.includes('score') || key.includes('threshold') || key.includes('lag')) {
			return 'number';
		}
		if (key.includes('auto')) {
			return 'checkbox';
		}
		return 'text';
	}

	function updateValue(threshold: ThresholdConfig, value: string) {
		threshold.config_value = value;
	}

	function toggleBoolean(threshold: ThresholdConfig) {
		threshold.config_value = threshold.config_value === 'true' ? 'false' : 'true';
	}

	onMount(() => {
		loadData();
	});
</script>

<div class="space-y-6">
	<div class="flex items-center justify-between flex-wrap gap-4">
		<div>
			<h2 class="text-2xl font-bold text-gray-800">阈值配置</h2>
			<p class="text-gray-500 mt-1">调整风险预警阈值，无需技术人员参与</p>
		</div>
		<div class="flex items-center gap-3">
			<button
				onclick={loadData}
				disabled={loading || saving}
				class="px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors text-sm disabled:opacity-50"
			>
				🔄 重置
			</button>
			<button
				onclick={saveThresholds}
				disabled={loading || saving}
				class="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors text-sm disabled:opacity-50"
			>
				{saving ? '💾 保存中...' : '💾 保存配置'}
			</button>
		</div>
	</div>

	{#if saveMessage}
		<div
			class="p-4 rounded-lg {saveSuccess ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}"
		>
			{saveSuccess ? '✅' : '❌'} {saveMessage}
		</div>
	{/if}

	{#if loading}
		<div class="flex items-center justify-center py-20">
			<div class="text-center">
				<div class="text-4xl mb-4">⏳</div>
				<p class="text-gray-500">正在加载配置...</p>
			</div>
		</div>
	{:else}
		<div class="flex flex-wrap gap-2">
			<button
				onclick={() => (activeCategory = '')}
				class="px-4 py-2 rounded-lg text-sm font-medium transition-colors
					{!activeCategory ? 'bg-primary-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-100 border'}"
			>
				全部
			</button>
			{#each categories as category (category)}
				<button
					onclick={() => (activeCategory = category)}
					class="px-4 py-2 rounded-lg text-sm font-medium transition-colors
						{activeCategory === category
							? 'bg-primary-500 text-white'
							: 'bg-white text-gray-600 hover:bg-gray-100 border'}"
				>
					{getCategoryLabel(category)}
				</button>
			{/each}
		</div>

		<div class="bg-white rounded-lg shadow-sm overflow-hidden">
			<div class="divide-y">
				{#each filteredThresholds as threshold (threshold.config_key)}
					<div class="p-4 hover:bg-gray-50 transition-colors">
						<div class="flex items-center justify-between gap-4">
							<div class="flex-1 min-w-0">
								<div class="flex items-center gap-2 mb-1">
									<span class="font-medium text-gray-800">{threshold.description || threshold.config_key}</span>
									{#if threshold.category}
										<span class="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
											{getCategoryLabel(threshold.category)}
										</span>
									{/if}
								</div>
								<p class="text-xs text-gray-500 font-mono">{threshold.config_key}</p>
								{#if threshold.updated_at}
									<p class="text-xs text-gray-400 mt-1">最后更新: {threshold.updated_at}</p>
								{/if}
							</div>
							<div class="flex-shrink-0">
								{#if getInputType(threshold.config_key) === 'checkbox'}
								<button
									onclick={() => toggleBoolean(threshold)}
									aria-label="切换 {threshold.description || threshold.config_key}"
									class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors
										{threshold.config_value === 'true' ? 'bg-primary-500' : 'bg-gray-300'}"
								>
									<span
										class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform
											{threshold.config_value === 'true' ? 'translate-x-6' : 'translate-x-1'}"
									></span>
								</button>
							{:else if getInputType(threshold.config_key) === 'number'}
								<div class="flex items-center gap-2">
									<input
										type="number"
										value={threshold.config_value}
										oninput={(e) => updateValue(threshold, (e.target as HTMLInputElement).value)}
										class="w-24 px-3 py-2 border rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-primary-500"
										step="0.01"
									/>
										{#if threshold.config_key.includes('rate')}
											<span class="text-sm text-gray-500">（0-1）</span>
										{:else if threshold.config_key.includes('score')}
											<span class="text-sm text-gray-500">分</span>
										{:else if threshold.config_key.includes('hours')}
											<span class="text-sm text-gray-500">小时</span>
										{:else if threshold.config_key.includes('days')}
											<span class="text-sm text-gray-500">天</span>
										{:else if threshold.config_key.includes('threshold')}
											<span class="text-sm text-gray-500">次</span>
										{/if}
									</div>
								{:else}
									<input
										type="text"
										value={threshold.config_value}
										oninput={(e) => updateValue(threshold, (e.target as HTMLInputElement).value)}
										class="w-40 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
									/>
								{/if}
							</div>
						</div>
					</div>
				{/each}
			</div>
		</div>

		<div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
			<h4 class="font-medium text-yellow-800 mb-2">💡 使用说明</h4>
			<ul class="text-sm text-yellow-700 space-y-1">
				<li>• <strong>完成率阈值</strong>：低于该值时触发预警，0.7 表示 70%</li>
				<li>• <strong>成绩阈值</strong>：平均分低于该值时触发预警</li>
				<li>• <strong>时效性阈值</strong>：提交延迟超过该小时数触发预警</li>
				<li>• <strong>反馈阈值</strong>：负面反馈达到该次数触发预警</li>
				<li>• <strong>知识点阈值</strong>：正确率低于该值视为薄弱知识点</li>
				<li>• <strong>进度阈值</strong>：超过该天数未提交视为进度落后</li>
			</ul>
		</div>
	{/if}
</div>
