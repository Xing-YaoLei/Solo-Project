<script lang="ts">
	import { goto } from '$app/navigation';
	import {
		ArrowLeft,
		User,
		Calendar,
		MapPin,
		Heart,
		AlertCircle,
		Save,
		X
	} from 'lucide-svelte';
	import { createTRPCProxyClient } from '$lib/trpc/client';
	import { hasRole } from '$lib/stores/auth';
	import { cn } from '$lib/utils/cn';
	import { formatDate } from '$lib/utils/format';

	const trpc = createTRPCProxyClient();

	const canCreate = hasRole(['admin', 'supervisor', 'nurse']);

	let form = {
		name: '',
		gender: 'male' as 'male' | 'female',
		birthDate: '',
		idCard: '',
		roomNumber: '',
		admissionDate: formatDate(new Date()),
		allergiesInput: '',
		medicalHistoryInput: '',
		emergencyContactName: '',
		emergencyContactPhone: '',
		emergencyContactRelation: ''
	};

	let submitting = false;
	let error = '';

	async function handleSubmit() {
		error = '';
		if (!form.name.trim()) {
			error = '请填写姓名';
			return;
		}
		if (!form.birthDate) {
			error = '请选择出生日期';
			return;
		}

		const allergies = form.allergiesInput
			.split(/[,，、]/)
			.map((s) => s.trim())
			.filter(Boolean);
		const medicalHistory = form.medicalHistoryInput
			.split(/[,，、]/)
			.map((s) => s.trim())
			.filter(Boolean);

		submitting = true;
		try {
			const result = await trpc.elder.create.mutate({
				name: form.name.trim(),
				gender: form.gender,
				birthDate: new Date(form.birthDate),
				idCard: form.idCard || undefined,
				roomNumber: form.roomNumber || undefined,
				admissionDate: form.admissionDate ? new Date(form.admissionDate) : undefined,
				allergies,
				medicalHistory,
				emergencyContact:
					form.emergencyContactName || form.emergencyContactPhone
						? {
								name: form.emergencyContactName,
								phone: form.emergencyContactPhone,
								relation: form.emergencyContactRelation
							}
						: undefined
			});
			goto(`/elders/${result.id}`);
		} catch (e) {
			error = e instanceof Error ? e.message : '创建失败';
		} finally {
			submitting = false;
		}
	}

	function handleCancel() {
		goto('/elders');
	}
</script>

<div class="space-y-6">
	<div class="flex items-center gap-3">
		<button type="button" on:click={handleCancel} class="btn-secondary">
			<ArrowLeft class="w-4 h-4" />
			<span>返回</span>
		</button>
		<div>
			<h1 class="text-2xl font-serif font-bold text-gray-800">新增老人档案</h1>
			<p class="text-sm text-gray-500 mt-1">请填写老人基本信息</p>
		</div>
	</div>

	<form on:submit|preventDefault={handleSubmit} class="space-y-6">
		{#if error}
			<div class="card p-4 rounded-xl bg-danger-50 border border-danger-200 text-sm text-danger-700 flex items-start gap-2">
				<AlertCircle class="w-4 h-4 flex-shrink-0 mt-0.5" />
				<span>{error}</span>
			</div>
		{/if}

		<div class="card p-6">
			<h2 class="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
				<User class="w-5 h-5 text-primary-600" />
				基本信息
			</h2>
			<div class="grid grid-cols-1 md:grid-cols-2 gap-5">
				<div>
					<label class="label">姓名 <span class="text-danger-500">*</span></label>
					<input type="text" bind:value={form.name} placeholder="请输入姓名" class="input" disabled={submitting} />
				</div>

				<div>
					<label class="label">性别 <span class="text-danger-500">*</span></label>
					<div class="flex gap-4">
						<label class="flex items-center gap-2 cursor-pointer">
							<input
								type="radio"
								name="gender"
								bind:group={form.gender}
								value="male"
								class="w-4 h-4 text-primary-600"
								disabled={submitting}
							/>
							<span class="text-sm text-gray-700">男</span>
						</label>
						<label class="flex items-center gap-2 cursor-pointer">
							<input
								type="radio"
								name="gender"
								bind:group={form.gender}
								value="female"
								class="w-4 h-4 text-primary-600"
								disabled={submitting}
							/>
							<span class="text-sm text-gray-700">女</span>
						</label>
					</div>
				</div>

				<div>
					<label class="label">出生日期 <span class="text-danger-500">*</span></label>
					<div class="relative">
						<Calendar class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
						<input type="date" bind:value={form.birthDate} class="input pl-9" disabled={submitting} />
					</div>
				</div>

				<div>
					<label class="label">身份证号</label>
					<input type="text" bind:value={form.idCard} placeholder="18位身份证号" class="input" disabled={submitting} maxlength="18" />
				</div>

				<div>
					<label class="label">房间号</label>
					<div class="relative">
						<MapPin class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
						<input type="text" bind:value={form.roomNumber} placeholder="如：302" class="input pl-9" disabled={submitting} />
					</div>
				</div>

				<div>
					<label class="label">入住日期</label>
					<div class="relative">
						<Calendar class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
						<input type="date" bind:value={form.admissionDate} class="input pl-9" disabled={submitting} />
					</div>
				</div>
			</div>
		</div>

		<div class="card p-6">
			<h2 class="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
				<Heart class="w-5 h-5 text-danger-600" />
				健康信息
			</h2>
			<div class="grid grid-cols-1 gap-5">
				<div>
					<label class="label">过敏史</label>
					<input
						type="text"
						bind:value={form.allergiesInput}
						placeholder="多个过敏源用逗号或顿号分隔，如：青霉素、海鲜"
						class="input"
						disabled={submitting}
					/>
					<p class="text-xs text-gray-400 mt-1">多个项目请用逗号或顿号分隔</p>
				</div>
				<div>
					<label class="label">既往病史</label>
					<textarea
						bind:value={form.medicalHistoryInput}
						placeholder="如：高血压、糖尿病、心脏病等，多个疾病用逗号或顿号分隔"
						rows={3}
						class="input resize-none"
						disabled={submitting}
					/>
				</div>
			</div>
		</div>

		<div class="card p-6">
			<h2 class="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
				<User class="w-5 h-5 text-accent-600" />
				紧急联系人
			</h2>
			<div class="grid grid-cols-1 md:grid-cols-3 gap-5">
				<div>
					<label class="label">联系人姓名</label>
					<input
						type="text"
						bind:value={form.emergencyContactName}
						placeholder="请输入联系人姓名"
						class="input"
						disabled={submitting}
					/>
				</div>
				<div>
					<label class="label">联系电话</label>
					<input
						type="tel"
						bind:value={form.emergencyContactPhone}
						placeholder="请输入联系电话"
						class="input"
						disabled={submitting}
					/>
				</div>
				<div>
					<label class="label">与老人关系</label>
					<input
						type="text"
						bind:value={form.emergencyContactRelation}
						placeholder="如：子女、配偶"
						class="input"
						disabled={submitting}
					/>
				</div>
			</div>
		</div>

		<div class="flex items-center justify-end gap-3 pt-4">
			<button type="button" on:click={handleCancel} class="btn-secondary" disabled={submitting}>
				<X class="w-4 h-4" />
				<span>取消</span>
			</button>
			<button type="submit" class="btn-primary" disabled={submitting || !$canCreate}>
				{#if submitting}
					<div class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
					<span>保存中...</span>
				{:else}
					<Save class="w-4 h-4" />
					<span>保存档案</span>
				{/if}
			</button>
		</div>
	</form>
</div>
