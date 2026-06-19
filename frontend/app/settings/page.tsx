'use client';

import { useState } from 'react';
import {
  User,
  Bell,
  Shield,
  Palette,
  Database,
  Save,
} from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/Card';
import Button from '@/components/Button';
import Input from '@/components/Input';
import Select from '@/components/Select';
import { useProtectedRoute } from '@/hooks/useProtectedRoute';
import { useAuth } from '@/components/auth/AuthProvider';

const settingSections = [
  { id: 'profile', label: '个人信息', icon: User },
  { id: 'notifications', label: '通知设置', icon: Bell },
  { id: 'security', label: '安全设置', icon: Shield },
  { id: 'appearance', label: '外观设置', icon: Palette },
  { id: 'system', label: '系统设置', icon: Database },
];

export default function SettingsPage() {
  const { isAuthorized } = useProtectedRoute({
    allowedRoles: ['manager'],
  });
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState('profile');
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });

  if (!isAuthorized) {
    return null;
  }

  const handleSave = () => {
    alert('设置已保存');
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-slate-900">系统设置</h2>

      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="lg:w-56">
          <Card>
            <nav className="p-2">
              {settingSections.map((section) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors ${
                      activeSection === section.id
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {section.label}
                  </button>
                );
              })}
            </nav>
          </Card>
        </div>

        <div className="flex-1">
          {activeSection === 'profile' && (
            <Card>
              <CardHeader>
                <CardTitle>个人信息</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Input
                    label="姓名"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                  <Input
                    label="邮箱"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                  />
                  <Input
                    label="手机号"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                  />
                </div>
                <div className="flex justify-end">
                  <Button onClick={handleSave}>
                    <Save className="mr-2 h-4 w-4" />
                    保存
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {activeSection === 'notifications' && (
            <Card>
              <CardHeader>
                <CardTitle>通知设置</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { label: '新工单通知', desc: '有新工单时发送通知' },
                  { label: '配件申领审批通知', desc: '配件申领需要审批时通知' },
                  { label: '保养提醒通知', desc: '保养提醒到期时通知' },
                  { label: '库存预警通知', desc: '配件库存不足时通知' },
                ].map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between"
                  >
                    <div>
                      <p className="font-medium text-slate-900">{item.label}</p>
                      <p className="text-sm text-slate-500">{item.desc}</p>
                    </div>
                    <label className="relative inline-flex cursor-pointer items-center">
                      <input
                        type="checkbox"
                        defaultChecked
                        className="peer sr-only"
                      />
                      <div className="peer h-6 w-11 rounded-full bg-slate-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-slate-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary-600 peer-checked:after:translate-x-full peer-checked:after:border-white"></div>
                    </label>
                  </div>
                ))}
                <div className="flex justify-end">
                  <Button onClick={handleSave}>
                    <Save className="mr-2 h-4 w-4" />
                    保存
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {activeSection === 'security' && (
            <Card>
              <CardHeader>
                <CardTitle>安全设置</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <Input label="当前密码" type="password" />
                  <Input label="新密码" type="password" />
                  <Input label="确认新密码" type="password" />
                </div>
                <div className="flex justify-end">
                  <Button onClick={handleSave}>
                    <Save className="mr-2 h-4 w-4" />
                    修改密码
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {activeSection === 'appearance' && (
            <Card>
              <CardHeader>
                <CardTitle>外观设置</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="sm:w-48">
                  <Select
                    label="主题模式"
                    options={[
                      { value: 'light', label: '浅色模式' },
                      { value: 'dark', label: '深色模式' },
                      { value: 'system', label: '跟随系统' },
                    ]}
                  />
                </div>
                <div className="flex justify-end">
                  <Button onClick={handleSave}>
                    <Save className="mr-2 h-4 w-4" />
                    保存
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {activeSection === 'system' && (
            <Card>
              <CardHeader>
                <CardTitle>系统设置</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Input label="公司名称" defaultValue="XX汽车服务中心" />
                  <Input label="联系电话" defaultValue="400-123-4567" />
                  <Input label="地址" defaultValue="北京市朝阳区XX路XX号" />
                  <Input
                    label="工作时间"
                    defaultValue="周一至周日 8:00-18:00"
                  />
                </div>
                <div className="flex justify-end">
                  <Button onClick={handleSave}>
                    <Save className="mr-2 h-4 w-4" />
                    保存
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
