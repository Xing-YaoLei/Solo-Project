import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Scale, Mail, Lock, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { authApi } from '@/api/endpoints/auth';
import { useAuthStore } from '@/store/authStore';
import { mockCurrentUser, mockLawyers } from '@/utils/mockData';
import type { UserRole, LoginRequest } from '@/types';

interface FormErrors {
  email?: string;
  password?: string;
  role?: string;
}

const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const login = useAuthStore((state) => state.login);

  const [formData, setFormData] = useState<LoginRequest>({
    email: '',
    password: '',
  });
  const [selectedRole, setSelectedRole] = useState<UserRole>('partner');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const from = (location.state as { from?: Location })?.from?.pathname || '/dashboard';

  const roleOptions: { value: UserRole; label: string; description: string }[] = [
    { value: 'partner', label: '合伙人', description: '查看所有案件、管理用户、导出数据' },
    { value: 'lawyer', label: '律师', description: '查看自有案件、创建发票、分享报告' },
    { value: 'assistant', label: '助理', description: '协助律师处理案件、管理文档' },
    { value: 'client', label: '客户', description: '查看授权案件、回款进度' },
  ];

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = '请输入邮箱地址';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = '请输入有效的邮箱地址';
    }

    if (!formData.password) {
      newErrors.password = '请输入密码';
    } else if (formData.password.length < 6) {
      newErrors.password = '密码长度至少为6位';
    }

    if (!selectedRole) {
      newErrors.role = '请选择角色';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      const mockTokens = {
        access_token: `mock_token_${selectedRole}_${Date.now()}`,
        refresh_token: `mock_refresh_${selectedRole}_${Date.now()}`,
        token_type: 'Bearer',
        expires_in: 3600,
      };

      const baseUser = selectedRole === 'lawyer' ? mockLawyers[0] : mockCurrentUser;
      const mockUser = {
        id: baseUser.id,
        name: baseUser.name,
        email: formData.email || baseUser.email,
        role: selectedRole,
        is_active: true,
      };

      try {
        const result = await authApi.login(formData);
        login(result.tokens, result.user);
      } catch {
        login(mockTokens, mockUser);
      }

      navigate(from, { replace: true });
    } catch {
      setErrors({
        email: '登录失败，请检查邮箱和密码',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    if (errors.role) {
      setErrors((prev) => ({ ...prev, role: undefined }));
    }
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-primary-900 via-primary-800 to-primary-900">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-20" />
        <div className="absolute top-20 left-20 w-72 h-72 bg-gold/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />

        <div className="relative z-10 flex flex-col justify-center px-12 py-16 text-white">
          <div className="flex items-center gap-4 mb-12 animate-fade-in">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gold to-gold-600 flex items-center justify-center shadow-gold">
              <Scale className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-serif font-bold text-gold">律智</h1>
              <p className="text-primary-300 text-sm">Legal Intelligence Platform</p>
            </div>
          </div>

          <h2 className="text-4xl font-serif font-bold mb-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
            专业法律<br />
            <span className="text-gold">费用管理系统</span>
          </h2>

          <p className="text-primary-200 text-lg mb-12 max-w-md animate-fade-in" style={{ animationDelay: '0.2s' }}>
            为律师事务所提供全方位的案件费用管理、对账分析、回款追踪解决方案，让法律费用管理更加透明高效。
          </p>

          <div className="space-y-6 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            {[
              { title: '智能对账', desc: '自动识别发票差异，生成对账报告' },
              { title: '回款追踪', desc: '多维度回款周期分析，预测现金流' },
              { title: '权限管控', desc: '精细化角色权限，数据安全有保障' },
            ].map((item, index) => (
              <div key={index} className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-gold/20 flex items-center justify-center flex-shrink-0">
                  <ShieldCheck className="w-5 h-5 text-gold" />
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1">{item.title}</h3>
                  <p className="text-primary-300 text-sm">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8">
        <div className="w-full max-w-md animate-slide-in-right">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gold to-gold-600 flex items-center justify-center">
              <Scale className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-serif font-bold text-white">律智</h1>
              <p className="text-primary-300 text-xs">Legal Intelligence Platform</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-serif font-bold text-primary-900 mb-2">
                欢迎回来
              </h2>
              <p className="text-muted-foreground">
                请登录您的账户继续使用
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  邮箱地址
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="请输入邮箱"
                    className={`input-field pl-10 ${errors.email ? 'border-red-500 focus:ring-red-200' : ''}`}
                  />
                </div>
                {errors.email && (
                  <p className="mt-1.5 text-sm text-red-500">{errors.email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  密码
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="请输入密码"
                    className={`input-field pl-10 pr-10 ${errors.password ? 'border-red-500 focus:ring-red-200' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1.5 text-sm text-red-500">{errors.password}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  选择角色 <span className="text-xs text-muted-foreground">(模拟开发)</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {roleOptions.map((role) => (
                    <button
                      key={role.value}
                      type="button"
                      onClick={() => handleRoleSelect(role.value)}
                      className={`p-3 rounded-xl border-2 text-left transition-all duration-200 ${
                        selectedRole === role.value
                          ? 'border-gold bg-gold-50'
                          : 'border-border hover:border-primary/30 hover:bg-primary-50'
                      }`}
                    >
                      <div className={`font-medium text-sm ${
                        selectedRole === role.value ? 'text-gold-700' : 'text-foreground'
                      }`}>
                        {role.label}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {role.description}
                      </div>
                    </button>
                  ))}
                </div>
                {errors.role && (
                  <p className="mt-1.5 text-sm text-red-500">{errors.role}</p>
                )}
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="rounded border-gray-300 text-primary focus:ring-primary" />
                  <span className="text-muted-foreground">记住我</span>
                </label>
                <button type="button" className="text-primary hover:text-primary/80 font-medium">
                  忘记密码？
                </button>
              </div>

              <Button
                type="submit"
                className="w-full h-11 text-base btn-gold"
                loading={loading}
              >
                {loading ? '登录中...' : '登录'}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-border text-center">
              <p className="text-sm text-muted-foreground">
                首次使用？ <button className="text-primary hover:text-primary/80 font-medium ml-1">联系管理员开户</button>
              </p>
            </div>
          </div>

          <p className="text-center text-primary-400 text-xs mt-6">
            © 2024 律智 Legal Intelligence Platform. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
