<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';
	import { cn } from '$lib/utils/cn';
	import { X } from 'lucide-svelte';
	import type { ComponentType, SvelteComponentTyped } from 'svelte';

	export let open = false;
	export let size: 'sm' | 'md' | 'lg' | 'xl' = 'md';
	export let title = '';
	export let description = '';
	export let hideClose = false;
	export let preventClose = false;
	export let icon: ComponentType<SvelteComponentTyped> | undefined = undefined;
	let className: string | undefined = undefined;
	export { className as class };

	const dispatch = createEventDispatcher<{
		openChange: boolean;
		close: void;
	}>();

	$: if (open !== undefined) {
		dispatch('openChange', open);
	}

	function handleClose() {
		if (preventClose) return;
		open = false;
		dispatch('close');
	}

	function handleOverlayClick(e: MouseEvent) {
		if (e.target === e.currentTarget) {
			handleClose();
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape' && open) {
			handleClose();
		}
	}

	onMount(() => {
		document.addEventListener('keydown', handleKeydown);
		return () => document.removeEventListener('keydown', handleKeydown);
	});

	$: sizeClasses = {
		sm: 'sm:max-w-md',
		md: 'sm:max-w-lg',
		lg: 'sm:max-w-2xl',
		xl: 'sm:max-w-4xl'
	}[size];
</script>

{#if open}
	<div class="fixed inset-0 z-50">
		<div
			class="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm animate-fade-in"
			on:click={handleOverlayClick}
			role="presentation"
		/>
		<div class="fixed inset-0 z-50 flex items-center justify-center p-4">
			<div
				role="dialog"
				aria-modal="true"
				class={cn(
					'w-full grid gap-0 border border-industrial-700 bg-industrial-800 shadow-industrial-lg rounded-xl overflow-hidden animate-fade-in',
					sizeClasses,
					className
				)}
			>
				<div class="flex items-start justify-between gap-4 px-6 py-4 border-b border-industrial-700">
					<div class="flex items-start gap-3">
						{#if icon}
							<div class="flex-shrink-0 w-10 h-10 rounded-lg bg-primary-600/20 border border-primary-500/30 flex items-center justify-center text-primary-400">
								<svelte:component this={icon} class="w-5 h-5" strokeWidth={2} />
							</div>
						{/if}
						<div>
							{#if $$slots.title || title}
								<h2 class="text-lg font-semibold text-white">
									{#if $$slots.title}
										<slot name="title" />
									{:else}
										{title}
									{/if}
								</h2>
							{/if}
							{#if $$slots.description || description}
								<p class="text-sm text-industrial-400 mt-1">
									{#if $$slots.description}
										<slot name="description" />
									{:else}
										{description}
									{/if}
								</p>
							{/if}
						</div>
					</div>
					{#if !hideClose && !preventClose}
						<button
							type="button"
							on:click={handleClose}
							class="flex-shrink-0 rounded-lg p-1.5 text-industrial-400 hover:bg-industrial-700 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500/50"
							aria-label="关闭"
						>
							<X class="w-5 h-5" strokeWidth={2} />
						</button>
					{/if}
				</div>

				<div class="px-6 py-5 overflow-y-auto max-h-[60vh]">
					<slot />
				</div>

				{#if $$slots.footer}
					<div class="px-6 py-4 border-t border-industrial-700 bg-industrial-800/50 flex justify-end gap-3">
						<slot name="footer" />
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}
