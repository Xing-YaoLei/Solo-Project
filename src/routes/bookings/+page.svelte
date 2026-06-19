<script lang="ts">
	import { trpc } from '$lib/trpc';
	import { onMount } from 'svelte';
	import {
		formatDate,
		formatDateTime,
		getBookingStatusLabel,
		getBookingStatusBadge,
		getSourceLabel,
		getIdTypeLabel
	} from '$lib/utils';

	interface BookingWithProperty {
		booking: any;
		property: any;
		documents?: any[];
	}

	interface DocumentWithVerifier {
		document: any;
		verifier: any;
	}

	let bookings: BookingWithProperty[] = [];
	let properties: any[] = [];
	let currentUser: any = null;
	let loading = true;
	let page = 1;
	let pageSize = 20;
	let totalPages = 1;
	let total = 0;

	let filterProperty = '';
	let filterStatus = '';
	let filterSource = '';
	let filterDateFrom = '';
	let filterDateTo = '';

	let showDetailModal = false;
	let showBookingForm = false;
	let showDocumentForm = false;
	let selectedBooking: BookingWithProperty | null = null;
	let editingBooking: any = null;
	let documents: DocumentWithVerifier[] = [];

	let bookingForm = {
		propertyId: '',
		guestName: '',
		guestPhone: '',
		checkInDate: '',
		checkOutDate: '',
		adults: 1,
		children: 0,
		source: 'other',
		totalPrice: null as number | null,
		notes: ''
	};

	let documentForm = {
		guestName: '',
		idType: 'id_card',
		idNumber: '',
		idFrontUrl: '',
		idBackUrl: ''
	};

	let formError = '';
	let submitting = false;

	async function loadBookings() {
		loading = true;
		try {
			const params: any = { page, pageSize };
			if (filterProperty) params.propertyId = filterProperty;
			if (filterStatus) params.status = filterStatus;
			if (filterSource) params.source = filterSource;
			if (filterDateFrom) params.dateFrom = new Date(filterDateFrom);
			if (filterDateTo) params.dateTo = new Date(filterDateTo);

			const res = await trpc().booking.list.query(params);
			bookings = res.items;
			total = res.total;
			totalPages = res.totalPages;
		} finally {
			loading = false;
		}
	}

	async function loadProperties() {
		try {
			const res = await trpc().property.list.query({ pageSize: 200 });
			properties = res.items;
		} catch (e) {}
	}

	async function openDetail(b: BookingWithProperty) {
		selectedBooking = b;
		showDetailModal = true;
		try {
			documents = await trpc().booking.getDocuments.query({ bookingId: b.booking.id });
		} catch (e) {
			documents = [];
		}
	}

	function closeDetail() {
		showDetailModal = false;
		selectedBooking = null;
		documents = [];
	}

	function openCreateBooking() {
		editingBooking = null;
		bookingForm = {
			propertyId: properties[0]?.property?.id || '',
			guestName: '',
			guestPhone: '',
			checkInDate: '',
			checkOutDate: '',
			adults: 1,
			children: 0,
			source: 'other',
			totalPrice: null,
			notes: ''
		};
		formError = '';
		showBookingForm = true;
	}

	function openEditBooking(b: BookingWithProperty) {
		editingBooking = b.booking;
		bookingForm = {
			propertyId: b.booking.propertyId,
			guestName: b.booking.guestName,
			guestPhone: b.booking.guestPhone,
			checkInDate: formatDate(b.booking.checkInDate),
			checkOutDate: formatDate(b.booking.checkOutDate),
			adults: b.booking.adults || 1,
			children: b.booking.children || 0,
			source: b.booking.source,
			totalPrice: b.booking.totalPrice,
			notes: b.booking.notes || ''
		};
		formError = '';
		showBookingForm = true;
	}

	async function submitBooking() {
		formError = '';
		if (!bookingForm.propertyId) {
			formError = '请选择房源';
			return;
		}
		if (!bookingForm.guestName.trim()) {
			formError = '请输入客人姓名';
			return;
		}
		if (!bookingForm.guestPhone.trim()) {
			formError = '请输入客人电话';
			return;
		}
		if (!bookingForm.checkInDate) {
			formError = '请选择入住日期';
			return;
		}
		if (!bookingForm.checkOutDate) {
			formError = '请选择退房日期';
			return;
		}
		if (new Date(bookingForm.checkInDate) >= new Date(bookingForm.checkOutDate)) {
			formError = '退房日期必须晚于入住日期';
			return;
		}

		submitting = true;
		try {
			const payload: any = {
				propertyId: bookingForm.propertyId,
				guestName: bookingForm.guestName.trim(),
				guestPhone: bookingForm.guestPhone.trim(),
				checkInDate: new Date(bookingForm.checkInDate),
				checkOutDate: new Date(bookingForm.checkOutDate),
				adults: bookingForm.adults,
				children: bookingForm.children,
				source: bookingForm.source as any,
				notes: bookingForm.notes || undefined
			};
			if (bookingForm.totalPrice !== null) payload.totalPrice = bookingForm.totalPrice;

			if (editingBooking) {
				await trpc().booking.update.mutate({ id: editingBooking.id, ...payload });
			} else {
				await trpc().booking.create.mutate(payload);
			}
			showBookingForm = false;
			await loadBookings();
		} catch (e: any) {
			formError = e?.message || '保存失败';
		} finally {
			submitting = false;
		}
	}

	async function updateBookingStatus(booking: any, status: string) {
		if (!confirm(`确定将预订状态改为「${getBookingStatusLabel(status)}」吗？`)) return;
		try {
			await trpc().booking.update.mutate({ id: booking.id, status: status as any });
			await loadBookings();
		} catch (e: any) {
			alert(e?.message || '操作失败');
		}
	}

	function openAddDocument() {
		documentForm = {
			guestName: selectedBooking?.booking?.guestName || '',
			idType: 'id_card',
			idNumber: '',
			idFrontUrl: '',
			idBackUrl: ''
		};
		formError = '';
		showDocumentForm = true;
	}

	async function submitDocument() {
		formError = '';
		if (!documentForm.guestName.trim()) {
			formError = '请输入证件持有人姓名';
			return;
		}
		if (!documentForm.idNumber.trim()) {
			formError = '请输入证件号码';
			return;
		}
		submitting = true;
		try {
			await trpc().booking.addDocument.mutate({
				bookingId: selectedBooking!.booking.id,
				guestName: documentForm.guestName.trim(),
				idType: documentForm.idType as any,
				idNumber: documentForm.idNumber.trim(),
				idFrontUrl: documentForm.idFrontUrl || undefined,
				idBackUrl: documentForm.idBackUrl || undefined
			});
			showDocumentForm = false;
			documents = await trpc().booking.getDocuments.query({ bookingId: selectedBooking!.booking.id });
		} catch (e: any) {
			formError = e?.message || '保存失败';
		} finally {
			submitting = false;
		}
	}

	async function verifyDocument(doc: DocumentWithVerifier) {
		if (!confirm('确定核验此证件吗？')) return;
		try {
			await trpc().booking.verifyDocument.mutate({ documentId: doc.document.id });
			documents = await trpc().booking.getDocuments.query({ bookingId: selectedBooking!.booking.id });
		} catch (e: any) {
			alert(e?.message || '核验失败');
		}
	}

	function prevPage() {
		if (page > 1) {
			page--;
			loadBookings();
		}
	}

	function nextPage() {
		if (page < totalPages) {
			page++;
			loadBookings();
		}
	}

	function resetFilters() {
		filterProperty = '';
		filterStatus = '';
		filterSource = '';
		filterDateFrom = '';
		filterDateTo = '';
		page = 1;
		loadBookings();
	}

	onMount(async () => {
		[currentUser] = await Promise.all([trpc().user.getCurrent.query().catch(() => null)]);
		await loadProperties();
		await loadBookings();
	});

	const isManager = currentUser?.role === 'admin' || currentUser?.role === 'manager';
