<script lang="ts">
  let username = $state('');
  let password = $state('');
  let error = $state('');
  let loading = $state(false);

  async function handleSubmit(e: Event) {
    e.preventDefault();
    loading = true;
    error = '';

    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);

    const res = await fetch('/login', {
      method: 'POST',
      body: formData
    });

    if (res.redirected) {
      window.location.href = res.url;
      return;
    }

    if (!res.ok) {
      try {
        const data = await res.json();
        error = data.error || '登录失败';
      } catch {
        error = '登录失败，请重试';
      }
    }

    loading = false;
  }
</script>

<svelte:head>
  <title>登录 - 景区投诉协同台</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
  <div class="w-full max-w-md">
    <div class="bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
      <div class="text-center mb-8">
        <div class="inline-flex items-center justify-center w-16 h-16 bg-primary-600 rounded-2xl mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h1 class="text-2xl font-bold text-slate-800">景区投诉协同台</h1>
        <p class="text-slate-500 mt-1">游客投诉协同处理平台</p>
      </div>

      <form onsubmit={handleSubmit} class="space-y-5">
        {#if error}
          <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm animate-fade-in">
            {error}
          </div>
        {/if}

        <div>
          <label for="username" class="block text-sm font-medium text-slate-700 mb-1.5">用户名</label>
          <input
            id="username"
            type="text"
            bind:value={username}
            class="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition"
            placeholder="请输入用户名"
            required
          />
        </div>

        <div>
          <label for="password" class="block text-sm font-medium text-slate-700 mb-1.5">密码</label>
          <input
            id="password"
            type="password"
            bind:value={password}
            class="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition"
            placeholder="请输入密码"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          class="w-full bg-primary-600 text-white py-2.5 rounded-lg hover:bg-primary-700 focus:ring-4 focus:ring-primary-200 font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? '登录中...' : '登 录'}
        </button>
      </form>

      <div class="mt-6 pt-5 border-t border-slate-100">
        <p class="text-xs text-slate-400 text-center mb-3">演示账号</p>
        <div class="grid grid-cols-2 gap-2 text-xs">
          <div class="bg-slate-50 rounded-lg px-3 py-2">
            <span class="text-slate-500">游客</span>
            <span class="font-mono text-slate-700 ml-1">visitor1</span>
          </div>
          <div class="bg-slate-50 rounded-lg px-3 py-2">
            <span class="text-slate-500">票务</span>
            <span class="font-mono text-slate-700 ml-1">agent1</span>
          </div>
          <div class="bg-slate-50 rounded-lg px-3 py-2">
            <span class="text-slate-500">巡场</span>
            <span class="font-mono text-slate-700 ml-1">patrol1</span>
          </div>
          <div class="bg-slate-50 rounded-lg px-3 py-2">
            <span class="text-slate-500">运营</span>
            <span class="font-mono text-slate-700 ml-1">operator1</span>
          </div>
        </div>
        <p class="text-xs text-slate-400 text-center mt-2">密码均为 password123</p>
      </div>
    </div>
  </div>
</div>
