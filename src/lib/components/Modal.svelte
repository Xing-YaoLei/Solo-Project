<script lang="ts">
	let { open, title, onClose }: { open: boolean; title?: string; onClose?: () => void } = $props();

	function handleBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget && onClose) {
			onClose();
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape' && onClose) {
			onClose();
		}
	}
</script>

{#if open}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-gray-500/75 transition-opacity"
		onclick={handleBackdropClick}
		onkeydown={handleKeydown}
		tabindex={-1}
		role="dialog"
		aria-modal="true"
	>
		<div class="relative w-full max-w-lg transform overflow-hidden rounded-lg bg-white shadow-xl transition-all">
			{#if title}
				<div class="flex items-center justify-between border-b border-gray-200 px-6 py-4">
					<h3 class="text-lg font-semibold text-gray-900">{title}</h3>
					{#if onClose}
						<button
							type="button"
							class="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
							onclick={onClose}
						>
							<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
							</svg>
						</button>
					{/if}
				</div>
			{/if}
			<div class="px-6 py-4">
				<slot />
			</div>
		</div>
	</div>
{/if}
