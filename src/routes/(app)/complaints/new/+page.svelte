<script lang="ts">
	import { goto } from '$app/navigation';
	import { trpc } from '$lib/client/trpc';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let description = $state('');
	let selectedTagIds = $state<string[]>([]);
	let deadlineHours = $state('24');
	let attachments = $state<{ file: File; preview?: string }[]>([]);
	let submitting = $state(false);
	let error = $state('');

	function formatFileSize(bytes: number): string {
		if (bytes < 1024) return bytes + ' B';
		if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
		return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
	}

	function handleFileChange(e: Event) {
		const input = e.target as HTMLInputElement;
		if (!input.files) return;
		for (const file of Array.from(input.files)) {
			if (file.size > 10 * 1024 * 1024) {
				error = `文件 ${file.name} 超过 10MB 限制`;
				continue;
			}
			const att = { file } as { file: File; preview?: string };
			if (file.type.startsWith('image/')) {
				att.preview = URL.createObjectURL(file);
			}
			attachments = [...attachments, att];
		}
		input.value = '';
	}

	function removeAttachment(index: number) {
		attachments = attachments.filter((_, i) => i !== index);
	}

	function toggleTag(tagId: string) {
		if (selectedTagIds.includes(tagId)) {
			selectedTagIds = selectedTagIds.filter((id) => id !== tagId);
		} else {
			selectedTagIds = [...selectedTagIds, tagId];
		}
	}

	const typeTags = $derived(data.tags.filter((t: any) => t.category === 'type'));
	const areaTags = $derived(data.tags.filter((t: any) => t.category === 'area'));
	const priorityTags = $derived(data.tags.filter((t: any) => t.category === 'priority'));

	async function handleSubmit() {
		if (!description.trim()) {
			error = '请填写投诉描述';
			return;
		}
		submitting = true;
		error = '';
		try {
			const deadline = new Date(Date.now() + parseInt(deadlineHours) * 60 * 60 * 1000);

			const uploadedUrls: { fileName: string; fileUrl: string; fileType: string }[] = [];
			for (const att of attachments) {
				const formData = new FormData();
				formData.append('file', att.file);
				const res = await fetch('/api/upload', {
					method: 'POST',
					body: formData
				});
				if (!res.ok) {
					throw new Error(`上传 ${att.file.name} 失败`);
				}
				const uploadResult = await res.json();
				uploadedUrls.push({
					fileName: att.file.name,
					fileUrl: uploadResult.url,
					fileType: att.file.type || 'application/octet-stream'
				});
			}

			const complaint = await trpc.complaint.create.mutate({
				description: description.trim(),
				tagIds: selectedTagIds.length > 0 ? selectedTagIds : undefined,
				deadline: deadline.toISOString(),
				attachments: uploadedUrls.length > 0 ? uploadedUrls : undefined
			});

			await goto(`/complaints/${complaint.id}`);
		} catch (e: any) {
			error = e?.message || '提交失败，请重试';
		} finally {
			submitting = false;
		}
	}
</script>

<svelte:head>
	<title>新建投诉 - 景区投诉协同台</title>
</svelte:head>

