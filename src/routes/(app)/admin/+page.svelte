<script lang="ts">
	import { getTrpcClient } from '$lib/trpc';

	let activeTab = $state('timeout');

	let timeoutList = $state<any[]>([]);
	let escalationList = $state<any[]>([]);
	let thresholdList = $state<any[]>([]);
	let issueTagList = $state<any[]>([]);
	let responsibilityList = $state<any[]>([]);

	let loading = $state(false);
	let saving = $state(false);

	const tabs = [
		{ key: 'timeout', label: '处理时限' },
		{ key: 'escalation', label: '升级规则' },
		{ key: 'threshold', label: '回访阈值' },
		{ key: 'issueTag', label: '问题标签' },
		{ key: 'responsibility', label: '责任归属' }
	];

	async function loadData() {
		loading = true;
		try {
			const [timeouts, escalations, thresholds, tags, resps] = await Promise.all([
				getTrpcClient().dictionary.getTimeoutDictionary.query(),
				getTrpcClient().dictionary.getEscalationRules.query(),
				getTrpcClient().dictionary.getFollowupThresholds.query(),
				getTrpcClient().dictionary.getIssueTags.query(),
				getTrpcClient().dictionary.getResponsibilityDict.query()
			]);
			timeoutList = timeouts.map(t => ({ ...t, id: t.id }));
			escalationList = escalations.map(t => ({ ...t, id: t.id }));
			thresholdList = thresholds.map(t => ({ ...t, id: t.id }));
			issueTagList = tags.map(t => ({ ...t, id: t.id }));
			responsibilityList = resps.map(t => ({ ...t, id: t.id }));
		} catch (e) {
			console.error('Failed to load data:', e);
		} finally {
			loading = false;
		}
	}

	async function saveTimeout() {
		saving = true;
		try {
			await getTrpcClient().dictionary.updateTimeoutDictionary.mutate(timeoutList);
			alert('保存成功');
		} catch (e: any) {
			alert(e.message || '保存失败');
		} finally {
			saving = false;
		}
	}

	async function saveEscalation() {
		saving = true;
		try {
			await getTrpcClient().dictionary.updateEscalationRules.mutate(escalationList);
			alert('保存成功');
		} catch (e: any) {
			alert(e.message || '保存失败');
		} finally {
			saving = false;
		}
	}

	async function saveThreshold() {
		saving = true;
		try {
			await getTrpcClient().dictionary.updateFollowupThresholds.mutate(thresholdList);
			alert('保存成功');
		} catch (e: any) {
			alert(e.message || '保存失败');
		} finally {
			saving = false;
		}
	}

	async function saveIssueTag() {
		saving = true;
		try {
			await getTrpcClient().dictionary.updateIssueTags.mutate(issueTagList);
			alert('保存成功');
		} catch (e: any) {
			alert(e.message || '保存失败');
		} finally {
			saving = false;
		}
	}

	async function saveResponsibility() {
		saving = true;
		try {
			await getTrpcClient().dictionary.updateResponsibilityDict.mutate(responsibilityList);
			alert('保存成功');
		} catch (e: any) {
			alert(e.message || '保存失败');
		} finally {
			saving = false;
		}
	}

	function addTimeout() {
		timeoutList.push({
			statusKey: '',
			statusName: '',
			timeoutHours: 24,
			description: '',
			enabled: true
		});
	}

	function addEscalation() {
		escalationList.push({
			name: '',
			triggerCondition: '',
			escalateToRole: 'admin',
			escalateToUserId: '',
			level: escalationList.length + 1,
			enabled: true
		});
	}

	function addThreshold() {
		thresholdList.push({
			resultKey: '',
			resultName: '',
			requiresReview: false,
			warningThreshold: undefined,
			description: '',
			enabled: true
		});
	}

	function addIssueTag() {
		issueTagList.push({
			name: '',
			category: '',
			color: '#3b82f6',
			sortOrder: issueTagList.length,
			enabled: true
		});
	}

	function addResponsibility() {
		responsibilityList.push({
			key: '',
			name: '',
			department: '',
			sortOrder: responsibilityList.length,
			enabled: true
		});
	}

	$effect(() => {
		loadData();
	});
