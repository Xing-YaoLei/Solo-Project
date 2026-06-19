<script lang="ts">
	import { cn } from '$lib/utils/cn';
	import type { ComponentType, SvelteComponentTyped } from 'svelte';
	import { formatRelativeTime } from '$lib/utils/format';

	export type TimelineItem = {
		id?: string | number;
		title: string;
		description?: string;
		time?: Date | string;
		user?: string;
		icon?: typeof import('lucide-svelte').Circle;
		color?: 'primary' | 'accent' | 'success' | 'warning' | 'danger' | 'secondary';
		content?: unknown;
	};

	export let items: TimelineItem[] = [];
	let className: string | undefined = undefined;
	export { className as class };
	export let showTime = true;
	export let showUser = true;

	const colorMap: Record<string, string> = {
		primary: 'bg-primary-500 border-primary-400',
		accent: 'bg-accent-500 border-accent-400',
		success: 'bg-success-500 border-success-400',
		warning: 'bg-warning-500 border-warning-400',
		danger: 'bg-danger-500 border-danger-400',
		secondary: 'bg-industrial-600 border-industrial-500'
	};

	const iconBgMap: Record<string, string> = {
		primary: 'bg-primary-600/20 text-primary-400 border-primary-500/30',
		accent: 'bg-accent-500/20 text-accent-400 border-accent-500/30',
		success: 'bg-success-500/20 text-success-400 border-success-500/30',
		warning: 'bg-warning-500/20 text-warning-400 border-warning-500/30',
		danger: 'bg-danger-500/20 text-danger-400 border-danger-500/30',
		secondary: 'bg-industrial-700 text-industrial-400 border-industrial-600'
	};
</script>

<ol class={cn('relative', className)}>
	<div class="absolute left-[18px] top-2 bottom-2 w-px bg-industrial-700" />

	{#each items as item, index}
		<li class="relative pl-14 pb-6 last:pb-0">
			<div class="absolute left-0 flex items-center justify-center w-9 h-9 rounded-full border-2 bg-industrial-800 z-10 {iconBgMap[item.color ?? 'secondary']}">
				{#if item.icon}
					<svelte:component this={item.icon} class="w-4 h-4" strokeWidth={2} />
				{:else}
					<div class="w-2 h-2 rounded-full {colorMap[item.color ?? 'secondary']}" />
				{/if}
			</div>

			<div class="group">
				<div class="flex items-start justify-between gap-4 flex-wrap">
					<div class="flex-1 min-w-0">
						<h4 class="text-sm font-semibold text-industrial-100">
							<slot name="title" {item} {index}>
								{item.title}
							</slot>
						</h4>
						{#if item.description}
							<p class="mt-1 text-sm text-industrial-400 leading-relaxed">
								{item.description}
							</p>
						{/if}
						{#if item.content}
							<div class="mt-3">
								{#if typeof item.content === 'string'}
									<div class="text-sm text-industrial-300 bg-industrial-900/60 rounded-lg px-4 py-3 border border-industrial-700/50">
										{item.content}
									</div>
								{:else}
									<slot name="content" {item} {index} />
								{/if}
							</div>
						{/if}
						{#if !item.content && $$slots.content}
							<div class="mt-3">
								<slot name="content" {item} {index} />
							</div>
						{/if}
					</div>

					{#if showTime || showUser}
						<div class="flex items-center gap-3 flex-shrink-0 text-xs text-industrial-500">
							{#if showUser && item.user}
								<span class="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-industrial-900/60 border border-industrial-700/50">
									<svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
										<path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
										<circle cx="12" cy="7" r="4" />
									</svg>
									{item.user}
								</span>
							{/if}
							{#if showTime && item.time}
								<span class="text-industrial-400 font-numeric tabular-nums">
									{formatRelativeTime(item.time)}
								</span>
							{/if}
						</div>
					{/if}
				</div>
			</div>
		</li>
	{/each}

	{#if items.length === 0}
		<div class="text-center py-8 text-sm text-industrial-500">
			暂无记录
		</div>
	{/if}
</ol>
