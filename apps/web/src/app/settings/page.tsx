'use client'

import { useState } from 'react'
import {
  Settings,
  User,
  Building2,
  Users,
  Bell,
  Shield,
  Palette,
  Database,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { useAuthStore } from '@/stores'

export default function SettingsPage() {
  const { user } = useAuthStore()

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">系统设置</h1>
        <p className="text-sm text-muted-foreground mt-1">管理系统配置和个人信息</p>
      </div>

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile" className="gap-2">
            <User className="h-4 w-4" />
            个人信息
          </TabsTrigger>
          <TabsTrigger value="system" className="gap-2">
            <Settings className="h-4 w-4" />
            系统设置
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-2">
            <Users className="h-4 w-4" />
            用户管理
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" />
            通知设置
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>基本信息</CardTitle>
                <CardDescription>更新您的个人信息</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">姓名</Label>
                    <Input id="name" defaultValue={user?.name || ''} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">邮箱</Label>
                    <Input id="email" type="email" defaultValue={user?.email || ''} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">手机号</Label>
                    <Input id="phone" defaultValue={user?.phone || ''} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">角色</Label>
                    <Input id="role" defaultValue={user?.role || ''} disabled />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department">部门</Label>
                  <Input id="department" defaultValue={user?.department || ''} />
                </div>
                <div className="flex justify-end">
                  <Button>保存修改</Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>头像</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-center">
                  <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-12 w-12 text-primary" />
                  </div>
                </div>
                <Button variant="outline" className="w-full">
                  上传头像
                </Button>
              </CardContent>
            </Card>

            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle>修改密码</CardTitle>
                <CardDescription>定期修改密码以确保账户安全</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="old-password">当前密码</Label>
                    <Input id="old-password" type="password" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-password">新密码</Label>
                    <Input id="new-password" type="password" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">确认新密码</Label>
                    <Input id="confirm-password" type="password" />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button>修改密码</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="system">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  数据配置
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">自动备份</p>
                      <p className="text-sm text-muted-foreground">
                        每天凌晨自动备份数据库
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">数据缓存</p>
                      <p className="text-sm text-muted-foreground">
                        使用 Redis 缓存热点数据
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  界面设置
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">深色模式</p>
                      <p className="text-sm text-muted-foreground">
                        切换深色/浅色主题
                      </p>
                    </div>
                    <Switch />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">侧边栏收起</p>
                      <p className="text-sm text-muted-foreground">
                        默认收起侧边栏
                      </p>
                    </div>
                    <Switch />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users">
          <Card className="mt-6">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>用户管理</CardTitle>
                <CardDescription>管理系统用户和权限</CardDescription>
              </div>
              <Button>
                <Users className="mr-2 h-4 w-4" />
                添加用户
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {['管理员', '管家', '维修员', '财务', '一线处理'].map((role, idx) => (
                  <div
                    key={role}
                    className="flex items-center justify-between p-4 rounded-lg bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{role}账号</p>
                        <p className="text-sm text-muted-foreground">
                          {role}@rental.com
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline">{role}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>通知设置</CardTitle>
              <CardDescription>配置消息通知偏好</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">租金逾期提醒</p>
                    <p className="text-sm text-muted-foreground">
                      租金逾期时发送通知
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">新任务通知</p>
                    <p className="text-sm text-muted-foreground">
                      有新任务分派时发送通知
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">维修工单提醒</p>
                    <p className="text-sm text-muted-foreground">
                      维修状态变更时发送通知
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">合同到期提醒</p>
                    <p className="text-sm text-muted-foreground">
                      合同到期前发送提醒
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">邮件通知</p>
                    <p className="text-sm text-muted-foreground">
                      通过邮件发送重要通知
                    </p>
                  </div>
                  <Switch />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
