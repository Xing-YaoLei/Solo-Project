<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import {
		reminderStatusMap,
		riskEventTypeMap,
		careLevelMap
	} from '$lib/client-utils';
	import { formatTime, formatDateTime, formatDate } from '$lib/server/utils';
	import Modal from '$lib/components/Modal.svelte';

	type Elderly = { id: string; name: string; roomNumber: string | null; careLevel: string };
	type Medication = { id: string; name: string; dosage: string; frequency: string; specificTimes: string; isActive: boolean };
	type Reminder = {
		reminder: { id: string; scheduledTime: number; status: string; notes: string | null };
		medication: Medication;
		elderly: Elderly;
	};

	let reminders: Reminder[] = [];
	let medications: Array<{ medication: Medication; elderly: Elderly }> = [];
	let elderlyList: Elderly[] = [];
	let loading = true;
	let filterDate = new Date();
	let filterStatus = '';
	let filterElderly = '';

	let showAddMedication = false;
	let newMed = {
		elderlyId: '',
		name: '',
		dosage: '',
		frequency: '每日',
		timesPerDay: 1,
		specificTimes: ['08:00'],
		route: '口服',
		notes: '',
		doctorName: ''
	};

	let user: App.Locals['user'];

	$: isNurseOrAbove = user?.role === 'admin' || user?.role === 'manager' || user?.role === 'nurse';
	$: filteredReminders = reminders.filter((r) => {
		if (filterStatus && r.reminder.status !== filterStatus) return false;
		if (filterElderly && r.elderly.id !== filterElderly) return false;
		return true;
	});

	onMount(async () => {
		await loadAll();
	});

	async function loadAll() {
		loading = true;
		try {
			const userRes = await fetch('/api/trpc/auth.getCurrentUser', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'auth.getCurrentUser' })
			});
			user = (await userRes.json()).result?.data;

			const dayStart = new Date(filterDate);
			dayStart.setHours(0, 0, 0, 0);

			const remindersRes = await fetch('/api/trpc/medication.reminders', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					jsonrpc: '2.0',
					id: 2,
					method: 'medication.reminders',
					params: { input: { date: dayStart.getTime() } }
				})
			});
			reminders = (await remindersRes.json()).result?.data || [];

			const elderlyRes = await fetch('/api/trpc/elderly.list', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ jsonrpc: '2.0', id: 3, method: 'elderly.list', params: { input: {} } })
			});
			elderlyList = (await elderlyRes.json()).result?.data || [];

			if (isNurseOrAbove) {
				const medsRes = await fetch('/api/trpc/medication.activeMedications', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ jsonrpc: '2.0', id: 4, method: 'medication.activeMedications' })
				});
				medications = (await medsRes.json()).result?.data || [];
			}
		} catch (e) {
			console.error(e);
		} finally {
			loading = false;
		}
	}

	async function updateStatus(id: string, status: string) {
		await fetch('/api/trpc/medication.updateReminderStatus', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				jsonrpc: '2.0',
				id: 1,
				method: 'medication.updateReminderStatus',
				params: { input: { id, status } }
			})
		});
		loadAll();
	}

	function addTime() {
		newMed.specificTimes = [...newMed.specificTimes, '12:00'];
	}

	function removeTime(idx: number) {
		newMed.specificTimes = newMed.specificTimes.filter((_, i) => i !== idx);
	}

	async function saveMedication() {
		if (!newMed.elderlyId || !newMed.name || !newMed.dosage) {
			alert('请填写必要信息');
			return;
		}

		await fetch('/api/trpc/medication.create', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				jsonrpc: '2.0',
				id: 1,
				method: 'medication.create',
				params: {
					input: {
						...newMed,
						specificTimes: JSON.stringify(newMed.specificTimes)
					}
				}
			})
		});

		showAddMedication = false;
		newMed = {
			elderlyId: '',
			name: '',
			dosage: '',
			frequency: '每日',
			timesPerDay: 1,
			specificTimes: ['08:00'],
			route: '口服',
			notes: '',
			doctorName: ''
		};
		loadAll();
	}

	async function toggleMedicationActive(id: string, currentActive: boolean) {
		await fetch('/api/trpc/medication.toggleActive', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				jsonrpc: '2.0',
				id: 1,
				method: 'medication.toggleActive',
				params: { input: { id, isActive: !currentActive } }
			})
		});
		loadAll();
	}
