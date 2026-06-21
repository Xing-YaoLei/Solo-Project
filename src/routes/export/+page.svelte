<script lang="ts">
	import { trpc } from '$lib/trpc/client';
	import { onMount } from 'svelte';
	import { downloadBlob } from '$lib/utils';

	let events: any[] = [];
	let selectedEventId = '';
	let selectedModule = '';
	let format = 'csv';
	let startDate = '';
	let endDate = '';

	let generating = false;
	let lastResult: any = null;

	const modules = [
		{ id: 'sponsors', name: '赞助清单', desc: '赞助方、合同、票数、金额' },
		{ id: 'sponsor-tickets', name: '赞助票明细', desc: '每家赞助的票数明细与交接' },
		{ id: 'verifications', name: '核销记录', desc: '每张核销码的全生命周期' },
		{ id: 'ticket-types', name: '票种规则', desc: '票类、配额、价格、退票政策' },
		{ id: 'orders', name: '购票订单', desc: '订单维度财务与状态' },
		{ id: 'order-items', name: '订单项明细', desc: '每张票的明细（逐行）' },
		{ id: 'disputes', name: '异常单', desc: '争议详情、责任、处理结果' },
		{ id: 'verification-stats', name: '核销统计(按小时)', desc: '按小时聚合的核销量' }
	];

	const caliberNotes: Record<string, string[]> = {
		sponsors: [
			'按赞助单维度聚合，一行一张赞助合同',
			'总票数为约定数，非已交接或已核销数',
			'金额为合同额，非实收金额'
		],
		verifications: [
			'核销时间采用verify_time而非创建时间',
			'状态：已发放/待激活/已核销/已过期/已退款/已作废',
			'重复核销拦截记录请联系技术获取审计日志'
		],
		orders: [
			'实付=支付成功金额-已退款金额',
			'退款订单以订单状态为准，非支付状态单独判断',
			'第三方渠道订单到账会有延迟'
		],
		disputes: [
			'影响范围为人工评估+系统检测合并值',
			'处理结果中已关闭=已归档，已解决=已确认处理方式',
			'仅含内部字段，对外沟通稿请另行加工'
		]
	};

	async function loadEvents() {
		try {
			const res = await trpc.event.list.query({ pageSize: 200 });
			events = res.items;
		} catch {}
	}

	async function doExport() {
		if (!selectedModule) return;
		generating = true;
		lastResult = null;
		try {
			const res: any = await trpc.export.exportData.mutate({
				module: selectedModule as any,
				eventId: selectedEventId || undefined,
				dateRange: (startDate || endDate) ? { startDate: startDate || undefined, endDate: endDate || undefined } : undefined,
				format: format as any
			});
			lastResult = res;
			downloadBlob(res.content, res.fileName, res.mimeType);
		} catch (e: any) {
			alert('导出失败: ' + (e?.message ?? '未知错误'));
		} finally {
			generating = false;
		}
	}

	onMount(async () => {
		await loadEvents();
	});
</script>

