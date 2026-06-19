<script lang="ts">
  import { onMount } from 'svelte';
  import { trpc } from '$lib/trpc/client';
  import { userStore } from '$lib/stores/user';
  import {
    Search,
    Car,
    Plus,
    Check,
    AlertTriangle,
    Loader2,
    Wrench,
    ChevronRight,
    X
  } from 'lucide-svelte';

  let loading = false;
  let saving = false;
  let searching = false;
  let vehicleSearch = '';
  let searchResults: any[] = [];
  let selectedVehicle: any = null;
  let diagnosisResult = '';
  let quoteItems: any[] = [];
  let categories: string[] = [];
  let selectedCategory = '';
  let selectedItems: Record<string, number> = {};
  let showNewVehicle = false;
  let newVehicleForm: any = {};
  let users: any[] = [];

  async function loadData() {
    loading = true;
    try {
      [quoteItems, categories, users] = await Promise.all([
        trpc.quote.list.query({ isActive: true }),
        trpc.quote.getCategories.query(),
        trpc.analysis.getUsers.query()
      ]);
    } finally {
      loading = false;
    }
  }

  async function searchVehicles() {
    if (!vehicleSearch.trim()) {
      searchResults = [];
      return;
    }
    searching = true;
    try {
      searchResults = await trpc.workorder.searchVehicles.query(vehicleSearch);
    } finally {
      searching = false;
    }
  }

  function selectVehicle(vehicle: any) {
    selectedVehicle = vehicle;
    searchResults = [];
    vehicleSearch = '';
  }

  function toggleItem(itemId: string) {
    if (selectedItems[itemId]) {
      delete selectedItems[itemId];
    } else {
      selectedItems[itemId] = 1;
    }
    selectedItems = { ...selectedItems };
  }

  function updateQuantity(itemId: string, quantity: number) {
    if (quantity < 1) {
      delete selectedItems[itemId];
      selectedItems = { ...selectedItems };
    } else {
      selectedItems[itemId] = quantity;
    }
  }

  $: selectedQuoteItems = Object.keys(selectedItems).map(id => {
    const item = quoteItems.find(i => i.id === id);
    if (!item) return null;
    const qty = selectedItems[id];
    const laborTotal = parseFloat(item.laborPrice) * parseFloat(item.laborHours) * qty;
    const partsTotal = (item.parts || []).reduce((sum: number, p: any) => sum + parseFloat(p.unitPrice) * p.quantity * qty, 0);
    return {
      ...item,
      quantity: qty,
      subtotal: laborTotal + partsTotal
    };
  }).filter(Boolean);

  $: totalAmount = selectedQuoteItems.reduce((sum, item) => sum + (item?.subtotal || 0), 0);

  $: filteredItems = quoteItems.filter(item => {
    if (!selectedCategory) return true;
    return item.category === selectedCategory;
  });

  async function createVehicle() {
    try {
      const vehicle = await trpc.workorder.createVehicle.mutate(newVehicleForm);
      selectVehicle(vehicle);
      showNewVehicle = false;
      newVehicleForm = {};
    } catch (e: any) {
      alert(e.message || '创建车辆失败');
    }
  }

  async function createWorkOrder() {
    if (!selectedVehicle) {
      alert('请先选择车辆');
      return;
    }
    if (selectedQuoteItems.length === 0) {
      alert('请至少选择一个维修项目');
      return;
    }

    saving = true;
    try {
      const order = await trpc.workorder.create.mutate({
        vehicleId: selectedVehicle.id,
        diagnosisResult,
        items: selectedQuoteItems.map(item => ({
          quoteItemId: item.id,
          quantity: item.quantity
        })),
        status: 'quoted'
      });

      const shortageCheck = confirm('是否需要检查配件库存并上报缺货？');
      if (shortageCheck) {
        const managers = users.filter(u => u.role === 'manager');
        if (managers.length > 0) {
          for (const item of selectedQuoteItems) {
            for (const part of (item.parts || [])) {
              const shouldReport = confirm(`配件【${part.partName}】是否缺货？`);
              if (shouldReport) {
                await trpc.shortage.create.mutate({
                  workOrderId: order.id,
                  partNumber: part.partNumber,
                  partName: part.partName,
                  quantity: part.quantity * item.quantity,
                  assigneeId: managers[0].id
                });
              }
            }
          }
        }
      }

      alert('工单创建成功！');
      resetForm();
    } catch (e: any) {
      alert(e.message || '创建工单失败');
    } finally {
      saving = false;
    }
  }

  function resetForm() {
    selectedVehicle = null;
    diagnosisResult = '';
    selectedItems = {};
  }

  function calculateItemTotal(item: any): number {
    const laborTotal = parseFloat(item.laborPrice) * parseFloat(item.laborHours);
    const partsTotal = (item.parts || []).reduce((sum: number, p: any) => sum + parseFloat(p.unitPrice) * p.quantity, 0);
    return laborTotal + partsTotal;
  }

  onMount(() => {
    loadData();
  });
