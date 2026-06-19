<script lang="ts">
	let { data, form } = $props();
</script>

<svelte:head>
	<title>新建异常 - 演出排期协同台</title>
</svelte:head>

<div class="new-exception-page">
	<h2 class="page-title">新建异常</h2>

	{#if form?.message}
		<div class="error">{form.message}</div>
	{/if}

	<div class="form-card">
		<form method="POST" class="form">
			<div class="form-group">
				<label class="form-label" for="performance_id">关联演出 <span class="required">*</span></label>
				<select id="performance_id" name="performance_id" required class="form-input">
					<option value="">— 选择演出 —</option>
					{#each data.performances as p}
						<option value={p.id} selected={p.id === data.preselectedPerformanceId}>{p.title}</option>
					{/each}
				</select>
			</div>

			<div class="form-group">
				<label class="form-label" for="type">类型 <span class="required">*</span></label>
				<select id="type" name="type" required class="form-input">
					<option value="refund_dispute">退票争议</option>
					<option value="seat_issue">座位问题</option>
					<option value="checkin_error">签到异常</option>
					<option value="other">其他</option>
				</select>
			</div>

			<div class="form-group">
				<label class="form-label" for="source">来源</label>
				<select id="source" name="source" class="form-input">
					<option value="onsite">现场</option>
					<option value="phone">电话</option>
					<option value="online">线上</option>
				</select>
			</div>

			<div class="form-group">
				<label class="form-label" for="description">描述 <span class="required">*</span></label>
				<textarea id="description" name="description" rows="5" required class="form-input form-textarea" placeholder="请详细描述异常情况..."></textarea>
			</div>

			<div class="form-actions">
				<a href="/exceptions" class="btn-cancel">取消</a>
				<button type="submit" class="btn-submit">提交异常</button>
			</div>
		</form>
	</div>
</div>

<style>
	.new-exception-page {
		max-width: 640px;
	}

	.page-title {
		font-size: 22px;
		font-weight: 600;
		color: #1e293b;
		margin: 0 0 24px;
	}

	.error {
		background: #fef2f2;
		color: #dc2626;
		padding: 10px 14px;
		border-radius: 8px;
		font-size: 14px;
		margin-bottom: 20px;
		border: 1px solid #fecaca;
	}

	.form-card {
		background: #ffffff;
		border-radius: 10px;
		padding: 28px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
		border: 1px solid #e2e8f0;
	}

	.form {
		display: flex;
		flex-direction: column;
		gap: 20px;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.form-label {
		font-size: 14px;
		font-weight: 500;
		color: #334155;
	}

	.required {
		color: #dc2626;
	}

	.form-input {
		padding: 10px 14px;
		border: 1px solid #d1d5db;
		border-radius: 8px;
		font-size: 14px;
		color: #334155;
		outline: none;
		transition: border-color 0.15s;
		background: #ffffff;
	}

	.form-input:focus {
		border-color: #3b82f6;
	}

	.form-textarea {
		resize: vertical;
		font-family: inherit;
	}

	.form-actions {
		display: flex;
		gap: 12px;
		justify-content: flex-end;
		padding-top: 8px;
	}

	.btn-cancel {
		display: inline-flex;
		align-items: center;
		padding: 8px 20px;
		border: 1px solid #d1d5db;
		border-radius: 8px;
		font-size: 14px;
		font-weight: 500;
		color: #64748b;
		text-decoration: none;
		background: #ffffff;
		transition: background 0.15s;
	}

	.btn-cancel:hover {
		background: #f8fafc;
	}

	.btn-submit {
		display: inline-flex;
		align-items: center;
		padding: 8px 20px;
		background: #3b82f6;
		color: #ffffff;
		border: none;
		border-radius: 8px;
		font-size: 14px;
		font-weight: 600;
		cursor: pointer;
		transition: background 0.15s;
	}

	.btn-submit:hover {
		background: #2563eb;
	}
</style>