</script>

{#if loading}
	<div class="flex items-center justify-center h-full">
		<div class="text-gray-500">加载中...</div>
	</div>
{:else}
	<div class="space-y-6">
		<div class="flex items-center justify-between flex-wrap gap-4">
			<div class="flex items-center gap-3 flex-wrap">
				<div>
					<label class="label text-xs">日期</label>
					<input
						type="date"
						class="input"
						bind:value={$state(filterDate.toISOString().split('T')[0])}
						on:change={(e) => {
							filterDate = new Date((e.target as HTMLInputElement).value);
							loadAll();
						}}
					/>
				</div>
				<div>
					<label class="label text-xs">状态</label>
					<select
						class="select"
						bind:value={filterStatus}
					>
						<option value="">全部状态</option>
						<option value="pending">待执行</option>
						<option value="taken">已服药</option>
						<option value="missed">漏服</option>
						<option value="skipped">跳过</option>
					</select>
				</div>
				<div>
					<label class="label text-xs">老人</label>
					<select class="select" bind:value={filterElderly}>
						<option value="">全部老人</option>
						{#each elderlyList as e}
							<option value={e.id}>{e.name} ({e.roomNumber || '未分配'})</option>
						{/each}
					</select>
				</div>
			</div>

			{#if isNurseOrAbove}
				<button class="btn btn-primary" on:click={() => (showAddMedication = true)}>
					<span class="mr-2">+</span> 新增用药
				</button>
			{/if}
		</div>

		<div class="card">
			<div class="card-header">
				<h3 class="font-semibold text-gray-800">今日用药提醒（{filteredReminders.length}）</h3>
			</div>
			<div class="card-body">
				{#if filteredReminders.length === 0}
					<div class="empty-state">
						<div class="empty-state-icon">💊</div>
						<div class="empty-state-text">暂无用药提醒</div>
						<div class="empty-state-subtext">点击右上角新增用药来开始</div>
					</div>
				{:else}
					<div class="table-wrapper">
						<table class="table">
							<thead>
								<tr>
									<th>时间</th>
									<th>老人</th>
									<th>房间</th>
									<th>药品</th>
									<th>剂量</th>
									<th>用法</th>
									<th>状态</th>
									<th>操作</th>
								</tr>
							</thead>
							<tbody>
								{#each filteredReminders as r}
									<tr>
										<td class="font-medium">{formatTime(r.reminder.scheduledTime)}</td>
										<td>
											<div class="flex items-center gap-2">
												<div class="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-xs font-bold">
													{r.elderly.name.charAt(0)}
												</div>
												{r.elderly.name}
											</div>
										</td>
										<td class="text-gray-600">{r.elderly.roomNumber || '-'}</td>
										<td class="font-medium">{r.medication.name}</td>
										<td class="text-gray-600">{r.medication.dosage}</td>
										<td class="text-gray-600">{r.medication.route}</td>
										<td>
											<span class="badge {reminderStatusMap[r.reminder.status].color}">
												{reminderStatusMap[r.reminder.status].label}
											</span>
										</td>
										<td>
											{#if r.reminder.status === 'pending'}
												<div class="flex gap-1">
													<button class="btn btn-success btn-sm" on:click={() => updateStatus(r.reminder.id, 'taken')}>
														已服
													</button>
													<button class="btn btn-secondary btn-sm" on:click={() => updateStatus(r.reminder.id, 'skipped')}>
														跳过
													</button>
													<button class="btn btn-danger btn-sm" on:click={() => updateStatus(r.reminder.id, 'missed')}>
														漏服
													</button>
												</div>
											{:else}
												<span class="text-xs text-gray-400">-</span>
											{/if}
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				{/if}
			</div>
		</div>

		{#if isNurseOrAbove && medications.length > 0}
			<div class="card">
				<div class="card-header">
					<h3 class="font-semibold text-gray-800">📋 在用药品清单</h3>
				</div>
				<div class="card-body">
					<div class="table-wrapper">
						<table class="table">
							<thead>
								<tr>
									<th>老人</th>
									<th>护理等级</th>
									<th>药品</th>
									<th>剂量</th>
									<th>频次</th>
									<th>用药时间</th>
									<th>状态</th>
									<th>操作</th>
								</tr>
							</thead>
							<tbody>
								{#each medications as m}
									<tr>
										<td class="font-medium">{m.elderly.name}</td>
										<td>
											<span class="badge {careLevelMap[m.elderly.careLevel].color}">
												{careLevelMap[m.elderly.careLevel].label}
											</span>
										</td>
										<td>{m.medication.name}</td>
										<td class="text-gray-600">{m.medication.dosage}</td>
										<td class="text-gray-600">{m.medication.frequency}</td>
										<td class="text-gray-600">{m.medication.specificTimes}</td>
										<td>
											<span class="badge {m.medication.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}">
												{m.medication.isActive ? '在用' : '已停用'}
											</span>
										</td>
										<td>
											<button
												class="btn btn-sm {m.medication.isActive ? 'btn-secondary' : 'btn-success'}"
												on:click={() => toggleMedicationActive(m.medication.id, m.medication.isActive)}
											>
												{m.medication.isActive ? '停用' : '启用'}
											</button>
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				</div>
			</div>
		{/if}
	</div>

	<Modal open={showAddMedication} title="新增用药" size="lg" on:close={() => (showAddMedication = false)}>
		<div class="modal-body space-y-4">
			<div>
				<label class="label">选择老人 *</label>
				<select class="select" bind:value={newMed.elderlyId}>
					<option value="">请选择</option>
					{#each elderlyList as e}
						<option value={e.id}>{e.name} ({e.roomNumber || '未分配房间'})</option>
					{/each}
				</select>
			</div>
			<div class="grid grid-cols-2 gap-4">
				<div>
					<label class="label">药品名称 *</label>
					<input class="input" bind:value={newMed.name} placeholder="如：阿司匹林肠溶片" />
				</div>
				<div>
					<label class="label">剂量 *</label>
					<input class="input" bind:value={newMed.dosage} placeholder="如：100mg" />
				</div>
			</div>
			<div class="grid grid-cols-2 gap-4">
				<div>
					<label class="label">频次</label>
					<select class="select" bind:value={newMed.frequency}>
						<option value="每日">每日</option>
						<option value="隔日">隔日</option>
						<option value="每周">每周</option>
						<option value="需要时">需要时</option>
					</select>
				</div>
				<div>
					<label class="label">给药途径</label>
					<select class="select" bind:value={newMed.route}>
						<option value="口服">口服</option>
						<option value="外用">外用</option>
						<option value="注射">注射</option>
						<option value="吸入">吸入</option>
						<option value="其他">其他</option>
					</select>
				</div>
			</div>
			<div>
				<div class="flex items-center justify-between mb-1">
					<label class="label mb-0">用药时间 *</label>
					<button class="text-sm text-primary-600 hover:underline" on:click={addTime}>
						+ 添加时间
					</button>
				</div>
				<div class="space-y-2">
					{#each newMed.specificTimes as time, idx}
						<div class="flex items-center gap-2">
							<input type="time" class="input flex-1" bind:value={newMed.specificTimes[idx]} />
							{#if newMed.specificTimes.length > 1}
								<button
									class="btn btn-danger btn-sm"
									on:click={() => removeTime(idx)}
								>
									删除
								</button>
							{/if}
						</div>
					{/each}
				</div>
			</div>
			<div>
				<label class="label">开方医生</label>
				<input class="input" bind:value={newMed.doctorName} placeholder="医生姓名" />
			</div>
			<div>
				<label class="label">备注</label>
				<textarea class="textarea" rows="2" bind:value={newMed.notes} placeholder="用药注意事项等"></textarea>
			</div>
		</div>
		<div class="modal-footer">
			<button class="btn btn-secondary" on:click={() => (showAddMedication = false)}>取消</button>
			<button class="btn btn-primary" on:click={saveMedication}>保存</button>
		</div>
	</Modal>
{/if}