</script>

<div class="p-8">
	<div class="flex items-center justify-between mb-8">
		<div>
			<h1 class="text-2xl font-bold text-gray-900">预订 &amp; 证件管理</h1>
			<p class="text-gray-500 mt-1">预订列表 · 入住证件 · 核验管理</p>
		</div>
		{#if isManager}
			<button on:click={openCreateBooking} class="btn-primary">
				<span class="mr-1">+</span> 新增预订
			</button>
		{/if}
	</div>

	<div class="card mb-6">
		<div class="card-body">
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
				<div>
					<label class="label">房源</label>
					<select bind:value={filterProperty} class="input" on:change={() => { page = 1; loadBookings(); }}>
						<option value="">全部房源</option>
						{#each properties as p}
							<option value={p.property.id}>{p.property.name}</option>
						{/each}
					</select>
				</div>
				<div>
					<label class="label">状态</label>
					<select bind:value={filterStatus} class="input" on:change={() => { page = 1; loadBookings(); }}>
						<option value="">全部状态</option>
						<option value="confirmed">已确认</option>
						<option value="checked_in">入住中</option>
						<option value="checked_out">已退房</option>
						<option value="cancelled">已取消</option>
					</select>
				</div>
				<div>
					<label class="label">来源</label>
					<select bind:value={filterSource} class="input" on:change={() => { page = 1; loadBookings(); }}>
						<option value="">全部来源</option>
						<option value="airbnb">Airbnb</option>
						<option value="tujia">途家</option>
						<option value="xiaozhu">小猪</option>
						<option value="meituan">美团</option>
						<option value="direct">直订</option>
						<option value="other">其他</option>
					</select>
				</div>
				<div>
					<label class="label">入住日期从</label>
					<input type="date" bind:value={filterDateFrom} class="input" on:change={() => { page = 1; loadBookings(); }} />
				</div>
				<div>
					<label class="label">退房日期到</label>
					<input type="date" bind:value={filterDateTo} class="input" on:change={() => { page = 1; loadBookings(); }} />
				</div>
			</div>
			<div class="mt-4 flex justify-end">
				<button on:click={resetFilters} class="btn-secondary text-sm">重置筛选</button>
			</div>
		</div>
	</div>

	<div class="card">
		{#if loading}
			<div class="card-body flex items-center justify-center py-16">
				<div class="text-gray-500">加载中...</div>
			</div>
		{:else if bookings.length === 0}
			<div class="card-body text-center py-16">
				<div class="text-4xl mb-3">📝</div>
				<div class="text-gray-500">暂无预订数据</div>
			</div>
		{:else}
			<div class="overflow-x-auto">
				<table class="table">
					<thead>
						<tr>
							<th>房源</th>
							<th>客人姓名</th>
							<th>联系电话</th>
							<th>入住日期</th>
							<th>退房日期</th>
							<th>人数</th>
							<th>来源</th>
							<th>状态</th>
							<th>操作</th>
						</tr>
					</thead>
					<tbody>
						{#each bookings as b}
							<tr>
								<td class="font-medium">{b.property?.name || '-'}</td>
								<td>{b.booking.guestName}</td>
								<td class="text-gray-500">{b.booking.guestPhone}</td>
								<td>{formatDate(b.booking.checkInDate)}</td>
								<td>{formatDate(b.booking.checkOutDate)}</td>
								<td class="text-gray-500">
									{b.booking.adults}成人
									{#if b.booking.children > 0} · {b.booking.children}儿童{/if}
								</td>
								<td>{getSourceLabel(b.booking.source)}</td>
								<td>
									<span class="badge badge-{getBookingStatusBadge(b.booking.status)}">
										{getBookingStatusLabel(b.booking.status)}
									</span>
								</td>
								<td>
									<div class="flex items-center gap-2">
										<button
											on:click={() => openDetail(b)}
											class="text-sm text-brand-600 hover:text-brand-700"
										>
											详情
										</button>
										{#if isManager}
											<button
												on:click={() => openEditBooking(b)}
												class="text-sm text-gray-600 hover:text-gray-900"
											>
												编辑
											</button>
											{#if b.booking.status === 'confirmed'}
												<button
													on:click={() => updateBookingStatus(b.booking, 'checked_in')}
													class="text-sm text-green-600 hover:text-green-700"
												>
													办理入住
												</button>
											{/if}
											{#if b.booking.status === 'checked_in'}
												<button
													on:click={() => updateBookingStatus(b.booking, 'checked_out')}
													class="text-sm text-blue-600 hover:text-blue-700"
												>
													办理退房
												</button>
											{/if}
										{/if}
									</div>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
			{#if totalPages > 1}
				<div class="card-body border-t border-gray-200 flex items-center justify-between">
					<div class="text-sm text-gray-500">
						共 {total} 条，第 {page}/{totalPages} 页
					</div>
					<div class="flex gap-2">
						<button on:click={prevPage} disabled={page <= 1} class="btn-secondary text-sm">上一页</button>
						<button on:click={nextPage} disabled={page >= totalPages} class="btn-secondary text-sm">下一页</button>
					</div>
				</div>
			{/if}
		{/if}
	</div>
</div>

{#if showDetailModal && selectedBooking}
	<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" on:click|self={closeDetail}>
		<div class="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
			<div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
				<h3 class="text-lg font-semibold text-gray-900">预订详情</h3>
				<button on:click={closeDetail} class="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
			</div>
			<div class="overflow-y-auto flex-1 p-6 space-y-6">
				<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
					<div>
						<h4 class="font-medium text-gray-900 mb-3">预订信息</h4>
						<div class="space-y-2 text-sm">
							<div class="flex justify-between py-2 border-b border-gray-100">
								<span class="text-gray-500">房源</span>
								<span class="font-medium">{selectedBooking.property?.name || '-'}</span>
							</div>
							<div class="flex justify-between py-2 border-b border-gray-100">
								<span class="text-gray-500">客人姓名</span>
								<span class="font-medium">{selectedBooking.booking.guestName}</span>
							</div>
							<div class="flex justify-between py-2 border-b border-gray-100">
								<span class="text-gray-500">联系电话</span>
								<span>{selectedBooking.booking.guestPhone}</span>
							</div>
							<div class="flex justify-between py-2 border-b border-gray-100">
								<span class="text-gray-500">入住日期</span>
								<span>{formatDate(selectedBooking.booking.checkInDate)}</span>
							</div>
							<div class="flex justify-between py-2 border-b border-gray-100">
								<span class="text-gray-500">退房日期</span>
								<span>{formatDate(selectedBooking.booking.checkOutDate)}</span>
							</div>
							<div class="flex justify-between py-2 border-b border-gray-100">
								<span class="text-gray-500">入住人数</span>
								<span>
									{selectedBooking.booking.adults}成人
									{#if selectedBooking.booking.children > 0} · {selectedBooking.booking.children}儿童{/if}
								</span>
							</div>
							<div class="flex justify-between py-2 border-b border-gray-100">
								<span class="text-gray-500">订单来源</span>
								<span>{getSourceLabel(selectedBooking.booking.source)}</span>
							</div>
							<div class="flex justify-between py-2 border-b border-gray-100">
								<span class="text-gray-500">订单金额</span>
								<span>{selectedBooking.booking.totalPrice !== null ? '¥' + selectedBooking.booking.totalPrice : '-'}</span>
							</div>
							<div class="flex justify-between py-2 border-b border-gray-100">
								<span class="text-gray-500">状态</span>
								<span class="badge badge-{getBookingStatusBadge(selectedBooking.booking.status)}">
									{getBookingStatusLabel(selectedBooking.booking.status)}
								</span>
							</div>
							{#if selectedBooking.booking.notes}
								<div class="py-2 border-b border-gray-100">
									<div class="text-gray-500 mb-1">备注</div>
									<div class="text-gray-700 whitespace-pre-wrap">{selectedBooking.booking.notes}</div>
								</div>
							{/if}
						</div>
					</div>
					<div>
						<div class="flex items-center justify-between mb-3">
							<h4 class="font-medium text-gray-900">入住证件</h4>
							{#if isManager}
								<button on:click={openAddDocument} class="btn-secondary text-xs">
									+ 添加证件
								</button>
							{/if}
						</div>
						{#if documents.length === 0}
							<div class="text-center py-8 text-gray-400 text-sm bg-gray-50 rounded-lg">
								暂无证件信息
							</div>
						{:else}
							<div class="space-y-3">
								{#each documents as d}
									<div class="border border-gray-200 rounded-lg p-4">
										<div class="flex items-start justify-between">
											<div class="flex-1">
												<div class="flex items-center gap-2 mb-2">
													<span class="font-medium">{d.document.guestName}</span>
													<span class="badge badge-info">{getIdTypeLabel(d.document.idType)}</span>
													{#if d.document.verifiedAt}
														<span class="badge badge-success">已核验</span>
													{:else}
														<span class="badge badge-warning">待核验</span>
													{/if}
												</div>
												<div class="text-sm text-gray-500 mb-1">
													证件号：{d.document.idNumber}
												</div>
												{#if d.document.verifiedAt}
													<div class="text-xs text-gray-400">
														核验人：{d.verifier?.realName || d.verifier?.username || '-'} · {formatDateTime(d.document.verifiedAt)}
													</div>
												{/if}
												{#if d.document.idFrontUrl || d.document.idBackUrl}
													<div class="mt-2 flex gap-2">
														{#if d.document.idFrontUrl}
															<a href={d.document.idFrontUrl} target="_blank" class="text-xs text-brand-600 hover:underline">
																[证件正面]
															</a>
														{/if}
														{#if d.document.idBackUrl}
															<a href={d.document.idBackUrl} target="_blank" class="text-xs text-brand-600 hover:underline">
																[证件反面]
															</a>
														{/if}
													</div>
												{/if}
											</div>
											{#if isManager && !d.document.verifiedAt}
												<button
													on:click={() => verifyDocument(d)}
													class="btn-success text-xs"
												>
													核验
												</button>
											{/if}
										</div>
									</div>
								{/each}
							</div>
						{/if}
					</div>
				</div>
			</div>
			<div class="px-6 py-4 border-t border-gray-200 flex justify-end">
				<button on:click={closeDetail} class="btn-secondary">关闭</button>
			</div>
		</div>
	</div>
{/if}

{#if showBookingForm}
	<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" on:click|self={() => { showBookingForm = false; }}>
		<div class="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
			<div class="px-6 py-4 border-b border-gray-200">
				<h3 class="text-lg font-semibold text-gray-900">{editingBooking ? '编辑预订' : '新增预订'}</h3>
			</div>
			<div class="overflow-y-auto flex-1 p-6">
				{#if formError}
					<div class="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-md">{formError}</div>
				{/if}
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div class="md:col-span-2">
						<label class="label">房源 <span class="text-red-500">*</span></label>
						<select bind:value={bookingForm.propertyId} class="input">
							<option value="">请选择房源</option>
							{#each properties as p}
								<option value={p.property.id}>{p.property.name}</option>
							{/each}
						</select>
					</div>
					<div>
						<label class="label">客人姓名 <span class="text-red-500">*</span></label>
						<input bind:value={bookingForm.guestName} class="input" placeholder="请输入客人姓名" />
					</div>
					<div>
						<label class="label">联系电话 <span class="text-red-500">*</span></label>
						<input bind:value={bookingForm.guestPhone} class="input" placeholder="请输入联系电话" />
					</div>
					<div>
						<label class="label">入住日期 <span class="text-red-500">*</span></label>
						<input type="date" bind:value={bookingForm.checkInDate} class="input" />
					</div>
					<div>
						<label class="label">退房日期 <span class="text-red-500">*</span></label>
						<input type="date" bind:value={bookingForm.checkOutDate} class="input" />
					</div>
					<div>
						<label class="label">成人数</label>
						<input type="number" min="1" bind:value={bookingForm.adults} class="input" />
					</div>
					<div>
						<label class="label">儿童数</label>
						<input type="number" min="0" bind:value={bookingForm.children} class="input" />
					</div>
					<div>
						<label class="label">订单来源</label>
						<select bind:value={bookingForm.source} class="input">
							<option value="airbnb">Airbnb</option>
							<option value="tujia">途家</option>
							<option value="xiaozhu">小猪</option>
							<option value="meituan">美团</option>
							<option value="direct">直订</option>
							<option value="other">其他</option>
						</select>
					</div>
					<div>
						<label class="label">订单金额（元）</label>
						<input type="number" bind:value={bookingForm.totalPrice} class="input" placeholder="可选" />
					</div>
					<div class="md:col-span-2">
						<label class="label">备注</label>
						<textarea bind:value={bookingForm.notes} class="input" rows="3" placeholder="可选"></textarea>
					</div>
				</div>
			</div>
			<div class="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
				<button on:click={() => { showBookingForm = false; }} class="btn-secondary" disabled={submitting}>
					取消
				</button>
				<button on:click={submitBooking} class="btn-primary" disabled={submitting}>
					{submitting ? '保存中...' : '保存'}
				</button>
			</div>
		</div>
	</div>
{/if}

{#if showDocumentForm}
	<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" on:click|self={() => { showDocumentForm = false; }}>
		<div class="bg-white rounded-lg shadow-xl w-full max-w-lg">
			<div class="px-6 py-4 border-b border-gray-200">
				<h3 class="text-lg font-semibold text-gray-900">添加入住证件</h3>
			</div>
			<div class="p-6">
				{#if formError}
					<div class="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-md">{formError}</div>
				{/if}
				<div class="space-y-4">
					<div>
						<label class="label">证件持有人姓名 <span class="text-red-500">*</span></label>
						<input bind:value={documentForm.guestName} class="input" placeholder="请输入姓名" />
					</div>
					<div>
						<label class="label">证件类型</label>
						<select bind:value={documentForm.idType} class="input">
							<option value="id_card">身份证</option>
							<option value="passport">护照</option>
							<option value="driver_license">驾驶证</option>
							<option value="other">其他</option>
						</select>
					</div>
					<div>
						<label class="label">证件号码 <span class="text-red-500">*</span></label>
						<input bind:value={documentForm.idNumber} class="input" placeholder="请输入证件号码" />
					</div>
					<div>
						<label class="label">证件正面图片URL</label>
						<input bind:value={documentForm.idFrontUrl} class="input" placeholder="可选，图片链接" />
					</div>
					<div>
						<label class="label">证件反面图片URL</label>
						<input bind:value={documentForm.idBackUrl} class="input" placeholder="可选，图片链接" />
					</div>
				</div>
			</div>
			<div class="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
				<button on:click={() => { showDocumentForm = false; }} class="btn-secondary" disabled={submitting}>
					取消
				</button>
				<button on:click={submitDocument} class="btn-primary" disabled={submitting}>
					{submitting ? '保存中...' : '保存'}
				</button>
			</div>
		</div>
	</div>
{/if}

<script lang="ts" context="module">
	export const ssr = false;
</script>
