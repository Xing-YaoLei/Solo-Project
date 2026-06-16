<script lang="ts">
	import { onMount } from 'svelte';
	import { Mail, Lock, LogIn, AlertCircle } from 'lucide-svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { auth } from '$lib/stores/auth';
	import { createTRPCProxyClient, resetTRPCClient } from '$lib/trpc/client';
	import { cn } from '$lib/utils/cn';
	import type { UserRole } from '$shared/types';
	let email = '';

	onMount(() => {
		if ($page.data.user) goto('/');
	});
</script>

<h1>Simple Login {email}</h1>
<Mail class="w-5 h-5" />
<Lock class="w-5 h-5" />
<LogIn class="w-5 h-5" />
<AlertCircle class="w-5 h-5" />
<p class={cn('text-red-500')}>Test</p>
