<script lang="ts">
	import { trpc } from '$lib/trpc/client';
	import { onMount } from 'svelte';
	import { statusBadge } from '$lib/utils';

	let events: any[] = [];
	let selectedEventId = '';
	let seatMaps: any[] = [];
	let selectedSeatMapId = '';
	let data: any = null;
	let loading = false;

	let showCreateModal = false;
	let form: any = { layoutType: 'theater' };
	let groupedSeats: [string, any[]][] = [];

	function groupSeatsByRow(seats: any[]): [string, any[]][] {
		const m: Record<string, any[]> = {};
		if (!seats) return [];
		for (const s of seats) {
			if (!m[s.rowNo]) m[s.rowNo] = [];
			m[s.rowNo].push(s);
		}
		return Object.entries(m).sort((a, b) => Number(a[0]) - Number(b[0]));
	}

	async function loadEvents() {
		try {
			const res = await trpc.event.list.query({ pageSize: 200 });
			events = res.items;
			if (events[0]) selectedEventId = events[0].event?.id ?? events[0].id;
		} catch {}
	}

	async function loadSeatMaps() {
		if (!selectedEventId) return;
		try {
			seatMaps = await trpc.seat.listSeatMaps.query({ eventId: selectedEventId });
			if (seatMaps[0]) selectedSeatMapId = seatMaps[0].id;
		} catch {
			seatMaps = [];
		}
	}

	async function load() {
		if (!selectedEventId) return;
		loading = true;
		try {
			data = await trpc.seat.getSeatMap.query({
				eventId: selectedEventId,
				seatMapId: selectedSeatMapId || undefined
			});
			groupedSeats = groupSeatsByRow(data?.seats ?? []);
		} finally {
			loading = false;
		}
	}

	async function createSeatMap() {
		try {
			await trpc.seat.createSeatMap.mutate({
				eventId: form.eventId ?? selectedEventId,
				name: form.name,
				layoutType: form.layoutType,
				rows: Number(form.rows) || 0,
				cols: Number(form.cols) || 0,
				zones: form.zones ? JSON.parse(form.zones) : undefined,
				generateSeats: !!form.generateSeats
			});
			showCreateModal = false;
			form = { layoutType: 'theater' };
			await loadSeatMaps();
			await load();
		} catch (e: any) {
			alert(e?.message ?? '创建失败');
		}
	}

	function seatColor(status: string) {
		switch (status) {
			case 'available': return 'bg-green-100 border-green-400 text-green-800 hover:bg-green-200';
			case 'sold': return 'bg-blue-500 border-blue-700 text-white cursor-not-allowed';
			case 'held': return 'bg-yellow-200 border-yellow-500 text-yellow-800';
			case 'reserved': return 'bg-purple-200 border-purple-500 text-purple-800';
			case 'disabled': return 'bg-slate-300 border-slate-500 text-slate-600 cursor-not-allowed';
			case 'not_for_sale': return 'bg-slate-200 border-slate-400 text-slate-500';
			default: return 'bg-slate-100 border-slate-300';
		}
	}

	onMount(async () => {
		await loadEvents();
	});

	$effect(() => {
		loadSeatMaps();
	});
	$effect(() => {
		load();
	});
</script>

