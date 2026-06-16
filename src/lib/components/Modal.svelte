<script lang="ts">
	export let open: boolean;
	export let title = '';
	export let size: 'md' | 'lg' | 'xl' = 'md';

	$: sizeClass = {
		md: '',
		lg: 'modal-lg',
		xl: 'modal-xl'
	}[size];

	function close() {
		open = false;
		dispatch('close');
	}

	import { createEventDispatcher } from 'svelte';
	const dispatch = createEventDispatcher();

	function handleBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) {
			close();
		}
	}
</script>

{#if open}
	<div class="modal-backdrop" on:click={handleBackdropClick}>
		<div class="modal {sizeClass}">
			<div class="modal-header">
				<h3 class="text-lg font-semibold">{title}</h3>
				<button class="p-1 hover:bg-gray-100 rounded transition-colors" on:click={close}>
					<svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				</button>
			</div>
			<slot />
		</div>
	</div>
{/if}
