<script lang="ts">
	import { goto } from '$app/navigation';
	import { getTrpcClient } from '$lib/trpc';
	import { page } from '$app/stores';

	let orderId = $state('');
	let order = $state<any>(null);
	let logs = $state<any[]>([]);
	let loading = $state(true);

	let showAssignModal = $state(false);
	let showTransferModal = $state(false);
	let showFollowupModal = $state(false);
	let showRetryModal = $state(false);
	let showSupplementModal = $state(false);
	let showEscalateModal = $state(false);
	let showCloseModal = $state(false);

	let responsibility = $state('');
	let issueTag = $state('');
	let assignRemark = $state('');

	let transferUserId = $state('');
	let transferUserName = $state('');
	let transferRemark = $state('');

	let followupResult = $state('');
	let followupRemark = $state('');

	let retryReason = $state('');
	let retryRemark = $state('');

	let supplementContent = $state('');
	let supplementType = $state('沟通记录');
	let supplementRemark = $state('');

	let escalateReason = $state('');
	let escalateLevel = $state(1);
	let escalateTo = $state('');
	let escalateRemark = $state('');

	let closeResult = $state('');
	let closeRemark = $state('');

	let issueTags = $state<any[]>([]);
	let responsibilities = $state<any[]>([]);
	let users = $state<any[]>([]);
	let escalationRules = $state<any[]>([]);
	let followupThresholds = $state<any[]>([]);

	const statusMap: Record<string, string> = {
		pending: '待处理',
		processing: '处理中',
		escalated: '已升级',
		closed: '已关闭'
	};

	const statusColorMap: Record<string, string> = {
		pending: 'badge-pending',
		processing: 'badge-processing',
		escalated: 'badge-escalated',
		closed: 'badge-closed'
	};

	const actionTypeMap: Record<string, string> = {
		create: '创建',
		assign_responsibility: '责任认定',
		transfer: '转派',
		followup: '回访',
		retry: '重试',
		supplement: '补录',
		escalate: '升级',
		close: '关闭'
	};

	const supplementTypes = ['沟通记录', '凭证补充', '协商结果', '其他'];

	async function loadData() {
		loading = true;
		try {
			const result = await getTrpcClient().refund.getOrderDetail.query({ id: orderId });
			order = result.order;
			logs = result.logs;

			if (order.responsibility) responsibility = order.responsibility;
			if (order.issueTag) issueTag = order.issueTag;
		} catch (e) {
			console.error('Failed to load order:', e);
		} finally {
			loading = false;
		}
	}

	async function loadDicts() {
		try {
			const [tags, resps, usrs, rules, thresholds] = await Promise.all([
				getTrpcClient().dictionary.getIssueTags.query(),
				getTrpcClient().dictionary.getResponsibilityDict.query(),
				getTrpcClient().auth.getUserList.query(),
				getTrpcClient().dictionary.getEscalationRules.query(),
				getTrpcClient().dictionary.getFollowupThresholds.query()
			]);
			issueTags = tags;
			responsibilities = resps;
			users = usrs;
			escalationRules = rules;
			followupThresholds = thresholds;
		} catch (e) {
			console.error('Failed to load dicts:', e);
		}
	}

	async function handleAssign() {
		if (!responsibility) {
			alert('请选择责任归属');
			return;
		}
		try {
			await getTrpcClient().refund.assignResponsibility.mutate({
				orderId,
				responsibility,
				issueTag: issueTag || undefined,
				remark: assignRemark || undefined
			});
			showAssignModal = false;
			assignRemark = '';
			loadData();
		} catch (e: any) {
			alert(e.message || '操作失败');
		}
	}

	async function handleTransfer() {
		if (!transferUserId) {
			alert('请选择转派人');
			return;
		}
		try {
			await getTrpcClient().refund.transferHandler.mutate({
				orderId,
				newHandlerId: transferUserId,
				newHandlerName: transferUserName,
				remark: transferRemark || undefined
			});
			showTransferModal = false;
			transferUserId = '';
			transferUserName = '';
			transferRemark = '';
			loadData();
		} catch (e: any) {
			alert(e.message || '操作失败');
		}
	}

	async function handleFollowup() {
		if (!followupResult) {
			alert('请选择回访结果');
			return;
		}
		try {
			await getTrpcClient().refund.addFollowup.mutate({
				orderId,
				result: followupResult,
				remark: followupRemark || undefined
			});
			showFollowupModal = false;
			followupResult = '';
			followupRemark = '';
			loadData();
		} catch (e: any) {
			alert(e.message || '操作失败');
		}
	}

	async function handleRetry() {
		if (!retryReason) {
			alert('请填写重试原因');
			return;
		}
		try {
			await getTrpcClient().refund.retryProcess.mutate({
				orderId,
				reason: retryReason,
				remark: retryRemark || undefined
			});
			showRetryModal = false;
			retryReason = '';
			retryRemark = '';
			loadData();
		} catch (e: any) {
			alert(e.message || '操作失败');
		}
	}

	async function handleSupplement() {
		if (!supplementContent) {
			alert('请填写补录内容');
			return;
		}
		try {
			await getTrpcClient().refund.supplementRecord.mutate({
				orderId,
				content: supplementContent,
				recordType: supplementType,
				remark: supplementRemark || undefined
			});
			showSupplementModal = false;
			supplementContent = '';
			supplementRemark = '';
			loadData();
		} catch (e: any) {
			alert(e.message || '操作失败');
		}
	}

	async function handleEscalate() {
		if (!escalateReason || !escalateTo) {
			alert('请填写升级原因和升级对象');
			return;
		}
		try {
			await getTrpcClient().refund.escalate.mutate({
				orderId,
				reason: escalateReason,
				escalateTo,
				level: escalateLevel,
				remark: escalateRemark || undefined
			});
			showEscalateModal = false;
			escalateReason = '';
			escalateTo = '';
			escalateRemark = '';
			loadData();
		} catch (e: any) {
			alert(e.message || '操作失败');
		}
	}

	async function handleClose() {
		if (!closeResult) {
			alert('请选择最终结果');
			return;
		}
		try {
			await getTrpcClient().refund.closeOrder.mutate({
				orderId,
				result: closeResult,
				remark: closeRemark || undefined
			});
			showCloseModal = false;
			closeResult = '';
			closeRemark = '';
			loadData();
		} catch (e: any) {
			alert(e.message || '操作失败');
		}
	}

	function formatDate(date: Date | string) {
		const d = new Date(date);
		return d.toLocaleString('zh-CN', {
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit'
		});
	}

	function formatAmount(amount: number) {
		return (amount / 100).toFixed(2);
	}

	function onUserChange(e: Event) {
		const target = e.target as HTMLSelectElement;
		const user = users.find(u => u.id === target.value);
		if (user) {
			transferUserName = user.realName || user.username;
		}
	}

	$effect(() => {
		orderId = $page.params.id;
		if (orderId) {
			loadDicts();
			loadData();
		}
	});
