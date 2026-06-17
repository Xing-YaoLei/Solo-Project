'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ListTodo,
  Plus,
  Filter,
  Search,
  Clock,
  AlertTriangle,
  User,
  Building2,
  MoreHorizontal,
  ChevronRight,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { tasksApi, propertiesApi, usersApi, maintenanceApi, utilitiesApi } from '@/lib/api'
import { formatDate, getStatusColor, getStatusLabel, formatDateTime } from '@/lib/utils'
import { useTaskStore, useAppStore } from '@/stores'

const taskPools = [
  { key: 'all', label: '全部任务', icon: ListTodo },
  { key: 'overdue', label: '逾期池', icon: AlertTriangle },
  { key: 'pending', label: '待处理', icon: Clock },
  { key: 'in_progress', label: '进行中', icon: Clock },
  { key: 'completed', label: '已完成', icon: ListTodo },
]

export default function TasksPage() {
  const [tasks, setTasks] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [activePool, setActivePool] = useState('all')
  const [stats, setStats] = useState<any>(null)
  const [users, setUsers] = useState<any[]>([])
  const { filters, setFilters, selectedTaskId, setSelectedTask } = useTaskStore()
  const { viewRole } = useAppStore()
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  const [keyword, setKeyword] = useState('')

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const result: any = await usersApi.getUsers({ pageSize: 100 })
        setUsers(result.list || [])
      } catch (e) {
        console.error(e)
      }
    }
    fetchUsers()
  }, [])

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await tasksApi.getStats()
        setStats(data)
      } catch (e) {
        console.error(e)
      }
    }
    fetchStats()
  }, [])

  useEffect(() => {
    fetchTasks()
  }, [activePool, page, keyword, filters, viewRole])

  const fetchTasks = async () => {
    setLoading(true)
    try {
      const params: any = {
        page,
        pageSize,
        keyword: keyword || undefined,
        viewRole,
        ...filters,
      }

      if (activePool === 'overdue') {
        params.pool = 'overdue'
      } else if (activePool !== 'all') {
        params.status = activePool.toUpperCase()
      }

      const result: any = await tasksApi.getTasks(params)
      setTasks(result.list || [])
      setTotal(result.total || 0)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const getTaskIcon = (type: string) => {
    switch (type) {
      case 'PROPERTY_LISTING':
        return Building2
      case 'RENT_OVERDUE':
        return AlertTriangle
      case 'MAINTENANCE':
        return ListTodo
      case 'CONTRACT_REVIEW':
        return ListTodo
      default:
        return ListTodo
    }
  }

  const getTaskTypeColor = (type: string) => {
    switch (type) {
      case 'PROPERTY_LISTING':
        return 'bg-blue-100 text-blue-600'
      case 'RENT_OVERDUE':
        return 'bg-red-100 text-red-600'
      case 'MAINTENANCE':
        return 'bg-orange-100 text-orange-600'
      case 'CONTRACT_REVIEW':
        return 'bg-purple-100 text-purple-600'
      default:
        return 'bg-gray-100 text-gray-600'
    }
  }

  return (
    <div className="flex h-full">
      {/* 左侧任务列表 */}
      <div className="flex w-96 flex-col border-r bg-background">
        <div className="border-b p-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-lg font-bold">任务分派台</h1>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              新建任务
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="搜索任务..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        <div className="flex border-b">
          {taskPools.slice(0, 4).map((pool) => {
            const Icon = pool.icon
            const isActive = activePool === pool.key
            return (
              <button
                key={pool.key}
                onClick={() => {
                  setActivePool(pool.key)
                  setPage(1)
                }}
                className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium border-b-2 transition-colors ${
                  isActive
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{pool.label}</span>
              </button>
            )
          })}
        </div>

        {/* 常用筛选 */}
        <div className="border-b p-3">
          <div className="flex items-center gap-2 mb-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">常用筛选</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge
              variant={filters.type === 'RENT_OVERDUE' ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() =>
                setFilters({
                  type: filters.type === 'RENT_OVERDUE' ? undefined : 'RENT_OVERDUE',
                })
              }
            >
              租金逾期
            </Badge>
            <Badge
              variant={filters.type === 'PROPERTY_LISTING' ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() =>
                setFilters({
                  type:
                    filters.type === 'PROPERTY_LISTING' ? undefined : 'PROPERTY_LISTING',
                })
              }
            >
              房源上架
            </Badge>
            <Badge
              variant={filters.type === 'MAINTENANCE' ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() =>
                setFilters({
                  type: filters.type === 'MAINTENANCE' ? undefined : 'MAINTENANCE',
                })
              }
            >
              维修工单
            </Badge>
            <Badge
              variant={filters.priority === 'URGENT' ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() =>
                setFilters({
                  priority: filters.priority === 'URGENT' ? undefined : 'URGENT',
                })
              }
            >
              紧急
            </Badge>
          </div>
        </div>

        {/* 任务列表 */}
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-sm text-muted-foreground">加载中...</div>
            </div>
          ) : tasks.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-sm text-muted-foreground">暂无任务</div>
            </div>
          ) : (
            <div className="divide-y">
              {tasks.map((task) => {
                const Icon = getTaskIcon(task.type)
                const isSelected = selectedTaskId === task.id
                const isOverdue =
                  task.status === 'OVERDUE' ||
                  (task.dueDate && new Date(task.dueDate) < new Date() &&
                    task.status !== 'COMPLETED')

                return (
                  <div
                    key={task.id}
                    onClick={() => setSelectedTask(task.id)}
                    className={`p-4 cursor-pointer transition-colors hover:bg-muted/50 ${
                      isSelected ? 'bg-muted border-l-2 border-l-primary' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`p-2 rounded-lg ${getTaskTypeColor(task.type)}`}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-sm truncate">{task.title}</p>
                          {isOverdue && (
                            <span className="text-xs text-red-500 font-medium flex-shrink-0">
                              逾期
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 truncate">
                          {task.property?.title || ''}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(
                                task.status
                              )}`}
                            >
                              {getStatusLabel(task.status)}
                            </span>
                            {task.priority === 'URGENT' && (
                              <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-600">
                                紧急
                              </span>
                            )}
                          </div>
                          {task.assignee && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <User className="h-3 w-3" />
                              <span className="truncate">{task.assignee.name}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* 分页 */}
        <div className="border-t p-3 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">共 {total} 条</span>
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="outline"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              上一页
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={tasks.length < pageSize}
              onClick={() => setPage((p) => p + 1)}
            >
              下一页
            </Button>
          </div>
        </div>
      </div>

      {/* 右侧任务详情 */}
      <div className="flex-1 bg-muted/30">
        {selectedTaskId ? (
          <TaskDetail taskId={selectedTaskId} onUpdate={fetchTasks} />
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <ListTodo className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">选择一个任务查看详情</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function TaskDetail({ taskId, onUpdate }: { taskId: string; onUpdate: () => void }) {
  const [task, setTask] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('photos')
  const [comment, setComment] = useState('')

  useEffect(() => {
    fetchTask()
  }, [taskId])

  const fetchTask = async () => {
    setLoading(true)
    try {
      const data = await tasksApi.getTask(taskId)
      setTask(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleAddComment = async () => {
    if (!comment.trim()) return
    try {
      await tasksApi.addComment(taskId, comment)
      setComment('')
      fetchTask()
      onUpdate()
    } catch (e) {
      console.error(e)
    }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-muted-foreground">加载中...</div>
      </div>
    )
  }

  if (!task) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-muted-foreground">任务不存在</div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      {/* 任务标题栏 */}
      <div className="border-b bg-background p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span
                className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(
                  task.status
                )}`}
              >
                {getStatusLabel(task.status)}
              </span>
              <span className="text-sm text-muted-foreground">{task.taskNo}</span>
            </div>
            <h2 className="text-xl font-bold">{task.title}</h2>
            <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
          </div>
          <TaskActions
            task={task}
            onUpdate={() => {
              fetchTask()
              onUpdate()
            }}
          />
        </div>

        <div className="flex items-center gap-6 mt-4 text-sm">
          {task.property && (
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span>{task.property.title}</span>
            </div>
          )}
          {task.assignee && (
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span>负责人：{task.assignee.name}</span>
            </div>
          )}
          {task.dueDate && (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>截止：{formatDate(task.dueDate)}</span>
            </div>
          )}
        </div>
      </div>

      {/* 操作区 Tab */}
      <div className="flex-1 overflow-hidden flex">
        <div className="flex-1 overflow-auto p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="photos">房源照片</TabsTrigger>
              <TabsTrigger value="tenant">租客档案</TabsTrigger>
              <TabsTrigger value="contract">合同版本</TabsTrigger>
              <TabsTrigger value="materials">补充材料</TabsTrigger>
              <TabsTrigger value="comments">处理记录</TabsTrigger>
            </TabsList>

            <TabsContent value="photos">
              <PropertyPhotos task={task} />
            </TabsContent>

            <TabsContent value="tenant">
              <TenantProfile task={task} />
            </TabsContent>

            <TabsContent value="contract">
              <ContractVersions task={task} />
            </TabsContent>

            <TabsContent value="materials">
              <TaskMaterials task={task} onUpdate={() => {
                fetchTask()
                onUpdate()
              }} />
            </TabsContent>

            <TabsContent value="comments">
              <TaskComments task={task} />
            </TabsContent>
          </Tabs>
        </div>

        {/* 侧边配置 */}
        <div className="w-72 border-l bg-background p-4 space-y-6 overflow-auto">
          <TaskSidebar task={task} onUpdate={() => { fetchTask(); onUpdate() }} />
        </div>
      </div>

      {/* 底部评论区 */}
      <div className="border-t bg-background p-4">
        <div className="flex gap-3">
          <Input
            placeholder="输入评论或处理意见..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
          />
          <Button onClick={handleAddComment}>发送</Button>
        </div>
      </div>
    </div>
  )
}

function TaskActions({ task, onUpdate }: { task: any; onUpdate: () => void }) {
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [showReassignDialog, setShowReassignDialog] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [reassignTo, setReassignTo] = useState('')
  const [reassignReason, setReassignReason] = useState('')
  const [users, setUsers] = useState<any[]>([])

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const result: any = await usersApi.getUsers({ pageSize: 100 })
        setUsers(result.list || [])
      } catch (e) {
        console.error(e)
      }
    }
    fetchUsers()
  }, [])

  const handleComplete = async () => {
    try {
      await tasksApi.updateStatus(task.id, 'COMPLETED')
      onUpdate()
    } catch (e) {
      console.error(e)
    }
  }

  const handleReject = async () => {
    try {
      await tasksApi.rejectTask(task.id, rejectReason)
      setShowRejectDialog(false)
      setRejectReason('')
      onUpdate()
    } catch (e) {
      console.error(e)
    }
  }

  const handleResubmit = async () => {
    try {
      await tasksApi.resubmitTask(task.id)
      onUpdate()
    } catch (e) {
      console.error(e)
    }
  }

  const handleReassign = async () => {
    try {
      await tasksApi.reassignTask(task.id, reassignTo, reassignReason)
      setShowReassignDialog(false)
      setReassignTo('')
      setReassignReason('')
      onUpdate()
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <>
      <div className="flex items-center gap-2">
        {task.status !== 'COMPLETED' && task.status !== 'REJECTED' && (
          <Button onClick={handleComplete}>完成</Button>
        )}

        {task.status === 'REJECTED' && (
          <Button onClick={handleResubmit}>重新提交</Button>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setShowReassignDialog(true)}>
              重新分派
            </DropdownMenuItem>
            {task.status !== 'REJECTED' && task.status !== 'COMPLETED' && (
              <DropdownMenuItem onClick={() => setShowRejectDialog(true)}>
                驳回
              </DropdownMenuItem>
            )}
            <DropdownMenuItem>查看详情</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* 驳回对话框 */}
      {showRejectDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background rounded-lg p-6 w-96">
            <h3 className="text-lg font-bold mb-4">驳回任务</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">驳回原因</label>
                <textarea
                  className="mt-1 w-full rounded-md border border-input p-2 text-sm"
                  rows={4}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="请输入驳回原因..."
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
                  取消
                </Button>
                <Button variant="destructive" onClick={handleReject}>
                  确认驳回
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 重新分派对话框 */}
      {showReassignDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background rounded-lg p-6 w-96">
            <h3 className="text-lg font-bold mb-4">重新分派</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">分派给</label>
                <select
                  className="mt-1 w-full rounded-md border border-input p-2 text-sm"
                  value={reassignTo}
                  onChange={(e) => setReassignTo(e.target.value)}
                >
                  <option value="">请选择</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} - {user.role}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">原因</label>
                <textarea
                  className="mt-1 w-full rounded-md border border-input p-2 text-sm"
                  rows={3}
                  value={reassignReason}
                  onChange={(e) => setReassignReason(e.target.value)}
                  placeholder="请输入重新分派原因..."
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowReassignDialog(false)}>
                  取消
                </Button>
                <Button onClick={handleReassign} disabled={!reassignTo}>
                  确认分派
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function PropertyPhotos({ task }: { task: any }) {
  const photos = task.property?.photos || []

  if (photos.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        暂无房源照片
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium">房源照片 ({photos.length}张)</h3>
        <Button size="sm" variant="outline">
          <Plus className="mr-2 h-4 w-4" />
          上传照片
        </Button>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {photos.map((photo: any) => (
          <div
            key={photo.id}
            className="relative group rounded-lg overflow-hidden border"
          >
            <img
              src={photo.url}
              alt={photo.title}
              className="w-full h-32 object-cover"
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <Button size="sm" variant="secondary">查看</Button>
              <Button size="sm" variant="secondary">删除</Button>
            </div>
            {photo.title && (
              <p className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-2">
                {photo.title}
              </p>
            )}
            {photo.isCover && (
              <span className="absolute top-2 left-2 px-2 py-0.5 bg-primary text-white text-xs rounded">
                封面
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function TenantProfile({ task }: { task: any }) {
  const tenant = task.tenant

  if (!tenant) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        暂无租客信息
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-medium">租客档案</h3>
        <Button size="sm" variant="outline">编辑信息</Button>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">基本信息</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">姓名</span>
              <span>{tenant.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">手机号</span>
              <span>{tenant.phone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">身份证号</span>
              <span>{tenant.idCardNo || '未填写'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">性别</span>
              <span>{tenant.gender || '未填写'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">职业</span>
              <span>{tenant.occupation || '未填写'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">公司</span>
              <span>{tenant.company || '未填写'}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">紧急联系人</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">联系人</span>
              <span>{tenant.emergencyContact || '未填写'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">联系电话</span>
              <span>{tenant.emergencyPhone || '未填写'}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">证件资料</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4">
              <div className="aspect-[4/3] rounded-lg border-2 border-dashed flex items-center justify-center text-muted-foreground text-sm">
                {tenant.idCardFront ? '身份证正面' : '+ 添加身份证正面'}
              </div>
              <div className="aspect-[4/3] rounded-lg border-2 border-dashed flex items-center justify-center text-muted-foreground text-sm">
                {tenant.idCardBack ? '身份证反面' : '+ 添加身份证反面'}
              </div>
              <div className="aspect-[4/3] rounded-lg border-2 border-dashed flex items-center justify-center text-muted-foreground text-sm">
                {tenant.workCertificate ? '工作证明' : '+ 添加工作证明'}
              </div>
              <div className="aspect-[4/3] rounded-lg border-2 border-dashed flex items-center justify-center text-muted-foreground text-sm">
                + 其他资料
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function ContractVersions({ task }: { task: any }) {
  const contract = task.contract

  if (!contract) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        暂无合同信息
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-medium">合同版本管理</h3>
          <p className="text-sm text-muted-foreground mt-1">
            合同编号：{contract.contractNo} · 当前版本：v{contract.version}
          </p>
        </div>
        <Button size="sm">
          <Plus className="mr-2 h-4 w-4" />
          新建版本
        </Button>
      </div>

      <div className="space-y-4">
        {/* 当前版本 */}
        <Card className="border-primary">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                版本 v{contract.version}
                <Badge variant="default" className="text-xs">
                  当前版本
                </Badge>
              </CardTitle>
              <span className="text-xs text-muted-foreground">
                {formatDate(contract.createdAt)}
              </span>
            </div>
            {contract.versionNote && (
              <p className="text-sm text-muted-foreground mt-1">
                {contract.versionNote}
              </p>
            )}
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">月租金</p>
                <p className="font-medium mt-1">¥{contract.monthlyRent}/月</p>
              </div>
              <div>
                <p className="text-muted-foreground">押金</p>
                <p className="font-medium mt-1">¥{contract.deposit}</p>
              </div>
              <div>
                <p className="text-muted-foreground">付款周期</p>
                <p className="font-medium mt-1">
                  {contract.paymentCycle === 'MONTHLY' ? '月付' : '季付'}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">合同开始</p>
                <p className="font-medium mt-1">{formatDate(contract.startDate)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">合同结束</p>
                <p className="font-medium mt-1">{formatDate(contract.endDate)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">状态</p>
                <p className="font-medium mt-1">
                  <span
                    className={`px-2 py-0.5 rounded text-xs ${getStatusColor(
                      contract.status
                    )}`}
                  >
                    {getStatusLabel(contract.status)}
                  </span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 历史版本 */}
        {contract.amendments?.length > 0 && (
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium mb-3">历史版本</h4>
            <div className="space-y-2">
              {contract.amendments.map((amendment: any) => (
                <div
                  key={amendment.id}
                  className="p-3 rounded-lg border bg-muted/30 flex items-center justify-between"
                >
                  <div>
                    <p className="text-sm font-medium">版本 v{amendment.version}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {amendment.reason || amendment.changeType}
                    </p>
                  </div>
                  <Button size="sm" variant="ghost">
                    查看详情
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function TaskMaterials({ task, onUpdate }: { task: any; onUpdate: () => void }) {
  const materials = task.materials || []
  const [adding, setAdding] = useState(false)
  const [newMaterial, setNewMaterial] = useState({ name: '', type: 'document', url: '' })

  const handleAdd = async () => {
    if (!newMaterial.name) return
    try {
      await tasksApi.addMaterials(task.id, [newMaterial])
      setAdding(false)
      setNewMaterial({ name: '', type: 'document', url: '' })
      onUpdate()
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-medium">补充材料</h3>
        <Button size="sm" onClick={() => setAdding(true)}>
          <Plus className="mr-2 h-4 w-4" />
          添加材料
        </Button>
      </div>

      {adding && (
        <Card className="mb-4">
          <CardContent className="pt-4 space-y-3">
            <Input
              placeholder="材料名称"
              value={newMaterial.name}
              onChange={(e) => setNewMaterial({ ...newMaterial, name: e.target.value })}
            />
            <Input
              placeholder="材料链接/说明"
              value={newMaterial.url}
              onChange={(e) => setNewMaterial({ ...newMaterial, url: e.target.value })}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setAdding(false)}>
                取消
              </Button>
              <Button size="sm" onClick={handleAdd}>
                确认添加
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {materials.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          暂无补充材料
        </div>
      ) : (
        <div className="space-y-2">
          {materials.map((material: any, index: number) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 rounded-lg border bg-background"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-muted rounded">
                  <ListTodo className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium text-sm">{material.name}</p>
                  {material.url && (
                    <p className="text-xs text-muted-foreground">{material.url}</p>
                  )}
                </div>
              </div>
              <Button variant="ghost" size="sm">
                查看
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function TaskComments({ task }: { task: any }) {
  const comments = task.comments || []

  if (comments.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        暂无处理记录
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {comments.map((comment: any) => (
        <div key={comment.id} className="flex gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <User className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">{comment.user?.name}</span>
              <span className="text-xs text-muted-foreground">
                {formatDateTime(comment.createdAt)}
              </span>
            </div>
            <p className="text-sm mt-1 text-muted-foreground">{comment.content}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

function TaskSidebar({ task, onUpdate }: { task: any; onUpdate: () => void }) {
  const [maintenanceRecords, setMaintenanceRecords] = useState<any[]>([])
  const [utilityReadings, setUtilityReadings] = useState<any[]>([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (task.propertyId) {
          const [records, readings] = await Promise.all([
            maintenanceApi.getRecords({ propertyId: task.propertyId, pageSize: 5 }),
            utilitiesApi.getPropertyReadings(task.propertyId, { pageSize: 5 }),
          ])
          setMaintenanceRecords((records as any)?.list || (Array.isArray(records) ? records : []))
          const readingsData = readings as any
          setUtilityReadings(readingsData?.list || Array.isArray(readingsData) ? readingsData : [])
        }
      } catch (e) {
        console.error(e)
      }
    }
    fetchData()
  }, [task.propertyId])

  return (
    <>
      <div>
        <h3 className="font-medium text-sm mb-3">维修记录配置</h3>
        {maintenanceRecords.length === 0 ? (
          <p className="text-xs text-muted-foreground">暂无维修记录</p>
        ) : (
          <div className="space-y-2">
            {maintenanceRecords.slice(0, 5).map((record: any) => (
              <button key={record.id} className="w-full text-left p-3 rounded-lg bg-muted/50 hover:bg-muted text-sm">
                <p className="font-medium">{record.type}维修</p>
                <p className="text-xs text-muted-foreground truncate">{record.description}</p>
              </button>
            ))}
          </div>
        )}
      </div>

      <div>
        <h3 className="font-medium text-sm mb-3">水电读数留痕</h3>
        {utilityReadings.length === 0 ? (
          <p className="text-xs text-muted-foreground">暂无水电读数</p>
        ) : (
          <div className="space-y-2">
            {utilityReadings.slice(0, 4).map((reading: any) => (
              <div key={reading.id} className="p-3 rounded-lg bg-muted/50 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {reading.type === 'ELECTRIC' ? '电表' : reading.type === 'WATER' ? '水表' : '燃气表'}
                  </span>
                  <span className="font-medium">{reading.reading} {reading.type === 'ELECTRIC' ? '度' : '吨'}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  抄表日期：{formatDate(reading.readingDate)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h3 className="font-medium text-sm mb-3">快速操作</h3>
        <div className="space-y-2">
          <Button size="sm" variant="outline" className="w-full justify-start">
            <Plus className="mr-2 h-4 w-4" />
            创建维修工单
          </Button>
          <Button size="sm" variant="outline" className="w-full justify-start">
            <Plus className="mr-2 h-4 w-4" />
            录入水电读数
          </Button>
          <Button size="sm" variant="outline" className="w-full justify-start">
            <Plus className="mr-2 h-4 w-4" />
            生成财务记录
          </Button>
        </div>
      </div>

      <div>
        <h3 className="font-medium text-sm mb-3">操作日志</h3>
        <div className="space-y-3">
          {task.auditLogs?.slice(0, 5).map((log: any) => (
            <div key={log.id} className="flex gap-2 text-xs">
              <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
              <div>
                <p className="text-muted-foreground">
                  {log.user?.name} {log.remark}
                </p>
                <p className="text-muted-foreground/70">
                  {formatDateTime(log.createdAt)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
