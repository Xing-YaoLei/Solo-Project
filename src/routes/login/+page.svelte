<script lang="ts">
  import { trpc } from '$lib/trpc/client';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';

  let email = '';
  let password = '';
  let loading = false;
  let error = '';

  async function handleLogin(e: Event) {
    e.preventDefault();
    loading = true;
    error = '';

    try {
      await trpc.auth.login.mutate({ email, password });
      goto('/');
    } catch (err: any) {
      error = err.message || '登录失败';
    } finally {
      loading = false;
    }
  }
</script>

<div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-dental-50 to-blue-50 py-12 px-4">
  <div class="max-w-md w-full">
    <div class="text-center mb-8">
      <div class="text-5xl mb-4">🦷</div>
      <h1 class="text-2xl font-bold text-gray-900">口腔诊所影像归档协同台</h1>
      <p class="mt-2 text-gray-600">高效协作 · 规范归档 · 智能随访</p>
    </div>

    <div class="card">
      <div class="card-body">
        <form on:submit={handleLogin} class="space-y-4">
          {#if error}
            <div class="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          {/if}

          <div>
            <label class="label">邮箱</label>
            <input
              type="email"
              bind:value={email}
              class="input-field"
              placeholder="请输入邮箱"
              required
            />
          </div>

          <div>
            <label class="label">密码</label>
            <input
              type="password"
              bind:value={password}
              class="input-field"
              placeholder="请输入密码"
              required
            />
          </div>

          <button
            type="submit"
            class="w-full btn-primary py-2.5"
            disabled={loading}
          >
            {loading ? '登录中...' : '登录'}
          </button>
        </form>
      </div>
    </div>

    <p class="mt-6 text-center text-sm text-gray-500">
      登录即表示您同意使用条款和隐私政策
    </p>
  </div>
</div>