</script>

<div class="page-header">
	<h1 class="page-title">系统管理</h1>
</div>

<div class="card">
	<div class="card-body" style="padding-bottom: 0;">
		<div class="tabs">
			{#each tabs as tab}
				<div class="tab-item {activeTab === tab.key ? 'active' : ''}" onclick={() => activeTab = tab.key}>
					{tab.label}
				</div>
			{/each}
		</div>
	</div>

	{#if loading}
		<div class="card-body">
			<div class="empty-state">加载中...</div>
		</div>
	{:else if activeTab === 'timeout'}
		<div class="card-body">
			<div style="margin-bottom: 16px;">
				<button class="btn btn-primary btn-sm" onclick={addTimeout}>➕ 添加时限</button>
			</div>
			<table>
				<thead>
					<tr>
						<th>状态Key</th>
						<th>状态名称</th>
						<th>超时时长(小时)</th>
						<th>说明</th>
						<th>启用</th>
						<th>操作</th>
					</tr>
				</thead>
				<tbody>
					{#each timeoutList as item, index}
						<tr>
							<td>
								<input type="text" class="form-input" style="width: 120px;" bind:value={item.statusKey} />
							</td>
							<td>
								<input type="text" class="form-input" style="width: 120px;" bind:value={item.statusName} />
							</td>
							<td>
								<input type="number" class="form-input" style="width: 100px;" bind:value={item.timeoutHours} />
							</td>
							<td>
								<input type="text" class="form-input" bind:value={item.description} />
							</td>
							<td>
								<input type="checkbox" bind:checked={item.enabled} />
							</td>
							<td>
								<button class="btn btn-sm btn-danger" onclick={() => timeoutList.splice(index, 1)}>删除</button>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
			<div style="margin-top: 16px; text-align: right;">
				<button class="btn btn-primary" onclick={saveTimeout} disabled={saving}>
					{saving ? '保存中...' : '保存'}
				</button>
			</div>
		</div>

	{:else if activeTab === 'escalation'}
		<div class="card-body">
			<div style="margin-bottom: 16px;">
				<button class="btn btn-primary btn-sm" onclick={addEscalation}>➕ 添加规则</button>
			</div>
			<table>
				<thead>
					<tr>
						<th>规则名称</th>
						<th>触发条件</th>
						<th>升级级别</th>
						<th>升级至角色</th>
						<th>指定用户</th>
						<th>启用</th>
						<th>操作</th>
					</tr>
				</thead>
				<tbody>
					{#each escalationList as item, index}
						<tr>
							<td>
								<input type="text" class="form-input" style="width: 140px;" bind:value={item.name} />
							</td>
							<td>
								<input type="text" class="form-input" bind:value={item.triggerCondition} />
							</td>
							<td>
								<input type="number" class="form-input" style="width: 80px;" bind:value={item.level} />
							</td>
							<td>
								<select class="form-select" style="width: 100px;" bind:value={item.escalateToRole}>
									<option value="admin">管理员</option>
									<option value="operator">运营</option>
									<option value="leader">主管</option>
								</select>
							</td>
							<td>
								<input type="text" class="form-input" style="width: 100px;" bind:value={item.escalateToUserId} placeholder="可选" />
							</td>
							<td>
								<input type="checkbox" bind:checked={item.enabled} />
							</td>
							<td>
								<button class="btn btn-sm btn-danger" onclick={() => escalationList.splice(index, 1)}>删除</button>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
			<div style="margin-top: 16px; text-align: right;">
				<button class="btn btn-primary" onclick={saveEscalation} disabled={saving}>
					{saving ? '保存中...' : '保存'}
				</button>
			</div>
		</div>

	{:else if activeTab === 'threshold'}
		<div class="card-body">
			<div style="margin-bottom: 16px;">
				<button class="btn btn-primary btn-sm" onclick={addThreshold}>➕ 添加阈值</button>
			</div>
			<table>
				<thead>
					<tr>
						<th>结果Key</th>
						<th>结果名称</th>
						<th>需复核</th>
						<th>预警阈值</th>
						<th>说明</th>
						<th>启用</th>
						<th>操作</th>
					</tr>
				</thead>
				<tbody>
					{#each thresholdList as item, index}
						<tr>
							<td>
								<input type="text" class="form-input" style="width: 120px;" bind:value={item.resultKey} />
							</td>
							<td>
								<input type="text" class="form-input" style="width: 120px;" bind:value={item.resultName} />
							</td>
							<td>
								<input type="checkbox" bind:checked={item.requiresReview} />
							</td>
							<td>
								<input type="number" class="form-input" style="width: 100px;" bind:value={item.warningThreshold} placeholder="可选" />
							</td>
							<td>
								<input type="text" class="form-input" bind:value={item.description} />
							</td>
							<td>
								<input type="checkbox" bind:checked={item.enabled} />
							</td>
							<td>
								<button class="btn btn-sm btn-danger" onclick={() => thresholdList.splice(index, 1)}>删除</button>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
			<div style="margin-top: 16px; text-align: right;">
				<button class="btn btn-primary" onclick={saveThreshold} disabled={saving}>
					{saving ? '保存中...' : '保存'}
				</button>
			</div>
		</div>

	{:else if activeTab === 'issueTag'}
		<div class="card-body">
			<div style="margin-bottom: 16px;">
				<button class="btn btn-primary btn-sm" onclick={addIssueTag}>➕ 添加标签</button>
			</div>
			<table>
				<thead>
					<tr>
						<th>标签名称</th>
						<th>分类</th>
						<th>颜色</th>
						<th>排序</th>
						<th>启用</th>
						<th>操作</th>
					</tr>
				</thead>
				<tbody>
					{#each issueTagList as item, index}
						<tr>
							<td>
								<input type="text" class="form-input" style="width: 140px;" bind:value={item.name} />
							</td>
							<td>
								<input type="text" class="form-input" style="width: 120px;" bind:value={item.category} />
							</td>
							<td>
								<input type="color" style="width: 40px; height: 30px; cursor: pointer;" bind:value={item.color} />
							</td>
							<td>
								<input type="number" class="form-input" style="width: 80px;" bind:value={item.sortOrder} />
							</td>
							<td>
								<input type="checkbox" bind:checked={item.enabled} />
							</td>
							<td>
								<button class="btn btn-sm btn-danger" onclick={() => issueTagList.splice(index, 1)}>删除</button>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
			<div style="margin-top: 16px; text-align: right;">
				<button class="btn btn-primary" onclick={saveIssueTag} disabled={saving}>
					{saving ? '保存中...' : '保存'}
				</button>
			</div>
		</div>

	{:else if activeTab === 'responsibility'}
		<div class="card-body">
			<div style="margin-bottom: 16px;">
				<button class="btn btn-primary btn-sm" onclick={addResponsibility}>➕ 添加责任方</button>
			</div>
			<table>
				<thead>
					<tr>
						<th>标识Key</th>
						<th>责任方名称</th>
						<th>所属部门</th>
						<th>排序</th>
						<th>启用</th>
						<th>操作</th>
					</tr>
				</thead>
				<tbody>
					{#each responsibilityList as item, index}
						<tr>
							<td>
								<input type="text" class="form-input" style="width: 120px;" bind:value={item.key} />
							</td>
							<td>
								<input type="text" class="form-input" style="width: 140px;" bind:value={item.name} />
							</td>
							<td>
								<input type="text" class="form-input" style="width: 120px;" bind:value={item.department} />
							</td>
							<td>
								<input type="number" class="form-input" style="width: 80px;" bind:value={item.sortOrder} />
							</td>
							<td>
								<input type="checkbox" bind:checked={item.enabled} />
							</td>
							<td>
								<button class="btn btn-sm btn-danger" onclick={() => responsibilityList.splice(index, 1)}>删除</button>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
			<div style="margin-top: 16px; text-align: right;">
				<button class="btn btn-primary" onclick={saveResponsibility} disabled={saving}>
					{saving ? '保存中...' : '保存'}
				</button>
			</div>
		</div>
	{/if}
</div>
