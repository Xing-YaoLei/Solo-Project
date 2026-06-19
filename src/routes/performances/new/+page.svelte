<script lang="ts">
	let { data, form } = $props();
</script>

<svelte:head>
	<title>新建排期 - 演出排期协同台</title>
</svelte:head>

<div class="new-performance-page">
	<h2 class="page-title">新建排期</h2>

	{#if form?.message}
		<div class="error">{form.message}</div>
	{/if}

	<div class="form-card">
		<form method="POST" class="form">
			<div class="form-group">
				<label class="form-label" for="title">演出名称 <span class="required">*</span></label>
				<input type="text" id="title" name="title" required class="form-input" />
			</div>

			<div class="form-group">
				<label class="form-label" for="venue">场馆 <span class="required">*</span></label>
				<input type="text" id="venue" name="venue" required class="form-input" />
			</div>

			<div class="form-group">
				<label class="form-label" for="show_date">演出时间 <span class="required">*</span></label>
				<input type="datetime-local" id="show_date" name="show_date" required class="form-input" />
			</div>

			<div class="form-group">
				<label class="form-label" for="duration_minutes">时长/分钟 <span class="required">*</span></label>
				<input type="number" id="duration_minutes" name="duration_minutes" required min="1" class="form-input" />
			</div>

			<div class="form-group">
				<label class="form-label" for="description">描述</label>
				<textarea id="description" name="description" rows="4" class="form-input form-textarea"></textarea>
			</div>

			<div class="form-group">
				<label class="form-label" for="assignee_id">负责人</label>
				<select id="assignee_id" name="assignee_id" class="form-input">
					<option value="">— 选择负责人 —</option>
					{#each data.users as u}
						<option value={u.id}>{u.display_name ?? u.username}</option>
					{/each}
				</select>
			</div>

			<div class="form-actions">
				<a href="/performances" class="btn-cancel">取消</a>
				<button type="submit" class="btn-submit">创建排期</button>
			</div>
		</form>
	</div>
</div>

<style>
	.new-performance-page {
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
