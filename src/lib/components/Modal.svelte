<script lang="ts">
	import { cn } from '$lib/utils/cn';
	import { X } from 'lucide-svelte';
	import { createEventDispatcher, onMount, onDestroy } from 'svelte';

	export let open = false;
	export let title = '';
	export let size: 'sm' | 'md' | 'lg' | 'xl' = 'md';
	export let closable = true;
	export let className = '';
	export let footerClassName = '';

	const dispatch = createEventDispatcher<{ close: void }>();

	const sizeClasses: Record<typeof size, string> = {
		sm: 'max-w-sm',
		md: 'max-w-md',
		lg: 'max-w-lg',
		xl: 'max-w-2xl'
	};

	function handleClose() {
		dispatch('close');
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape' && open && closable) {
			handleClose();
		}
	}

	onMount(() => {
		document.addEventListener('keydown', handleKeydown);
	});

	onDestroy(() => {
		document.removeEventListener('keydown', handleKeydown);
	});

	$: if (open) {
		document.body.style.overflow = 'hidden';
	} else {
		document.body.style.overflow = '';
	}
</script>

{#if open}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center p-4"
		role="dialog"
		aria-modal="true"
		aria-labelledby={title ? undefined : undefined}
	>
		<div
			class="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
			on:click={() => closable && handleClose()}
		/>

		<div
			class={cn(
				'relative w-full card shadow-card-hover animate-in fade-in zoom-in-95 duration-200',
				sizeClasses[size],
				className
			)}
		>
			{#if title || closable}
				<div class="flex items-center justify-between px-6 py-4 border-b border-gray-100">
					{#if title}
						<h3 class="text-lg font-semibold text-gray-800">{title}</h3>
					{/if}
					{#if closable}
						<button
							type="button"
							on:click={handleClose}
							class="p-1.5 -mr-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
							aria-label="关闭"
						>
							<X class="w-5 h-5" />
						</button>
					{/if}
				</div>
			{/if}

			<div class="px-6 py-4">
				<slot />
			</div>

			{#if $$slots.footer}
				<div class={cn('flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100', footerClassName)}>
					<slot name="footer" />
				</div>
			{/if}
		</div>
	</div>
{/if}
