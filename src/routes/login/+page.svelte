<div class="login-container">
  <div class="login-card">
    <div class="login-header">
      <div class="login-logo">🏥</div>
      <h1 class="login-title">药店连锁用药回访协同台</h1>
      <p class="login-subtitle">专业用药回访 · 守护患者健康</p>
    </div>
    
    <form class="login-form" on:submit|preventDefault={handleLogin}>
      <div class="form-group">
        <label class="form-label">用户名</label>
        <input 
          type="text" 
          class="form-input" 
          bind:value={username}
          placeholder="请输入用户名"
          required
        />
      </div>
      
      <div class="form-group">
        <label class="form-label">密码</label>
        <input 
          type="password" 
          class="form-input" 
          bind:value={password}
          placeholder="请输入密码"
          required
        />
      </div>
      
      {#if error}
        <div class="login-error">{error}</div>
      {/if}
      
      <button 
        type="submit" 
        class="btn-primary btn-lg"
        style="width: 100%; margin-top: 0.5rem;"
        disabled={loading}
      >
        {loading ? '登录中...' : '登 录'}
      </button>
    </form>
    
    <div class="login-footer">
      <p style="font-size: 0.75rem; color: var(--text-muted);">
        测试账号: admin / admin123 (管理员)
      </p>
    </div>
  </div>
</div>

<style>
  .login-container {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 50%, #6ee7b7 100%);
    padding: 1rem;
  }
  
  .login-card {
    background: white;
    border-radius: 16px;
    padding: 2.5rem;
    width: 100%;
    max-width: 420px;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15);
  }
  
  .login-header {
    text-align: center;
    margin-bottom: 2rem;
  }
  
  .login-logo {
    font-size: 3rem;
    margin-bottom: 0.75rem;
  }
  
  .login-title {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--text-primary);
    margin-bottom: 0.25rem;
  }
  
  .login-subtitle {
    font-size: 0.875rem;
    color: var(--text-secondary);
  }
  
  .login-form {
    margin-bottom: 1.5rem;
  }
  
  .login-error {
    background-color: #fef2f2;
    color: #dc2626;
    padding: 0.75rem;
    border-radius: var(--border-radius);
    font-size: 0.875rem;
    margin-bottom: 1rem;
  }
  
  .login-footer {
    text-align: center;
    padding-top: 1rem;
    border-top: 1px solid var(--border-color);
  }
</style>

<script lang="ts">
  import { goto } from '$app/navigation';
  import { trpc } from '$lib/trpc/client';

  let username = '';
  let password = '';
  let error = '';
  let loading = false;

  async function handleLogin() {
    loading = true;
    error = '';
    
    try {
      const result = await trpc.auth.login.mutate({
        username,
        password
      });
      
      if (result.success) {
        goto('/');
      } else {
        error = result.error || '登录失败';
      }
    } catch (e) {
      error = '登录失败，请重试';
    } finally {
      loading = false;
    }
  }
</script>
