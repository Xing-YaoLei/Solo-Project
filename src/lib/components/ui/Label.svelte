<script lang="ts">
	import { cn } from '$lib/utils/cn';

	let htmlFor: string | undefined = undefined;
	export { htmlFor as for };
	export let required = false;
	let className: string | undefined = undefined;
	export { className as class };
</script>

<label
	for={htmlFor}
	class={cn(
		'text-sm font-medium text-industrial-200 select-none',
		required && "after:content-['*'] after:ml-1 after:text-accent-400",
		className
	)}
>
	<slot />
</label>
