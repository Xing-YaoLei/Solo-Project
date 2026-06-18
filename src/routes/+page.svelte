<script lang="ts">
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import { currentUser } from '$lib/stores/auth';

	if (browser) {
		if ($currentUser) {
			goto('/dashboard', { replaceState: true });
		} else {
			goto('/login', { replaceState: true });
		}
	}
</script>

<div class="min-h-screen flex items-center justify-center">
	<div class="animate-pulse text-navy-400">加载中...</div>
</div>
