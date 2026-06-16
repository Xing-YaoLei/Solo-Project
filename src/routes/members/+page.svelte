<script lang="ts">
  import { goto } from '$app/navigation';
  import { trpc } from '$lib/trpc/client';

  let members: any[] = [];
  let total = 0;
  let page = 1;
  let pageSize = 20;
  let loading = false;
  let searchText = '';

  async function loadMembers() {
    loading = true;
    try {
      const result = await trpc.member.list.query({
        search: searchText || undefined,
        page,
        pageSize
      });
      members = result.records;
      total = result.total;
    } catch (e) {
      console.error('加载会员列表失败', e);
    } finally {
      loading = false;
    }
  }

  function formatDate(date: Date | string | null) {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  }

  function handleSearch() {
    page = 1;
    loadMembers();
  }

  function prevPage() {
    if (page > 1) {
      page--;
      loadMembers();
    }
  }

  function nextPage() {
    if (page < Math.ceil(total / pageSize)) {
      page++;
      loadMembers();
    }
  }

  loadMembers();
</script>

<div class="page-header">
  <div>
    <h1 class="page-title">会员档案</h1>
    <p style="color: var(--text-secondary); font-size: 0.875rem; margin-top: 0.25rem;">
      管理会员基本信息和健康档案
    </p>
  </div>
  <div class="page-actions">
    <button class="btn-primary">+ 新增会员</button>
  </div>
</div>

<div class="card" style="margin-bottom: 1rem;">
  <div class="card-body">
    <div style="display: flex; gap: 0.75rem; max-width: 400px;">
      <input 
        type="text" 
        class="form-input" 
        placeholder="搜索会员姓名..."
        bind:value={searchText}
        on:keydown={(e) => e.key === 'Enter' && handleSearch()}
        style="flex: 1;"
      />
      <button class="btn-secondary" on:click={handleSearch}>
        搜索
      </button>
    </div>
  </div>
</div>

<div class="card">
  <div style="overflow-x: auto;">
    <table class="table">
      <thead>
        <tr>
          <th>会员编号</th>
          <th>姓名</th>
          <th>手机号</th>
          <th>性别</th>
          <th>医保卡号</th>
          <th>注册时间</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        {#if loading}
          <tr>
            <td colspan="7" style="text-align: center; padding: 2rem; color: var(--text-muted);">
              加载中...
            </td>
          </tr>
        {:else if members.length === 0}
          <tr>
            <td colspan="7" style="text-align: center; padding: 2rem; color: var(--text-muted);">
              暂无会员数据
            </td>
          </tr>
        {:else}
          {#each members as member}
            <tr>
              <td style="font-family: monospace;">{member.memberNo}</td>
              <td style="font-weight: 500;">{member.name}</td>
              <td>{member.phone}</td>
              <td>{member.gender || '-'}</td>
              <td>{member.insuranceCardNo || '-'}</td>
              <td>{formatDate(member.createdAt)}</td>
              <td>
                <button class="btn-secondary btn-sm">
                  查看
                </button>
              </td>
            </tr>
          {/each}
        {/if}
      </tbody>
    </table>
  </div>
  
  <div class="pagination" style="margin: 0 1rem;">
    <div class="pagination-info">
      共 {total} 条记录，第 {page} / {Math.ceil(total / pageSize) || 1} 页
    </div>
    <div class="pagination-controls">
      <button class="btn-secondary btn-sm" on:click={prevPage} disabled={page <= 1 || loading}>
        上一页
      </button>
      <button class="btn-secondary btn-sm" on:click={nextPage} disabled={page >= Math.ceil(total / pageSize) || loading}>
        下一页
      </button>
    </div>
  </div>
</div>
