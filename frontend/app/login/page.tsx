"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import {
  User,
  Home,
  HardHat,
  Palette,
  Shield,
  Briefcase,
  LogIn,
  Eye,
  EyeOff,
  Mail,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { UserRole } from "@/lib/types";
import { USER_ROLE_LABELS } from "@/lib/constants";
import { useAuth } from "@/lib/context/AuthContext";
import { cn } from "@/lib/utils";

interface LoginFormData {
  email: string;
  password: string;
}

const roleOptions = [
  { role: UserRole.OWNER, icon: Home, color: "text-blue-600", bg: "bg-blue-50" },
  { role: UserRole.FOREMAN, icon: HardHat, color: "text-green-600", bg: "bg-green-50" },
  { role: UserRole.DESIGNER, icon: Palette, color: "text-purple-600", bg: "bg-purple-50" },
  { role: UserRole.SUPERVISOR, icon: Shield, color: "text-orange-600", bg: "bg-orange-50" },
  {
    role: UserRole.PROJECT_MANAGER,
    icon: Briefcase,
    color: "text-indigo-600",
    bg: "bg-indigo-50",
  },
];

export default function LoginPage() {
  const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.OWNER);
  const [showPassword, setShowPassword] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const { login } = useAuth();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<LoginFormData>({
    defaultValues: {
      email: "zhangmingyuan@example.com",
      password: "123456",
    },
  });

  const onSubmit = handleSubmit((data) => {
    const success = login(data.email, selectedRole);
    if (success) {
      router.push("/dashboard");
    } else {
      setError("email", {
        type: "manual",
        message: "邮箱或角色不匹配，请重试",
      });
    }
  });

  return (
    <div className="min-h-screen flex bg-gray-50">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-600 to-primary-800 items-center justify-center p-12">
        <div className="max-w-md text-white">
          <div className="flex items-center gap-3 mb-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20">
              <Home className="h-7 w-7" />
            </div>
            <span className="text-2xl font-bold">工地确认系统</span>
          </div>
          <h1 className="text-3xl font-bold mb-4">
            家装工地客户确认任务分派台
          </h1>
          <p className="text-primary-100 mb-8">
            高效管理节点验收、设计变更、材料替换、增项报价等各类确认任务，
            实现工地流程数字化，提升沟通效率。
          </p>
          <div className="space-y-4">
            {[
              "实时看板，任务状态一目了然",
              "多方协作，沟通记录完整留存",
              "图片对比，施工前后清晰可见",
              "版本管理，报价变更全程追溯",
            ].map((item, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20">
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <span className="text-primary-100">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="lg:hidden flex items-center justify-center gap-2 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-600">
                <Home className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">工地确认系统</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              {isLogin ? "欢迎回来" : "创建账号"}
            </h2>
            <p className="text-gray-500 mt-2">
              {isLogin ? "请选择角色并登录您的账号" : "请选择角色并注册新账号"}
            </p>
          </div>

          <div className="mb-6">
            <label className="label">选择角色</label>
            <div className="grid grid-cols-5 gap-2">
              {roleOptions.map((option) => {
                const Icon = option.icon;
                const isSelected = selectedRole === option.role;
                return (
                  <button
                    key={option.role}
                    type="button"
                    onClick={() => setSelectedRole(option.role)}
                    className={cn(
                      "flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all",
                      isSelected
                        ? "border-primary-500 bg-primary-50"
                        : "border-gray-200 hover:border-gray-300 bg-white"
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-lg",
                        isSelected ? option.bg : "bg-gray-100"
                      )}
                    >
                      <Icon
                        className={cn(
                          "h-5 w-5",
                          isSelected ? option.color : "text-gray-500"
                        )}
                      />
                    </div>
                    <span
                      className={cn(
                        "text-xs font-medium",
                        isSelected ? "text-primary-700" : "text-gray-500"
                      )}
                    >
                      {USER_ROLE_LABELS[option.role]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <Input
                label="邮箱"
                type="email"
                placeholder="请输入邮箱"
                icon={<Mail className="h-4 w-4" />}
                {...register("email", {
                  required: "请输入邮箱",
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: "请输入有效的邮箱地址",
                  },
                })}
                error={errors.email?.message}
              />
            </div>

            {!isLogin && (
              <div>
                <Input
                  label="姓名"
                  type="text"
                  placeholder="请输入姓名"
                />
              </div>
            )}

            <div className="relative">
              <Input
                label="密码"
                type={showPassword ? "text" : "password"}
                placeholder="请输入密码"
                {...register("password", {
                  required: "请输入密码",
                  minLength: {
                    value: 6,
                    message: "密码至少6位",
                  },
                })}
                error={errors.password?.message}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>

            {isLogin && (
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-gray-600">记住我</span>
                </label>
                <a href="#" className="text-primary-600 hover:underline">
                  忘记密码？
                </a>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              <LogIn className="h-4 w-4 mr-2" />
              {isLogin ? "登录" : "注册"}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-gray-500">
              {isLogin ? "还没有账号？" : "已有账号？"}
            </span>
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-primary-600 hover:underline font-medium"
            >
              {isLogin ? "立即注册" : "立即登录"}
            </button>
          </div>

          <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-xs text-gray-500 mb-2">演示账号：</p>
            <p className="text-xs text-gray-600">
              业主：zhangmingyuan@example.com
            </p>
            <p className="text-xs text-gray-600">
              工长：lijianguo@example.com
            </p>
            <p className="text-xs text-gray-600">
              设计师：wangxiaoya@example.com
            </p>
            <p className="text-xs text-gray-600">
              任意密码（6位以上）
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
