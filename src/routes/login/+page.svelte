<script lang="ts">
  import { goto } from '$app/navigation';
  import { trpc } from '$lib/trpc/client';
  import { userStore } from '$lib/stores/user';
  import { Wrench, Loader2, AlertCircle } from 'lucide-svelte';

  let username = '';
  let password = '';
  let loading = false;
  let error = '';

  async function handleLogin() {
    if (!username || !password) {
      error = '请输入用户名和密码';
      return;
    }

    loading = true;
    error = '';

    try {
      const result = await trpc.auth.login.mutate({ username, password });
      $userStore = result.user;
      await goto('/');
    } catch (e: any) {
      error = e.message || '登录失败，请重试';
    } finally {
      loading = false;
    }
  }

  async function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      await handleLogin();
    }
  }
</script>

<div class="min-h-screen flex items-center justify-center bg-industrial-bg p-4">
  <div class="absolute inset-0 overflow-hidden pointer-events-none">
    <div class="absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-to-br from-primary-500/10 to-transparent rounded-full blur-3xl"></div>
    <div class="absolute -bottom-1/2 -left-1/2 w-full h-full bg-gradient-to-tr from-accent-orange/10 to-transparent rounded-full blur-3xl"></div>
    <div class="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/5 rounded-full blur-3xl animate-pulse-slow"></div>
  </div>

  <div class="relative w-full max-w-md animate-fade-in">
    <div class="card p-8 backdrop-blur-sm bg-industrial-card/90">
      <div class="flex flex-col items-center mb-8">
        <div class="w-16 h-16 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center mb-4 shadow-xl shadow-primary-500/30">
          <Wrench class="w-8 h-8 text-white" />
        </div>
        <h1 class="font-display text-2xl font-bold text-industrial-text">汽车维修报价协同台</h1>
        <p class="text-industrial-text-muted mt-1">Auto Repair Collaboration Platform</p>
      </div>

      <form class="space-y-5" on:submit|preventDefault={handleLogin}>
        <div>
          <label for="username" class="label">用户名</label>
          <input
            id="username"
            type="text"
            bind:value={username}
            on:keydown={handleKeydown}
            class="input"
            placeholder="请输入用户名"
            autocomplete="username"
          />
        </div>

        <div>
          <label for="password" class="label">密码</label>
          <input
            id="password"
            type="password"
            bind:value={password}
            on:keydown={handleKeydown}
            class="input"
            placeholder="请输入密码"
            autocomplete="current-password"
          />
        </div>

        {#if error}
          <div class="flex items-center gap-2 p-3 rounded-lg bg-accent-red/10 border border-accent-red/30 text-accent-red text-sm animate-fade-in">
            <AlertCircle class="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        {/if}

        <button
          type="submit"
          disabled={loading}
          class="btn btn-primary w-full h-11 font-medium text-base"
        >
          {#if loading}
            <span class="flex items-center justify-center gap-2">
              <Loader2 class="w-5 h-5 animate-spin" />
              登录中...
            </span>
          {:else}
            登 录
          {/if}
        </button>
      </form>

      <div class="mt-6 pt-6 border-t border-industrial-border">
        <p class="text-center text-sm text-industrial-text-muted">
          演示账号：
        </p>
        <div class="mt-3 grid grid-cols-2 gap-2 text-xs">
          <div class="p-2 rounded bg-industrial-bg border border-industrial-border">
            <p class="font-medium text-industrial-text">admin / admin123</p>
            <p class="text-industrial-text-muted">系统管理员</p>
          </div>
          <div class="p-2 rounded bg-industrial-bg border border-industrial-border">
            <p class="font-medium text-industrial-text">tech01 / tech123</p>
            <p class="text-industrial-text-muted">一线人员</p>
          </div>
        </div>
      </div>
    </div>

    <p class="text-center text-xs text-industrial-text-muted mt-4">
      © 2024 汽车维修报价协同台 · 专业维修管理系统
    </p>
  </div>
</div>