<div class="p-6 space-y-6">
	<div>
		<h1>数据下载</h1>
		<p class="text-sm text-slate-500 mt-1">所有导出文件自带取数口径说明，便于围绕核销效率向团队解释变化</p>
	</div>

	<div class="grid grid-cols-1 lg:grid-cols-5 gap-6">
		<div class="lg:col-span-3 card">
			<div class="card-header"><h3>📤 导出配置</h3></div>
			<div class="card-body space-y-5">
				<div>
					<label class="label">选择活动</label>
					<select class="select-input" bind:value={selectedEventId}>
						<option value="">全部活动（跨活动汇总）</option>
						{#each events as e}<option value={e.event?.id ?? e.id}>{e.event?.name ?? e.name}</option>{/each}
					</select>
					<p class="text-xs text-slate-500 mt-1">提示：建议针对单活动下载，便于口径与业务核对</p>
				</div>

				<div>
					<label class="label">数据范围（创建/核销时间）</label>
					<div class="flex gap-3">
						<input class="input flex-1" type="date" bind:value={startDate} />
						<span class="self-center text-slate-500">至</span>
						<input class="input flex-1" type="date" bind:value={endDate} />
					</div>
				</div>

				<div>
					<label class="label">导出格式</label>
					<div class="flex gap-4">
						<label class="flex items-center gap-2">
							<input type="radio" bind:group={format} value="csv" class="w-4 h-4" />
							<span class="text-sm">CSV（推荐，Excel 直接打开）</span>
						</label>
						<label class="flex items-center gap-2">
							<input type="radio" bind:group={format} value="json" class="w-4 h-4" />
							<span class="text-sm">JSON（含完整结构化元数据）</span>
						</label>
					</div>
				</div>

				<div>
					<div class="flex items-center justify-between mb-3">
						<label class="label !mb-0">选择数据模块</label>
						<span class="text-xs text-slate-500">{selectedModule ? '已选 1 项' : '请选择至少一个'}</span>
					</div>
					<div class="grid grid-cols-1 md:grid-cols-2 gap-3">
						{#each modules as m}
							<label
								class="border rounded-xl p-4 cursor-pointer transition-all {selectedModule === m.id ? 'border-brand-500 bg-brand-50 ring-2 ring-brand-100' : 'border-slate-200 hover:border-slate-300 bg-white'}"
							>
								<div class="flex items-start gap-3">
									<input
										type="radio"
										name="module"
										bind:group={selectedModule}
										value={m.id}
										class="w-4 h-4 mt-1"
									/>
									<div class="flex-1">
										<div class="font-medium text-sm">{m.name}</div>
										<div class="text-xs text-slate-500 mt-0.5">{m.desc}</div>
									</div>
								</div>
							</label>
						{/each}
					</div>
				</div>

				<button
					class="btn-primary w-full py-3"
					disabled={!selectedModule || generating}
					on:click={doExport}
				>
					{#if generating}
						⏳ 正在生成并下载，请稍候...
					{:else}
						⬇️ 生成并下载（含取数口径）
					{/if}
				</button>
			</div>
		</div>

		<div class="lg:col-span-2 space-y-6">
			<div class="card">
				<div class="card-header"><h3>📝 取数口径说明</h3></div>
				<div class="card-body space-y-4 text-sm">
					<div class="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800 space-y-1">
						<div class="font-semibold">⚠️ 使用前请阅读</div>
						<div>导出 CSV 文件前 10 行以 <code>#</code> 开头，为口径注释行，导入数据库或做透视前请先跳过。</div>
					</div>

					{#if selectedModule && caliberNotes[selectedModule]}
						<div>
							<div class="font-medium text-slate-700 mb-2">📋 {modules.find(m => m.id === selectedModule)?.name} 关键口径</div>
							<ul class="list-disc list-inside space-y-1 text-xs text-slate-600 pl-2">
								{#each caliberNotes[selectedModule] as n}
									<li>{n}</li>
								{/each}
							</ul>
						</div>
					{/if}

					<div class="pt-3 border-t border-slate-200">
						<div class="font-medium text-slate-700 mb-2">🔬 通用取数规则</div>
						<ul class="list-disc list-inside space-y-1 text-xs text-slate-600 pl-2">
							<li>所有金额单位为人民币元，保留两位小数</li>
							<li>所有时间为服务器时间（东八区）</li>
							<li>已删除/已作废记录仍会出现在导出中，以状态字段区分</li>
							<li>空值统一输出为空字符串，非 "N/A" 或 "0"</li>
							<li>口径中包含"取数时间"字段，便于两次导出数据差异核对</li>
						</ul>
					</div>

					<div class="pt-3 border-t border-slate-200">
						<div class="font-medium text-slate-700 mb-2">💡 围绕核销效率解读建议</div>
						<ul class="list-disc list-inside space-y-1 text-xs text-slate-600 pl-2">
							<li>对比"verifications核销记录"中的已核销数 / 总发放数</li>
							<li>按来源维度对比（赞助 vs 线上 vs 线下），找出薄弱渠道</li>
							<li>结合"verification-stats按小时"识别入场高峰与压力点</li>
							<li>异常单中"责任归属"字段可用于量化各环节问题率</li>
							<li>建议与前一日/前一活动同时期环比，避免单日绝对数误读</li>
						</ul>
					</div>
				</div>
			</div>

			{#if lastResult}
				<div class="card">
					<div class="card-header"><h3>✅ 最近一次导出结果</h3></div>
					<div class="card-body space-y-2 text-xs">
						<div class="flex justify-between"><span class="text-slate-500">文件名</span><span class="font-mono">{lastResult.fileName}</span></div>
						<div class="flex justify-between"><span class="text-slate-500">数据行数</span><span class="font-semibold">{lastResult.rowCount}</span></div>
						<div class="flex justify-between"><span class="text-slate-500">格式</span><span>{lastResult.mimeType}</span></div>
						<div class="flex justify-between"><span class="text-slate-500">操作人</span><span>{lastResult.caliber?.operator}</span></div>
						<div class="flex justify-between"><span class="text-slate-500">取数时间</span><span>{lastResult.caliber?.calculatedAt}</span></div>
						<div class="pt-2 border-t border-slate-200">
							<div class="text-slate-500 mb-1">聚合规则</div>
							<div class="bg-slate-50 rounded p-2 space-y-0.5 font-mono text-[10px] max-h-40 overflow-y-auto">
								{#each lastResult.caliber?.aggregationRules ?? [] as rule}
									<div>• {rule}</div>
								{/each}
							</div>
						</div>
					</div>
				</div>
			{/if}
		</div>
	</div>
</div>