</script>

<div class="space-y-6">
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <div class="lg:col-span-1 space-y-6">
      <div class="card p-5 animate-stagger">
        <h2 class="font-display text-lg font-semibold text-industrial-text mb-4 flex items-center gap-2">
          <Car class="w-5 h-5 text-primary-400" />
          选择车辆
        </h2>

        <div class="space-y-4">
          <div class="relative">
            <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-industrial-text-muted" />
            <input
              type="text"
              bind:value={vehicleSearch}
              on:input={searchVehicles}
              class="input pl-10"
              placeholder="搜索车牌号或车架号..."
            />
            {#if searching}
              <Loader2 class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-industrial-text-muted animate-spin" />
            {/if}
          </div>

          {#if searchResults.length > 0}
            <div class="bg-industrial-bg border border-industrial-border rounded-lg overflow-hidden max-h-48 overflow-y-auto scrollbar-thin">
              {#each searchResults as vehicle (vehicle.id)}
                <button
                  on:click={() => selectVehicle(vehicle)}
                  class="w-full p-3 text-left hover:bg-industrial-border/30 transition-colors border-b border-industrial-border last:border-b-0"
                >
                  <div class="font-medium text-industrial-text">{vehicle.plateNumber}</div>
                  <div class="text-sm text-industrial-text-muted">
                    {vehicle.brand} {vehicle.model} · {vehicle.vin?.slice(-8)}
                  </div>
                </button>
              {/each}
            </div>
          {/if}

          <button
            on:click={() => showNewVehicle = true}
            class="btn btn-secondary w-full text-sm"
          >
            <Plus class="w-4 h-4 mr-1" /> 新增车辆档案
          </button>

          {#if selectedVehicle}
            <div class="p-4 rounded-lg bg-primary-500/10 border border-primary-500/30">
              <div class="flex items-center justify-between mb-2">
                <span class="font-mono text-lg font-bold text-primary-400">
                  {selectedVehicle.plateNumber}
                </span>
                <button
                  on:click={() => selectedVehicle = null}
                  class="p-1 rounded hover:bg-primary-500/20 text-industrial-text-muted hover:text-primary-400"
                >
                  <X class="w-4 h-4" />
                </button>
              </div>
              <div class="space-y-1 text-sm">
                <p class="text-industrial-text">
                  <span class="text-industrial-text-muted">品牌：</span>
                  {selectedVehicle.brand} {selectedVehicle.model}
                </p>
                <p class="text-industrial-text">
                  <span class="text-industrial-text-muted">年份：</span>
                  {selectedVehicle.year || '-'}
                </p>
                <p class="text-industrial-text">
                  <span class="text-industrial-text-muted">里程：</span>
                  {selectedVehicle.currentMileage?.toLocaleString()} km
                </p>
                <p class="text-industrial-text">
                  <span class="text-industrial-text-muted">车架号：</span>
                  {selectedVehicle.vin}
                </p>
              </div>
            </div>
          {/if}
        </div>
      </div>

      <div class="card p-5 animate-stagger" style="animation-delay: 80ms">
        <h2 class="font-display text-lg font-semibold text-industrial-text mb-4 flex items-center gap-2">
          <Wrench class="w-5 h-5 text-accent-orange" />
          诊断结果
        </h2>
        <textarea
          bind:value={diagnosisResult}
          rows="6"
          class="input resize-none"
          placeholder="请输入车辆诊断结果..."
        />
      </div>

      <div class="card p-5 animate-stagger" style="animation-delay: 160ms">
        <h2 class="font-display text-lg font-semibold text-industrial-text mb-4">报价汇总</h2>
        {#if selectedQuoteItems.length === 0}
          <div class="text-center py-6 text-industrial-text-muted text-sm">
            请从右侧选择维修项目
          </div>
        {:else}
          <div class="space-y-3">
            {#each selectedQuoteItems as item (item.id)}
              <div class="flex items-center justify-between py-2 border-b border-industrial-border last:border-b-0">
                <div class="flex-1">
                  <p class="text-sm font-medium text-industrial-text">{item.name}</p>
                  <p class="text-xs text-industrial-text-muted">× {item.quantity}</p>
                </div>
                <span class="font-mono text-accent-green font-medium">
                  ¥{item.subtotal.toFixed(2)}
                </span>
              </div>
            {/each}
            <div class="pt-3 mt-2 border-t-2 border-primary-500/50">
              <div class="flex items-center justify-between">
                <span class="font-display font-semibold text-industrial-text">总计</span>
                <span class="font-mono text-2xl font-bold text-accent-green">
                  ¥{totalAmount.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        {/if}
      </div>

      <button
        on:click={createWorkOrder}
        disabled={saving || !selectedVehicle || selectedQuoteItems.length === 0}
        class="btn btn-primary w-full h-12 text-base font-semibold disabled:opacity-50"
      >
        {#if saving}
          <span class="flex items-center justify-center gap-2">
            <Loader2 class="w-5 h-5 animate-spin" />
            保存中...
          </span>
        {:else}
          <span class="flex items-center justify-center gap-2">
            <Check class="w-5 h-5" />
            生成工单并报价
          </span>
        {/if}
      </button>
    </div>

    <div class="lg:col-span-2 space-y-6">
      <div class="card p-5 animate-stagger" style="animation-delay: 240ms">
        <div class="flex items-center justify-between mb-4">
          <h2 class="font-display text-lg font-semibold text-industrial-text flex items-center gap-2">
            <Wrench class="w-5 h-5 text-primary-400" />
            维修项目
          </h2>
          <select
            bind:value={selectedCategory}
            class="input w-48 h-9 py-1 text-sm"
          >
            <option value="">全部分类</option>
            {#each categories as cat}
              <option value={cat}>{cat}</option>
            {/each}
          </select>
        </div>

        {#if loading}
          <div class="flex items-center justify-center py-12">
            <Loader2 class="w-8 h-8 text-primary-500 animate-spin" />
          </div>
        {:else}
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[calc(100vh-350px)] overflow-y-auto scrollbar-thin pr-2">
            {#each filteredItems as item (item.id)}
              <div
                role="button"
                tabindex="0"
                on:click={() => toggleItem(item.id)}
                on:keydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleItem(item.id); } }}
                class="w-full text-left p-4 rounded-lg border-2 transition-all duration-200 cursor-pointer hover:border-primary-500/50 focus:outline-none focus:ring-2 focus:ring-primary-500/50 {
                  selectedItems[item.id]
                    ? 'bg-primary-500/10 border-primary-500'
                    : 'bg-industrial-bg border-industrial-border hover:bg-industrial-border/30'
                }"
              >
                <div class="flex items-start justify-between">
                  <div class="flex-1">
                    <div class="flex items-center gap-2">
                      <span class="font-mono text-xs px-2 py-0.5 rounded bg-industrial-card text-industrial-text-secondary">
                        {item.code}
                      </span>
                      <h4 class="font-medium text-industrial-text">{item.name}</h4>
                    </div>
                    {#if item.description}
                      <p class="text-xs text-industrial-text-muted mt-1 line-clamp-2">{item.description}</p>
                    {/if}
                    <div class="mt-2 text-xs text-industrial-text-muted">
                      工时: {item.laborHours}h · 配件: {item.parts?.length || 0} 项
                    </div>
                    <div class="mt-2 flex items-center justify-between">
                      <span class="font-mono text-accent-green font-semibold">
                        ¥{calculateItemTotal(item).toFixed(2)}
                      </span>
                      {#if selectedItems[item.id]}
                        <div class="flex items-center gap-2">
                          <button
                            type="button"
                            on:click={(e) => { e.stopPropagation(); updateQuantity(item.id, selectedItems[item.id] - 1); }}
                            class="w-6 h-6 rounded bg-industrial-card hover:bg-industrial-border flex items-center justify-center text-industrial-text-secondary"
                          >
                            -
                          </button>
                          <span class="w-6 text-center font-mono text-industrial-text">
                            {selectedItems[item.id]}
                          </span>
                          <button
                            type="button"
                            on:click={(e) => { e.stopPropagation(); updateQuantity(item.id, selectedItems[item.id] + 1); }}
                            class="w-6 h-6 rounded bg-industrial-card hover:bg-industrial-border flex items-center justify-center text-industrial-text-secondary"
                          >
                            +
                          </button>
                        </div>
                      {/if}
                    </div>
                  </div>
                  <ChevronRight class="w-4 h-4 text-industrial-text-muted flex-shrink-0 ml-2 mt-1" />
                </div>
                {#if item.parts?.length > 0 && selectedItems[item.id]}
                  <div class="mt-3 pt-3 border-t border-industrial-border text-xs">
                    <p class="text-industrial-text-muted mb-2">包含配件：</p>
                    <div class="space-y-1">
                      {#each item.parts as part (part.id)}
                        <div class="flex justify-between">
                          <span class="text-industrial-text-secondary">{part.partName}</span>
                          <span class="font-mono text-industrial-text-muted">
                            {part.quantity} × ¥{part.unitPrice}
                          </span>
                        </div>
                      {/each}
                    </div>
                  </div>
                {/if}
              </div>
            {/each}
          </div>
        {/if}
      </div>
    </div>
  </div>
</div>

{#if showNewVehicle}
  <div class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
    <div class="card w-full max-w-md animate-slide-up">
      <div class="px-6 py-4 border-b border-industrial-border flex items-center justify-between">
        <h2 class="font-display text-lg font-semibold text-industrial-text">新增车辆档案</h2>
        <button on:click={() => showNewVehicle = false} class="p-2 rounded-lg hover:bg-industrial-border">
          <X class="w-5 h-5 text-industrial-text-muted" />
        </button>
      </div>
      <div class="p-6 space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label for="new-plate" class="label">车牌号 *</label>
            <input id="new-plate" type="text" bind:value={newVehicleForm.plateNumber} class="input font-mono" placeholder="如：京A12345" />
          </div>
          <div>
            <label for="new-vin" class="label">车架号 *</label>
            <input id="new-vin" type="text" bind:value={newVehicleForm.vin} class="input font-mono" placeholder="VIN码" />
          </div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label for="new-brand" class="label">品牌</label>
            <input id="new-brand" type="text" bind:value={newVehicleForm.brand} class="input" placeholder="如：大众" />
          </div>
          <div>
            <label for="new-model" class="label">型号</label>
            <input id="new-model" type="text" bind:value={newVehicleForm.model} class="input" placeholder="如：帕萨特" />
          </div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label for="new-year" class="label">年份</label>
            <input id="new-year" type="number" bind:value={newVehicleForm.year} class="input" placeholder="如：2023" />
          </div>
          <div>
            <label for="new-mileage" class="label">当前里程 (km)</label>
            <input id="new-mileage" type="number" bind:value={newVehicleForm.currentMileage} class="input font-mono" />
          </div>
        </div>
      </div>
      <div class="px-6 py-4 border-t border-industrial-border flex items-center justify-end gap-3 bg-industrial-bg/50">
        <button on:click={() => showNewVehicle = false} class="btn btn-secondary">取消</button>
        <button on:click={createVehicle} class="btn btn-primary">保存</button>
      </div>
    </div>
  </div>
{/if}
