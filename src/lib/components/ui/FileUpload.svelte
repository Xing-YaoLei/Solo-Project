<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { cn } from '$lib/utils/cn';
	import { Upload, X, FileText, Image, File, Download } from 'lucide-svelte';
	import { formatFileSize } from '$lib/utils/format';

	type UploadedFile = {
		id: string;
		file: File;
		name: string;
		size: number;
		type: string;
		preview?: string;
		status: 'uploading' | 'success' | 'error';
		progress?: number;
		url?: string;
	};

	export let files: UploadedFile[] = [];
	export let accept = '';
	export let multiple = true;
	export let maxSize = 10 * 1024 * 1024;
	export let maxFiles = 20;
	export let disabled = false;
	export let dropzoneText = '拖拽文件到此处，或点击选择';
	export let hint = '';
	export let showPreview = true;
	let className: string | undefined = undefined;
	export { className as class };
	export let showList = true;

	const dispatch = createEventDispatcher<{
		filesChange: UploadedFile[];
		fileAdded: UploadedFile;
		fileRemoved: { id: string; file: File };
	}>();

	let isDragging = false;
	let inputEl: HTMLInputElement;

	function generateId(): string {
		return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
	}

	function isImage(file: File): boolean {
		return file.type.startsWith('image/');
	}

	async function addFiles(fileList: FileList | File[]) {
		const fileArray = Array.from(fileList);
		const remaining = maxFiles - files.length;
		const toAdd = fileArray.slice(0, Math.max(0, remaining));

		for (const file of toAdd) {
			if (file.size > maxSize) continue;

			const uploaded: UploadedFile = {
				id: generateId(),
				file,
				name: file.name,
				size: file.size,
				type: file.type,
				status: 'success',
				progress: 100
			};

			if (showPreview && isImage(file)) {
				uploaded.preview = URL.createObjectURL(file);
			}

			files = [...files, uploaded];
			dispatch('fileAdded', uploaded);
		}

		dispatch('filesChange', files);
	}

	function handleDrop(e: DragEvent) {
		e.preventDefault();
		isDragging = false;
		if (disabled || !e.dataTransfer) return;
		addFiles(e.dataTransfer.files);
	}

	function handleDragOver(e: DragEvent) {
		e.preventDefault();
		if (!disabled) isDragging = true;
	}

	function handleDragLeave() {
		isDragging = false;
	}

	function handleInputChange(e: Event) {
		const target = e.target as HTMLInputElement;
		if (target.files) addFiles(target.files);
		target.value = '';
	}

	function removeFile(id: string) {
		const idx = files.findIndex((f) => f.id === id);
		if (idx === -1) return;
		const removed = files[idx];
		if (removed.preview) URL.revokeObjectURL(removed.preview);
		files = files.filter((f) => f.id !== id);
		dispatch('fileRemoved', { id, file: removed.file });
		dispatch('filesChange', files);
	}

	function getFileIcon(type: string): typeof Image {
		if (type.startsWith('image/')) return Image;
		if (type.startsWith('application/pdf') || type.includes('word') || type.includes('excel')) return FileText;
		return File;
	}
</script>

<div class={cn('w-full', className)}>
	<div
		role="button"
		tabindex={disabled ? -1 : 0}
		class={cn(
			'relative rounded-xl border-2 border-dashed transition-all duration-200 p-6 text-center',
			disabled
				? 'border-industrial-800 bg-industrial-900/30 opacity-50 cursor-not-allowed'
				: isDragging
					? 'border-primary-500 bg-primary-600/10 shadow-glow-primary'
					: 'border-industrial-700 bg-industrial-800/40 hover:border-industrial-600 hover:bg-industrial-800/60 cursor-pointer',
			'focus:outline-none focus:ring-2 focus:ring-primary-500/50'
		)}
		on:click={() => !disabled && inputEl?.click()}
		on:keydown={(e) => {
			if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
				e.preventDefault();
				inputEl?.click();
			}
		}}
		on:drop={handleDrop}
		on:dragover={handleDragOver}
		on:dragleave={handleDragLeave}
	>
		<input
			bind:this={inputEl}
			type="file"
			{accept}
			{multiple}
			{disabled}
			class="hidden"
			on:change={handleInputChange}
		/>

		<div class="flex flex-col items-center gap-3">
			<div class={cn(
				'w-12 h-12 rounded-xl flex items-center justify-center transition-colors',
				isDragging ? 'bg-primary-600/30 text-primary-400' : 'bg-industrial-700/60 text-industrial-400'
			)}>
				<Upload class="w-6 h-6" strokeWidth={2} />
			</div>
			<div>
				<p class="text-sm font-medium text-industrial-200">{dropzoneText}</p>
				{#if hint}
					<p class="mt-1 text-xs text-industrial-500">{hint}</p>
				{:else}
					<p class="mt-1 text-xs text-industrial-500">
						支持 {accept || '所有文件'} · 单文件最大 {formatFileSize(maxSize)} · 最多 {maxFiles} 个
					</p>
				{/if}
			</div>
		</div>
	</div>

	{#if showList && files.length > 0}
		<div class="mt-4 space-y-2">
			{#each files as f}
				<div class={cn(
					'group flex items-center gap-3 p-3 rounded-lg border transition-all duration-200',
					f.status === 'error'
						? 'bg-danger-500/5 border-danger-500/30'
						: 'bg-industrial-800/60 border-industrial-700 hover:border-industrial-600'
				)}>
					{#if f.preview}
						<div class="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-industrial-900 border border-industrial-700">
							<img src={f.preview} alt={f.name} class="w-full h-full object-cover" />
						</div>
					{:else}
						<div class="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 bg-industrial-700/60 text-industrial-400 border border-industrial-700">
							<svelte:component this={getFileIcon(f.type)} class="w-5 h-5" strokeWidth={2} />
						</div>
					{/if}

					<div class="flex-1 min-w-0">
						<p class="text-sm font-medium text-industrial-100 truncate">{f.name}</p>
						<div class="flex items-center gap-2 mt-0.5">
							<span class="text-xs text-industrial-500 font-numeric">{formatFileSize(f.size)}</span>
							{#if f.status === 'uploading'}
								<div class="flex-1 h-1.5 bg-industrial-700 rounded-full overflow-hidden max-w-32">
									<div
										class="h-full bg-primary-500 transition-all duration-300"
										style={'width: ' + (f.progress ?? 0) + '%'}
									/>
								</div>
							{:else if f.status === 'success'}
								<span class="text-xs text-success-400">已就绪</span>
							{:else if f.status === 'error'}
								<span class="text-xs text-danger-400">上传失败</span>
							{/if}
						</div>
					</div>

					<div class="flex items-center gap-1 flex-shrink-0">
						{#if f.url}
							<button
								type="button"
								class="p-1.5 rounded-md text-industrial-400 hover:text-industrial-200 hover:bg-industrial-700/50 transition-colors opacity-0 group-hover:opacity-100"
								title="下载"
							>
								<Download class="w-4 h-4" strokeWidth={2} />
							</button>
						{/if}
						{#if !disabled}
							<button
								type="button"
								on:click={() => removeFile(f.id)}
								class="p-1.5 rounded-md text-industrial-400 hover:text-danger-400 hover:bg-danger-500/10 transition-colors"
								title="移除"
							>
								<X class="w-4 h-4" strokeWidth={2} />
							</button>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
