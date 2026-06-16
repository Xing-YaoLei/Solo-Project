<script lang="ts">
	import { cn } from '$lib/utils/cn';
	import { Check, Circle } from 'lucide-svelte';
	import type { ComponentType } from 'svelte';

	export interface TimelineItem {
		id: string;
		title: string;
		description?: string;
		time?: Date | string;
		status?: 'completed' | 'current' | 'pending';
		icon?: ComponentType;
		extra?: unknown;
	}

	export let items: TimelineItem[] = [];
	export let className = '';

	function formatTime(time: Date | string | undefined): string {
		if (!time) return '';
		const date = time instanceof Date ? time : new Date(time);
		return date.toLocaleString('zh-CN', {
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function getStatusColor(status: TimelineItem['status']): { dot: string; line: string; badge: string } {
		switch (status) {
			case 'completed':
				return {
					dot: 'bg-mint-500 border-mint-500',
					line: 'bg-mint-200',
					badge: 'bg-mint-50 text-mint-700 border-mint-200'
				};
			case 'current':
				return {
					dot: 'bg-primary-600 border-primary-600',
					line: 'bg-primary-200',
					badge: 'bg-primary-50 text-primary-700 border-primary-200'
				};
			case 'pending':
			default:
				return {
					dot: 'bg-white border-gray-300',
					line: 'bg-gray-200',
					badge: 'bg-gray-50 text-gray-500 border-gray-200'
				};
		}
	}

	function getStatusLabel(status: TimelineItem['status']): string {
		switch (status) {
			case 'completed':
				return '已完成';
			case 'current':
				return '进行中';
			case 'pending':
			default:
				return '待处理';
		}
	}
</script>

<ol class={cn('relative', className)}>
	{#each items as item, index}
		{@const colors = getStatusColor(item.status)}
		{@const isLast = index === items.length - 1}
		<li class="relative pl-10 pb-6">
			{#if !isLast}
				<span
					class={cn(
						'absolute left-[11px] top-6 w-0.5 bottom-0',
						colors.line
					)}
				/>
			{/if}

			<span
				class={cn(
					'absolute left-0 top-0 w-6 h-6 rounded-full border-2 flex items-center justify-center',
					colors.dot
				)}
			>
				{#if item.status === 'completed'}
					<Check class="w-3.5 h-3.5 text-white" strokeWidth={3} />
				{:else if item.status === 'current'}
					<span class="w-2 h-2 rounded-full bg-white" />
				{:else if item.icon}
					<svelte:component this={item.icon} class="w-3.5 h-3.5 text-gray-400" />
				{:else}
					<Circle class="w-2 h-2 text-gray-300" fill="currentColor" />
				{/if}
			</span>

			<div class="space-y-1.5">
				<div class="flex items-center gap-2 flex-wrap">
					<h4 class="text-sm font-semibold text-gray-800">{item.title}</h4>
					<span class={cn('badge border text-[11px]', colors.badge)}>
						{getStatusLabel(item.status)}
					</span>
				</div>
				{#if item.description}
					<p class="text-sm text-gray-600 leading-relaxed">{item.description}</p>
				{/if}
				{#if item.time}
					<p class="text-xs text-gray-400">{formatTime(item.time)}</p>
				{/if}
				{#if item.extra}
					<div class="pt-1">
						<slot name="extra" {item} {index} />
					</div>
				{/if}
			</div>
		</li>
	{/each}
</ol>
