<script lang="ts">
</script>

<svelte:head>
	<title>演出排期协同台</title>
</svelte:head>

<div class="redirecting">
	<div class="spinner"></div>
	<span>正在进入排期管理...</span>
</div>

<style>
	.redirecting {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 12px;
		height: 100vh;
		color: #64748b;
		font-size: 14px;
	}

	.spinner {
		width: 20px;
		height: 20px;
		border: 2px solid #e2e8f0;
		border-top-color: #3b82f6;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
</style>
