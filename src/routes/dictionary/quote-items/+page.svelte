<script lang="ts">
  import { onMount } from 'svelte';
  import { trpc } from '$lib/trpc/client';
  import {
    Plus,
    Search,
    Edit2,
    Trash2,
    ChevronRight,
    Loader2,
    X,
    Check,
    Package
  } from 'lucide-svelte';

  let loading = true;
  let items: any[] = [];
  let categories: string[] = [];
  let selectedCategory = '';
  let searchKeyword = '';
  let showModal = false;
  let editingItem: any = null;
  let formData: any = {};
  let parts: any[] = [];
  let deletingId: string | null = null;

  async function loadData() {
    loading = true;
    try {
      [items, categories] = await Promise.all([
        trpc.quote.list.query({ category: selectedCategory || undefined, keyword: searchKeyword || undefined }),
        trpc.quote.getCategories.query()
      ]);
    } finally {
      loading = false;
    }
  }

  function openCreateModal() {
    editingItem = null;
    formData = {
      category: '',
      name: '',
      code: '',
      laborHours: 0,
      laborPrice: 0,
      description: '',
      isActive: true
    };
    parts = [];
    showModal = true;
  }

  async function openEditModal(item: any) {
    editingItem = item;
    const detail = await trpc.quote.get.query(item.id);
    formData = {
      category: detail.category,
      name: detail.name,
      code: detail.code,
      laborHours: parseFloat(String(detail.laborHours ?? '0')),
      laborPrice: parseFloat(String(detail.laborPrice ?? '0')),
      description: detail.description || '',
      isActive: detail.isActive
    };
    parts = detail.parts.map(p => ({
      partNumber: p.partNumber,
      partName: p.partName,
      quantity: p.quantity,
      unitPrice: parseFloat(String(p.unitPrice ?? '0'))
    }));
    showModal = true;
  }

  function closeModal() {
    showModal = false;
    editingItem = null;
    formData = {};
    parts = [];
  }

  function addPart() {
    parts.push({
      partNumber: '',
      partName: '',
      quantity: 1,
      unitPrice: 0
    });
  }

  function removePart(index: number) {
    parts.splice(index, 1);
  }

  async function saveItem() {
    try {
      if (editingItem) {
        await trpc.quote.update.mutate({
          id: editingItem.id,
          ...formData,
          parts
        });
      } else {
        await trpc.quote.create.mutate({
          ...formData,
          parts
        });
      }
      closeModal();
      await loadData();
    } catch (e: any) {
      alert(e.message || '保存失败');
    }
  }

  async function deleteItem(id: string) {
    if (!confirm('确定要删除这个报价项目吗？')) return;
    deletingId = id;
    try {
      await trpc.quote.delete.mutate(id);
      await loadData();
    } catch (e: any) {
      alert(e.message || '删除失败');
    } finally {
      deletingId = null;
    }
  }

  function calculateTotal(item: any) {
    const laborTotal = parseFloat(String(item.laborPrice ?? '0')) * parseFloat(String(item.laborHours ?? '0'));
    const partsTotal = (item.parts || []).reduce((sum: number, p: any) => sum + parseFloat(String(p.unitPrice ?? '0')) * p.quantity, 0);
    return laborTotal + partsTotal;
  }

  $: filteredItems = items.filter(item => {
    if (!searchKeyword) return true;
    const kw = searchKeyword.toLowerCase();
    return item.name.toLowerCase().includes(kw) ||
           item.code.toLowerCase().includes(kw) ||
           item.category.toLowerCase().includes(kw);
  });

  $: groupedItems = filteredItems.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, any[]>);

  onMount(() => {
    loadData();
  });
</script>

