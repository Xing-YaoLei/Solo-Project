<script lang="ts">
	import { cn } from '$lib/utils/cn';

	export let hoverable = false;
	let className: string | undefined = undefined;
	export { className as class };
	export let headerClass: string | undefined = undefined;
	export let contentClass: string | undefined = undefined;
	export let footerClass: string | undefined = undefined;
</script>

<div
	class={cn(
		'bg-industrial-800 border border-industrial-700 rounded-xl shadow-industrial overflow-hidden',
		hoverable && 'transition-all duration-200 hover:shadow-industrial-lg hover:border-industrial-600 cursor-pointer',
		className
	)}
>
	{#if $$slots.header}
		<div class={cn('px-5 py-4 border-b border-industrial-700 bg-industrial-800/50', headerClass)}>
			<slot name="header" />
		</div>
	{/if}

	<div class={cn('p-5', contentClass)}>
		<slot />
	</div>

	{#if $$slots.footer}
		<div class={cn('px-5 py-4 border-t border-industrial-700 bg-industrial-800/50', footerClass)}>
			<slot name="footer" />
		</div>
	{/if}
</div>