<div class="p-6 space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h1>座位图</h1>
			<p class="text-sm text-slate-500 mt-1">可视化管理场馆座位分区、售卖状态与选座占用</p>
		</div>
		<button class="btn-primary" disabled={!selectedEventId} on:click={() => { form.eventId = selectedEventId; showCreateModal = true; }}>➕ 新建座位图</button>
	</div>

	<div class="card card-body space-y-4">
		<div class="flex flex-wrap gap-3 items-center">
			<div>
				<label class="label !mb-0 mr-2 text-sm">选择活动</label>
				<select class="select-input w-56" bind:value={selectedEventId}>
					<option value="">请选择</option>
					{#each events as e}<option value={e.event?.id ?? e.id}>{e.event?.name ?? e.name}</option>{/each}
				</select>
			</div>
			{#if seatMaps.length > 0}
				<div>
					<label class="label !mb-0 mr-2 text-sm">座位图</label>
					<select class="select-input w-48" bind:value={selectedSeatMapId}>
						{#each seatMaps as sm}<option value={sm.id}>{sm.name} ({sm.rows}x{sm.cols})</option>{/each}
					</select>
				</div>
			{/if}
		</div>
	</div>

	{#if selectedEventId && (loading || data)}
		<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
			<div class="stat-card"><div class="stat-label">总座位</div><div class="stat-value">{data?.statistics?.total ?? 0}</div></div>
			<div class="stat-card"><div class="stat-label">可售</div><div class="stat-value text-green-600">{data?.statistics?.available ?? 0}</div></div>
			<div class="stat-card"><div class="stat-label">已售</div><div class="stat-value text-blue-600">{data?.statistics?.sold ?? 0}</div></div>
			<div class="stat-card"><div class="stat-label">预占/预留</div><div class="stat-value text-yellow-600">{(data?.statistics?.held ?? 0) + (data?.statistics?.reserved ?? 0)}</div></div>
		</div>

		<div class="card">
			<div class="card-header"><h3>{data?.seatMap?.name ?? '座位详情'}</h3>
				<div class="flex items-center gap-4 text-xs">
					<span class="flex items-center gap-1"><span class="w-3 h-3 rounded-sm bg-green-100 border border-green-400" />可售</span>
					<span class="flex items-center gap-1"><span class="w-3 h-3 rounded-sm bg-blue-500" />已售</span>
					<span class="flex items-center gap-1"><span class="w-3 h-3 rounded-sm bg-yellow-200 border border-yellow-500" />预占</span>
					<span class="flex items-center gap-1"><span class="w-3 h-3 rounded-sm bg-purple-200 border border-purple-500" />预留</span>
					<span class="flex items-center gap-1"><span class="w-3 h-3 rounded-sm bg-slate-300 border border-slate-500" />禁用</span>
				</div>
			</div>
			<div class="card-body overflow-auto">
				{#if loading}
					<div class="py-24 text-center text-slate-400">加载中...</div>
				{:else if !data?.seatMap}
					<div class="empty-state">当前活动还没有座位图，点击右上角新建</div>
				{:else if data?.seats?.length === 0}
					<div class="empty-state">座位图已创建但还没有生成座位，可重新编辑座位图或点击"生成座位"</div>
				{:else}
					<div class="py-4 text-center mb-4">
						<div class="inline-block px-16 py-2 bg-slate-800 text-white text-sm rounded-b-3xl font-medium tracking-widest">
							舞 台 / STAGE
						</div>
					</div>
					<div class="space-y-1">
						{#each groupedSeats as [rowNo, rowSeats]}
							<div class="flex items-center justify-center gap-0.5">
								<span class="w-8 text-xs text-slate-500 text-right pr-2">{rowNo}排</span>
								{#each (rowSeats.slice().sort((a: any, b: any) => Number(a.colNo) - Number(b.colNo))) as seat}
									<button
										class="w-7 h-7 text-[10px] rounded border-2 flex items-center justify-center font-medium transition-all {seatColor(seat.status)}"
										title="{seat.seatNo} · {seat.status}"
										type="button"
									>
										{seat.colNo}
									</button>
								{/each}
							</div>
						{/each}
					</div>
					<div class="mt-8 pt-6 border-t border-slate-200">
						<h4 class="font-medium mb-3 text-sm">分区说明</h4>
						<div class="flex flex-wrap gap-3">
							{#each (data.seatMap.zones ?? []) as z}
								<span class="tag" style="border-color:{z.color}">
									<span class="inline-block w-2 h-2 rounded mr-1" style="background:{z.color}" />
									{z.name}
								</span>
							{:else}
								<span class="text-xs text-slate-400">未设置分区</span>
							{/each}
						</div>
					</div>
				{/if}
			</div>
		</div>
	{/if}
</div>

{#if showCreateModal}
	<div class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
		<div class="card w-full max-w-xl max-h-[90vh] overflow-y-auto">
			<div class="card-header"><h3>新建座位图</h3><button class="btn-ghost !p-1" on:click={() => (showCreateModal = false)}>✕</button></div>
			<div class="card-body space-y-4">
				<div>
					<label class="label">名称 *</label>
					<input class="input" bind:value={form.name} required placeholder="例如：内场座位图 / A区场馆" />
				</div>
				<div class="grid grid-cols-2 gap-4">
					<div>
						<label class="label">布局类型</label>
						<select class="select-input" bind:value={form.layoutType}>
							<option value="theater">剧场式</option>
							<option value="concert">演唱会</option>
							<option value="arena">体育馆</option>
							<option value="custom">自定义</option>
						</select>
					</div>
				</div>
				<div class="grid grid-cols-2 gap-4">
					<div><label class="label">排数 (Rows)</label><input class="input" type="number" min="0" bind:value={form.rows} placeholder="20" /></div>
					<div><label class="label">列数 (Cols)</label><input class="input" type="number" min="0" bind:value={form.cols} placeholder="30" /></div>
				</div>
				<div>
					<label class="label">分区 JSON（可选）</label>
					<textarea class="input min-h-[100px] font-mono text-xs" bind:value={form.zones}
						placeholder='[{"id":"VIP","name":"VIP区","rowRange":[1,5],"color":"#FF0000"},...]' />
				</div>
				<label class="flex items-center gap-2">
					<input type="checkbox" bind:checked={form.generateSeats} class="w-4 h-4" checked />
					<span class="text-sm">根据行列自动生成座位</span>
				</label>
				<div class="flex justify-end gap-2 pt-2">
					<button class="btn-secondary" on:click={() => (showCreateModal = false)}>取消</button>
					<button class="btn-primary" disabled={!form.name} on:click={createSeatMap}>保存</button>
				</div>
			</div>
		</div>
	</div>
{/if}