</script>

{#if loading}
	<div class="empty-state">加载中...</div>
{:else if !order}
	<div class="empty-state">售后单不存在</div>
{:else}
	<div class="page-header">
		<div>
			<button class="btn btn-sm" onclick={() => goto(-1)}>← 返回</button>
			<h1 class="page-title" style="display: inline-block; margin-left: 12px;">
				售后单详情 - {order.orderNo}
			</h1>
		</div>
		<div style="display: flex; gap: 8px;">
			{#if order.status !== 'closed'}
				<button class="btn" onclick={() => showSupplementModal = true}>📝 补录</button>
				<button class="btn btn-warning" onclick={() => showEscalateModal = true}>⬆️ 升级</button>
				<button class="btn btn-success" onclick={() => showCloseModal = true}>✓ 关闭</button>
			{:else}
				<button class="btn" onclick={() => showRetryModal = true}>🔄 重新打开</button>
			{/if}
		</div>
	</div>

	<div style="display: grid; grid-template-columns: 2fr 1fr; gap: 20px;">
		<div style="display: flex; flex-direction: column; gap: 20px;">
			<div class="card">
				<div class="card-header">基本信息</div>
				<div class="card-body">
					<div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px;">
						<div>
							<div style="color: var(--text-secondary); font-size: 13px;">售后单号</div>
							<div style="font-weight: 500; margin-top: 4px;">{order.orderNo}</div>
						</div>
						<div>
							<div style="color: var(--text-secondary); font-size: 13px;">状态</div>
							<div style="margin-top: 4px;">
								<span class="badge {statusColorMap[order.status]}">
									{statusMap[order.status]}
								</span>
							</div>
						</div>
						<div>
							<div style="color: var(--text-secondary); font-size: 13px;">小区</div>
							<div style="margin-top: 4px;">{order.communityName}</div>
						</div>
						<div>
							<div style="color: var(--text-secondary); font-size: 13px;">区域</div>
							<div style="margin-top: 4px;">{order.region}</div>
						</div>
						<div>
							<div style="color: var(--text-secondary); font-size: 13px;">客户姓名</div>
							<div style="margin-top: 4px;">{order.customerName}</div>
						</div>
						<div>
							<div style="color: var(--text-secondary); font-size: 13px;">联系电话</div>
							<div style="margin-top: 4px;">{order.customerPhone}</div>
						</div>
						<div>
							<div style="color: var(--text-secondary); font-size: 13px;">商品名称</div>
							<div style="margin-top: 4px;">{order.productName}</div>
						</div>
						<div>
							<div style="color: var(--text-secondary); font-size: 13px;">退款金额</div>
							<div style="color: var(--danger-color); font-weight: 600; margin-top: 4px;">
								¥{formatAmount(order.refundAmount)}
							</div>
						</div>
						<div style="grid-column: span 2;">
							<div style="color: var(--text-secondary); font-size: 13px;">退款原因</div>
							<div style="margin-top: 4px;">{order.refundReason}</div>
						</div>
					</div>
				</div>
			</div>

			<div class="card">
				<div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
					<span>责任归属与问题标签</span>
					{#if order.status !== 'closed'}
						<button class="btn btn-sm btn-primary" onclick={() => showAssignModal = true}>
							{order.responsibility ? '修改' : '认定'}
						</button>
					{/if}
				</div>
				<div class="card-body">
					<div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px;">
						<div>
							<div style="color: var(--text-secondary); font-size: 13px;">责任归属</div>
							<div style="font-weight: 500; margin-top: 4px;">
								{order.responsibility || '尚未认定'}
							</div>
						</div>
						<div>
							<div style="color: var(--text-secondary); font-size: 13px;">问题标签</div>
							<div style="margin-top: 4px;">
								{#if order.issueTag}
									<span class="badge badge-default">{order.issueTag}</span>
								{:else}
									未设置
								{/if}
							</div>
						</div>
						<div>
							<div style="color: var(--text-secondary); font-size: 13px;">当前处理人</div>
							<div style="margin-top: 4px;">
								{order.currentHandlerName || '未分配'}
								{#if order.status !== 'closed'}
									<button class="btn btn-sm" style="margin-left: 8px;" onclick={() => showTransferModal = true}>
										转派
									</button>
								{/if}
							</div>
						</div>
						<div>
							<div style="color: var(--text-secondary); font-size: 13px;">回访结果</div>
							<div style="margin-top: 4px;">{order.followupResult || '-'}</div>
						</div>
					</div>
				</div>
			</div>

			<div class="card">
				<div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
					<span>快捷操作</span>
				</div>
				<div class="card-body">
					<div style="display: flex; flex-wrap: wrap; gap: 10px;">
						{#if order.status !== 'closed'}
							<button class="btn" onclick={() => showFollowupModal = true}>📞 回访记录</button>
							<button class="btn" onclick={() => showSupplementModal = true}>📝 补录记录</button>
							<button class="btn btn-warning" onclick={() => showEscalateModal = true}>⬆️ 升级处理</button>
							<button class="btn btn-success" onclick={() => showCloseModal = true}>✓ 关闭售后</button>
						{:else}
							<button class="btn" onclick={() => showRetryModal = true}>🔄 重新处理</button>
						{/if}
					</div>
				</div>
			</div>
		</div>

		<div class="card">
			<div class="card-header">处理轨迹</div>
			<div class="card-body">
				{#if logs.length === 0}
					<div class="empty-state" style="padding: 20px;">暂无处理记录</div>
				{:else}
					<div class="timeline">
						{#each logs as log (log.id)}
							<div class="timeline-item">
								<div class="timeline-time">{formatDate(log.createdAt)}</div>
								<div class="timeline-content">
									<div class="timeline-action">
										<span class="badge badge-default">{actionTypeMap[log.actionType] || log.actionType}</span>
									</div>
									<div style="margin-top: 6px;">{log.actionDetail}</div>
									{#if log.remark}
										<div style="margin-top: 6px; color: var(--text-secondary); font-size: 12px;">
											备注：{log.remark}
										</div>
									{/if}
									<div class="timeline-meta">
										操作人：{log.operatorName || '系统'}
										{#if log.oldStatus && log.newStatus && log.oldStatus !== log.newStatus}
											 · {statusMap[log.oldStatus]} → {statusMap[log.newStatus]}
										{/if}
									</div>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		</div>
	</div>

	{#if showAssignModal}
		<div class="modal-overlay" onclick={() => showAssignModal = false}>
			<div class="modal" onclick={(e) => e.stopPropagation()}>
				<div class="modal-header">
					<span class="modal-title">责任认定</span>
					<button class="modal-close" onclick={() => showAssignModal = false}>×</button>
				</div>
				<div class="modal-body">
					<div class="form-group">
						<label class="form-label">责任归属 *</label>
						<select class="form-select" bind:value={responsibility}>
							<option value="">请选择</option>
							{#each responsibilities as r}
								<option value={r.name}>{r.name}</option>
							{/each}
						</select>
					</div>
					<div class="form-group">
						<label class="form-label">问题标签</label>
						<select class="form-select" bind:value={issueTag}>
							<option value="">请选择</option>
							{#each issueTags as tag}
								<option value={tag.name}>{tag.name}</option>
							{/each}
						</select>
					</div>
					<div class="form-group">
						<label class="form-label">备注</label>
						<textarea class="form-textarea" bind:value={assignRemark} placeholder="请输入备注信息"></textarea>
					</div>
				</div>
				<div class="modal-footer">
					<button class="btn" onclick={() => showAssignModal = false}>取消</button>
					<button class="btn btn-primary" onclick={handleAssign}>确认</button>
				</div>
			</div>
		</div>
	{/if}

	{#if showTransferModal}
		<div class="modal-overlay" onclick={() => showTransferModal = false}>
			<div class="modal" onclick={(e) => e.stopPropagation()}>
				<div class="modal-header">
					<span class="modal-title">转派处理</span>
					<button class="modal-close" onclick={() => showTransferModal = false}>×</button>
				</div>
				<div class="modal-body">
					<div class="form-group">
						<label class="form-label">转派给 *</label>
						<select class="form-select" bind:value={transferUserId} onchange={onUserChange}>
							<option value="">请选择</option>
							{#each users as u}
								<option value={u.id}>{u.realName || u.username} ({u.role === 'admin' ? '管理员' : '运营'})</option>
							{/each}
						</select>
					</div>
					<div class="form-group">
						<label class="form-label">转派原因</label>
						<textarea class="form-textarea" bind:value={transferRemark} placeholder="请输入转派原因"></textarea>
					</div>
				</div>
				<div class="modal-footer">
					<button class="btn" onclick={() => showTransferModal = false}>取消</button>
					<button class="btn btn-primary" onclick={handleTransfer}>确认转派</button>
				</div>
			</div>
		</div>
	{/if}

	{#if showFollowupModal}
		<div class="modal-overlay" onclick={() => showFollowupModal = false}>
			<div class="modal" onclick={(e) => e.stopPropagation()}>
				<div class="modal-header">
					<span class="modal-title">回访记录</span>
					<button class="modal-close" onclick={() => showFollowupModal = false}>×</button>
				</div>
				<div class="modal-body">
					<div class="form-group">
						<label class="form-label">回访结果 *</label>
						<select class="form-select" bind:value={followupResult}>
							<option value="">请选择</option>
							{#each followupThresholds as t}
								<option value={t.resultName}>{t.resultName}</option>
							{/each}
						</select>
					</div>
					<div class="form-group">
						<label class="form-label">回访详情</label>
						<textarea class="form-textarea" bind:value={followupRemark} placeholder="请输入回访详情"></textarea>
					</div>
				</div>
				<div class="modal-footer">
					<button class="btn" onclick={() => showFollowupModal = false}>取消</button>
					<button class="btn btn-primary" onclick={handleFollowup}>保存</button>
				</div>
			</div>
		</div>
	{/if}

	{#if showRetryModal}
		<div class="modal-overlay" onclick={() => showRetryModal = false}>
			<div class="modal" onclick={(e) => e.stopPropagation()}>
				<div class="modal-header">
					<span class="modal-title">重新处理</span>
					<button class="modal-close" onclick={() => showRetryModal = false}>×</button>
				</div>
				<div class="modal-body">
					<div class="form-group">
						<label class="form-label">重试原因 *</label>
						<input type="text" class="form-input" bind:value={retryReason} placeholder="请输入重试原因" />
					</div>
					<div class="form-group">
						<label class="form-label">备注</label>
						<textarea class="form-textarea" bind:value={retryRemark} placeholder="请输入备注信息"></textarea>
					</div>
					<div style="background: #fef3c7; padding: 10px; border-radius: 6px; font-size: 13px; color: #92400e;">
						⚠️ 重新处理后，状态将变为「处理中」，并生成完整的处理记录。
					</div>
				</div>
				<div class="modal-footer">
					<button class="btn" onclick={() => showRetryModal = false}>取消</button>
					<button class="btn btn-primary" onclick={handleRetry}>确认重试</button>
				</div>
			</div>
		</div>
	{/if}

	{#if showSupplementModal}
		<div class="modal-overlay" onclick={() => showSupplementModal = false}>
			<div class="modal" onclick={(e) => e.stopPropagation()}>
				<div class="modal-header">
					<span class="modal-title">补录记录</span>
					<button class="modal-close" onclick={() => showSupplementModal = false}>×</button>
				</div>
				<div class="modal-body">
					<div class="form-group">
						<label class="form-label">补录类型</label>
						<select class="form-select" bind:value={supplementType}>
							{#each supplementTypes as t}
								<option value={t}>{t}</option>
							{/each}
						</select>
					</div>
					<div class="form-group">
						<label class="form-label">补录内容 *</label>
						<textarea class="form-textarea" bind:value={supplementContent} placeholder="请输入补录内容"></textarea>
					</div>
					<div class="form-group">
						<label class="form-label">备注</label>
						<input type="text" class="form-input" bind:value={supplementRemark} placeholder="可选" />
					</div>
					<div style="background: #dbeafe; padding: 10px; border-radius: 6px; font-size: 13px; color: #1e40af;">
						ℹ️ 补录记录将保留在处理轨迹中，不会改变售后单状态。
					</div>
				</div>
				<div class="modal-footer">
					<button class="btn" onclick={() => showSupplementModal = false}>取消</button>
					<button class="btn btn-primary" onclick={handleSupplement}>确认补录</button>
				</div>
			</div>
		</div>
	{/if}

	{#if showEscalateModal}
		<div class="modal-overlay" onclick={() => showEscalateModal = false}>
			<div class="modal" onclick={(e) => e.stopPropagation()}>
				<div class="modal-header">
					<span class="modal-title">升级处理</span>
					<button class="modal-close" onclick={() => showEscalateModal = false}>×</button>
				</div>
				<div class="modal-body">
					<div class="form-group">
						<label class="form-label">升级级别</label>
						<select class="form-select" bind:value={escalateLevel}>
							<option value={1}>一级升级</option>
							<option value={2}>二级升级</option>
							<option value={3}>三级升级</option>
						</select>
					</div>
					<div class="form-group">
						<label class="form-label">升级至 *</label>
						<input type="text" class="form-input" bind:value={escalateTo} placeholder="如：主管、部门经理等" />
					</div>
					<div class="form-group">
						<label class="form-label">升级原因 *</label>
						<textarea class="form-textarea" bind:value={escalateReason} placeholder="请输入升级原因"></textarea>
					</div>
					<div class="form-group">
						<label class="form-label">备注</label>
						<input type="text" class="form-input" bind:value={escalateRemark} placeholder="可选" />
					</div>
					<div style="background: #fce7f3; padding: 10px; border-radius: 6px; font-size: 13px; color: #9d174d;">
						⚠️ 升级后，售后单状态变为「已升级」，并进入对应负责人待办。
					</div>
				</div>
				<div class="modal-footer">
					<button class="btn" onclick={() => showEscalateModal = false}>取消</button>
					<button class="btn btn-warning" onclick={handleEscalate}>确认升级</button>
				</div>
			</div>
		</div>
	{/if}

	{#if showCloseModal}
		<div class="modal-overlay" onclick={() => showCloseModal = false}>
			<div class="modal" onclick={(e) => e.stopPropagation()}>
				<div class="modal-header">
					<span class="modal-title">关闭售后单</span>
					<button class="modal-close" onclick={() => showCloseModal = false}>×</button>
				</div>
				<div class="modal-body">
					<div class="form-group">
						<label class="form-label">最终结果 *</label>
						<select class="form-select" bind:value={closeResult}>
							<option value="">请选择</option>
							<option value="已退款">已退款</option>
							<option value="已换货">已换货</option>
							<option value="协商完成">协商完成</option>
							<option value="用户撤销">用户撤销</option>
							<option value="拒绝退款">拒绝退款</option>
						</select>
					</div>
					<div class="form-group">
						<label class="form-label">关闭说明</label>
						<textarea class="form-textarea" bind:value={closeRemark} placeholder="请输入关闭说明"></textarea>
					</div>
					<div style="background: #d1fae5; padding: 10px; border-radius: 6px; font-size: 13px; color: #065f46;">
						✓ 关闭后，售后单将从待办列表移除，但可在全部列表中查看。
					</div>
				</div>
				<div class="modal-footer">
					<button class="btn" onclick={() => showCloseModal = false}>取消</button>
					<button class="btn btn-success" onclick={handleClose}>确认关闭</button>
				</div>
			</div>
		</div>
	{/if}
{/if}