<div class="space-y-4">
	<div class="flex items-center gap-4">
		<button onclick={() => goto('/complaints')} class="text-slate-500 hover:text-slate-700 transition">
			<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
				<path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
			</svg>
		</button>
		<h1 class="text-2xl font-bold text-slate-800">新建投诉</h1>
	</div>

	<div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
		<div class="lg:col-span-2 space-y-4">
			<div class="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-5">
				{#if error}
					<div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
						{error}
					</div>
				{/if}

				<div>
					<label class="block text-sm font-medium text-slate-700 mb-2">
						投诉描述 <span class="text-red-500">*</span>
					</label>
					<textarea
						bind:value={description}
						rows={6}
						class="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
						placeholder="请详细描述遇到的问题，包括时间、地点、经过等..."
					></textarea>
					<p class="text-xs text-slate-400 mt-1">{description.length} / 2000 字</p>
				</div>

				<div>
					<label class="block text-sm font-medium text-slate-700 mb-2">问题类型</label>
					<div class="flex flex-wrap gap-2">
						{#each typeTags as tag}
							<button
								type="button"
								onclick={() => toggleTag(tag.id)}
								class="px-3 py-1.5 text-sm rounded-full border transition {selectedTagIds.includes(tag.id)
									? 'bg-primary-50 border-primary-500 text-primary-700'
									: 'bg-white border-slate-300 text-slate-600 hover:border-slate-400'}"
							>
								{tag.label}
							</button>
						{:else}
							<p class="text-sm text-slate-400">暂无类型标签</p>
						{/each}
					</div>
				</div>

				<div>
					<label class="block text-sm font-medium text-slate-700 mb-2">发生区域</label>
					<div class="flex flex-wrap gap-2">
						{#each areaTags as tag}
							<button
								type="button"
								onclick={() => toggleTag(tag.id)}
								class="px-3 py-1.5 text-sm rounded-full border transition {selectedTagIds.includes(tag.id)
									? 'bg-primary-50 border-primary-500 text-primary-700'
									: 'bg-white border-slate-300 text-slate-600 hover:border-slate-400'}"
							>
								{tag.label}
							</button>
						{:else}
							<p class="text-sm text-slate-400">暂无区域标签</p>
						{/each}
					</div>
				</div>

				<div>
					<label class="block text-sm font-medium text-slate-700 mb-2">紧急程度</label>
					<div class="flex flex-wrap gap-2">
						{#each priorityTags as tag}
							<button
								type="button"
								onclick={() => toggleTag(tag.id)}
								class="px-3 py-1.5 text-sm rounded-full border transition {selectedTagIds.includes(tag.id)
									? 'bg-primary-50 border-primary-500 text-primary-700'
									: 'bg-white border-slate-300 text-slate-600 hover:border-slate-400'}"
							>
								{tag.label}
							</button>
						{:else}
							<p class="text-sm text-slate-400">暂无优先级标签</p>
						{/each}
					</div>
				</div>

				<div>
					<label class="block text-sm font-medium text-slate-700 mb-2">证据附件</label>
					<div class="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-primary-400 hover:bg-primary-50/30 transition cursor-pointer">
						<input
							type="file"
							multiple
							accept="image/*,video/*,.pdf,.doc,.docx"
							onchange={handleFileChange}
							class="hidden"
							id="file-input"
						/>
						<label for="file-input" class="cursor-pointer">
							<div class="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-2">
								<svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
									<path stroke-linecap="round" stroke-linejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
								</svg>
							</div>
							<p class="text-sm text-slate-600">点击或拖拽上传文件</p>
							<p class="text-xs text-slate-400 mt-1">支持图片、视频、PDF、Word，单文件不超过 10MB</p>
						</label>
					</div>

					{#if attachments.length > 0}
						<div class="mt-3 space-y-2">
							{#each attachments as att, index}
								<div class="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
									{#if att.preview}
										<img src={att.preview} alt={att.file.name} class="w-12 h-12 object-cover rounded" />
									{:else}
										<div class="w-12 h-12 bg-slate-200 rounded flex items-center justify-center">
											<svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
												<path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
											</svg>
										</div>
									{/if}
									<div class="flex-1 min-w-0">
										<p class="text-sm text-slate-700 truncate">{att.file.name}</p>
										<p class="text-xs text-slate-400">{formatFileSize(att.file.size)}</p>
									</div>
									<button
										type="button"
										onclick={() => removeAttachment(index)}
										class="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition"
									>
										<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
											<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
										</svg>
									</button>
								</div>
							{/each}
						</div>
					{/if}
				</div>
			</div>
		</div>

		<div class="space-y-4">
			<div class="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
				<h3 class="text-sm font-semibold text-slate-800 mb-4">提交设置</h3>
				<div class="space-y-4">
					<div>
						<label class="block text-sm font-medium text-slate-700 mb-1.5">处理时限</label>
						<select
							bind:value={deadlineHours}
							class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
						>
							<option value="2">2 小时内（紧急）</option>
							<option value="6">6 小时内</option>
							<option value="24">24 小时内（推荐）</option>
							<option value="48">48 小时内</option>
							<option value="72">72 小时内</option>
						</select>
					</div>

					<div class="pt-4 border-t border-slate-100 space-y-2">
						<button
							type="button"
							onclick={handleSubmit}
							disabled={submitting || !description.trim()}
							class="w-full py-2.5 px-4 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{submitting ? '提交中...' : '提交投诉'}
						</button>
						<button
							type="button"
							onclick={() => goto('/complaints')}
							class="w-full py-2.5 px-4 border border-slate-300 text-slate-600 text-sm font-medium rounded-lg hover:bg-slate-50 transition"
						>
							取消
						</button>
					</div>
				</div>
			</div>

			<div class="bg-blue-50 border border-blue-200 rounded-xl p-4">
				<div class="flex items-start gap-2">
					<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
					</svg>
					<div>
						<h4 class="text-sm font-medium text-blue-800">提交须知</h4>
						<ul class="text-xs text-blue-600 mt-1 space-y-0.5 list-disc list-inside">
							<li>真实描述问题，勿捏造事实</li>
							<li>提供准确的时间和地点</li>
							<li>附上证据图片可加快处理</li>
							<li>紧急问题请拨打景区服务热线</li>
						</ul>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