<div class="space-y-6">
  <div class="flex flex-wrap items-center justify-between gap-4">
    <div class="flex items-center gap-4">
      <div class="relative">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-industrial-text-muted" />
        <input
          type="text"
          bind:value={searchKeyword}
          on:input={loadData}
          class="input pl-10 w-72"
          placeholder="搜索项目名称、编码..."
        />
      </div>
      <select
        bind:value={selectedCategory}
        on:change={loadData}
        class="input w-48"
      >
        <option value="">全部分类</option>
        {#each categories as cat}
          <option value={cat}>{cat}</option>
        {/each}
      </select>
    </div>
    <button on:click={openCreateModal} class="btn btn-primary flex items-center gap-2">
      <Plus class="w-4 h-4" />
      新增报价项目
    </button>
  </div>

  {#if loading}
    <div class="flex items-center justify-center py-20">
      <Loader2 class="w-10 h-10 text-primary-500 animate-spin" />
    </div>
  {:else if Object.keys(groupedItems).length === 0}
    <div class="card p-12 text-center">
      <Package class="w-16 h-16 text-industrial-text-muted mx-auto mb-4 opacity-50" />
      <p class="text-industrial-text-muted">暂无报价项目</p>
      <button on:click={openCreateModal} class="btn btn-primary mt-4">
        添加第一个项目
      </button>
    </div>
  {:else}
    <div class="space-y-6">
      {#each Object.entries(groupedItems) as [category, categoryItems] (category)}
        {@const items = categoryItems as any[]}
        <div class="card overflow-hidden animate-fade-in">
          <div class="px-6 py-4 bg-industrial-bg/50 border-b border-industrial-border flex items-center justify-between">
            <h3 class="font-display font-semibold text-industrial-text flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-primary-500"></span>
              {category}
              <span class="text-sm font-normal text-industrial-text-muted">({items.length} 项)</span>
            </h3>
          </div>
          <div class="divide-y divide-industrial-border">
            {#each items as item (item.id)}
              <div
                class="px-6 py-4 hover:bg-industrial-bg/30 transition-colors"
                class:opacity-50={!item.isActive}
              >
                <div class="flex items-center justify-between">
                  <div class="flex-1">
                    <div class="flex items-center gap-3">
                      <span class="font-mono text-xs px-2 py-1 rounded bg-primary-500/20 text-primary-400 border border-primary-500/30">
                        {item.code}
                      </span>
                      <h4 class="font-medium text-industrial-text">{item.name}</h4>
                      {#if !item.isActive}
                        <span class="badge bg-gray-800 text-gray-400">已停用</span>
                      {/if}
                    </div>
                    {#if item.description}
                      <p class="text-sm text-industrial-text-muted mt-1">{item.description}</p>
                    {/if}
                    <div class="flex items-center gap-6 mt-2 text-sm">
                      <span class="text-industrial-text-muted">
                        工时: <span class="text-industrial-text font-mono">{item.laborHours}h × ¥{item.laborPrice}</span>
                      </span>
                      {#if item.parts?.length > 0}
                        <span class="text-industrial-text-muted">
                          配件: <span class="text-industrial-text">{item.parts.length} 项</span>
                        </span>
                      {/if}
                      <span class="text-accent-green font-mono font-medium">
                        ¥{calculateTotal(item).toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <div class="flex items-center gap-2">
                    <button
                      on:click={() => openEditModal(item)}
                      class="p-2 rounded-lg hover:bg-primary-500/20 text-industrial-text-muted hover:text-primary-400 transition-all"
                      title="编辑"
                    >
                      <Edit2 class="w-4 h-4" />
                    </button>
                    <button
                      on:click={() => deleteItem(item.id)}
                      disabled={deletingId === item.id}
                      class="p-2 rounded-lg hover:bg-accent-red/20 text-industrial-text-muted hover:text-accent-red transition-all disabled:opacity-50"
                      title="删除"
                    >
                      {#if deletingId === item.id}
                        <Loader2 class="w-4 h-4 animate-spin" />
                      {:else}
                        <Trash2 class="w-4 h-4" />
                      {/if}
                    </button>
                    <ChevronRight class="w-4 h-4 text-industrial-text-muted" />
                  </div>
                </div>
                {#if item.parts?.length > 0}
                  <div class="mt-3 pl-4 border-l-2 border-industrial-border">
                    <div class="text-xs text-industrial-text-muted mb-2">配件明细</div>
                    <div class="grid grid-cols-2 gap-2">
                      {#each item.parts as part (part.id)}
                        <div class="flex items-center justify-between text-sm bg-industrial-bg/50 rounded px-3 py-2">
                          <div>
                            <span class="text-industrial-text">{part.partName}</span>
                            <span class="text-industrial-text-muted ml-2 text-xs">{part.partNumber}</span>
                          </div>
                          <span class="font-mono text-industrial-text-secondary">
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
        </div>
      {/each}
    </div>
  {/if}
</div>

{#if showModal}
  <div class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
    <div class="card w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-slide-up">
      <div class="px-6 py-4 border-b border-industrial-border flex items-center justify-between">
        <h2 class="font-display text-lg font-semibold text-industrial-text">
          {editingItem ? '编辑报价项目' : '新增报价项目'}
        </h2>
        <button on:click={closeModal} class="p-2 rounded-lg hover:bg-industrial-border transition-colors">
          <X class="w-5 h-5 text-industrial-text-muted" />
        </button>
      </div>
      <div class="p-6 overflow-y-auto scrollbar-thin flex-1">
        <div class="space-y-5">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label for="form-category" class="label">分类 *</label>
              <input
                id="form-category"
                type="text"
                bind:value={formData.category}
                class="input"
                placeholder="如：常规保养"
                list="categories"
              />
              <datalist id="categories">
                {#each categories as cat}
                  <option value={cat}>{cat}</option>
                {/each}
              </datalist>
            </div>
            <div>
              <label for="form-code" class="label">项目编码 *</label>
              <input
                id="form-code"
                type="text"
                bind:value={formData.code}
                class="input font-mono"
                placeholder="如：MAINT-001"
              />
            </div>
          </div>
          <div>
            <label for="form-name" class="label">项目名称 *</label>
            <input
              id="form-name"
              type="text"
              bind:value={formData.name}
              class="input"
              placeholder="如：机油更换"
            />
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label for="form-labor-hours" class="label">工时 (小时)</label>
              <input
                id="form-labor-hours"
                type="number"
                bind:value={formData.laborHours}
                step="0.1"
                min="0"
                class="input font-mono"
              />
            </div>
            <div>
              <label for="form-labor-price" class="label">工时单价 (¥)</label>
              <input
                id="form-labor-price"
                type="number"
                bind:value={formData.laborPrice}
                step="0.01"
                min="0"
                class="input font-mono"
              />
            </div>
          </div>
          <div>
            <label for="form-description" class="label">描述</label>
            <textarea
              id="form-description"
              bind:value={formData.description}
              rows="2"
              class="input resize-none"
              placeholder="项目描述说明..."
            ></textarea>
          </div>
          <div class="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              bind:checked={formData.isActive}
              class="w-4 h-4 rounded border-industrial-border bg-industrial-bg text-primary-500 focus:ring-primary-500"
            />
            <label for="isActive" class="text-sm text-industrial-text">启用该项目</label>
          </div>

          <div class="border-t border-industrial-border pt-5">
            <div class="flex items-center justify-between mb-4">
              <h3 class="font-medium text-industrial-text">配件列表</h3>
              <button on:click={addPart} class="btn btn-secondary text-sm py-1.5">
                <Plus class="w-4 h-4 mr-1" /> 添加配件
              </button>
            </div>
            {#if parts.length === 0}
              <div class="text-center py-6 text-industrial-text-muted text-sm border border-dashed border-industrial-border rounded-lg">
                暂无配件，点击上方按钮添加
              </div>
            {:else}
              <div class="space-y-3">
                {#each parts as part, index}
                  <div class="flex items-end gap-3 p-3 bg-industrial-bg rounded-lg border border-industrial-border">
                    <div class="flex-1">
                      <label for="part-number-{index}" class="label text-xs">配件编号</label>
                      <input
                        id="part-number-{index}"
                        type="text"
                        bind:value={part.partNumber}
                        class="input text-sm py-1.5 font-mono"
                        placeholder="配件编号"
                      />
                    </div>
                    <div class="flex-1">
                      <label for="part-name-{index}" class="label text-xs">配件名称</label>
                      <input
                        id="part-name-{index}"
                        type="text"
                        bind:value={part.partName}
                        class="input text-sm py-1.5"
                        placeholder="配件名称"
                      />
                    </div>
                    <div class="w-24">
                      <label for="part-quantity-{index}" class="label text-xs">数量</label>
                      <input
                        id="part-quantity-{index}"
                        type="number"
                        bind:value={part.quantity}
                        min="1"
                        class="input text-sm py-1.5 font-mono"
                      />
                    </div>
                    <div class="w-28">
                      <label for="part-price-{index}" class="label text-xs">单价 (¥)</label>
                      <input
                        id="part-price-{index}"
                        type="number"
                        bind:value={part.unitPrice}
                        step="0.01"
                        min="0"
                        class="input text-sm py-1.5 font-mono"
                      />
                    </div>
                    <button
                      on:click={() => removePart(index)}
                      class="p-2 rounded-lg hover:bg-accent-red/20 text-industrial-text-muted hover:text-accent-red transition-colors mb-0.5"
                    >
                      <X class="w-4 h-4" />
                    </button>
                  </div>
                {/each}
              </div>
            {/if}
          </div>
        </div>
      </div>
      <div class="px-6 py-4 border-t border-industrial-border flex items-center justify-end gap-3 bg-industrial-bg/50">
        <button on:click={closeModal} class="btn btn-secondary">取消</button>
        <button on:click={saveItem} class="btn btn-primary flex items-center gap-2">
          <Check class="w-4 h-4" />
          保存
        </button>
      </div>
    </div>
  </div>
{/if}
