'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
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
  Image as ImageIcon,
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
import { tasksApi, propertiesApi, usersApi, maintenanceApi, utilitiesApi, tenantsApi, contractsApi, financeApi } from '@/lib/api'
import { formatDate, getStatusColor, getStatusLabel, formatDateTime } from '@/lib/utils'
import { useTaskStore, useAppStore } from '@/stores'

const taskPools = [
  { key: 'all', label: '全部任务', icon: ListTodo },
  { key: 'overdue', label: '逾期池', icon: AlertTriangle },
  { key: 'pending', label: '待处理', icon: Clock },
  { key: 'in_progress', label: '进行中', icon: Clock },
  { key: 'completed', label: '已完成', icon: ListTodo },
]

export default function TasksPageWrapper() {
  return (
    <Suspense fallback={<div className="flex h-full items-center justify-center"><div className="text-muted-foreground">加载中...</div></div>}>
      <TasksPage />
    </Suspense>
  )
}

function TasksPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const [tasks, setTasks] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const initialPool = searchParams.get('pool') || 'all'
  const initialTaskId = searchParams.get('taskId')
  const [activePool, setActivePool] = useState(initialPool)
  const [stats, setStats] = useState<any>(null)
  const [users, setUsers] = useState<any[]>([])
  const { filters, setFilters, selectedTaskId, setSelectedTask } = useTaskStore()
  const { viewRole } = useAppStore()
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  const [keyword, setKeyword] = useState('')

  useEffect(() => {
    const pool = searchParams.get('pool') || 'all'
    setActivePool(pool)
    const taskId = searchParams.get('taskId')
    if (taskId) {
      setSelectedTask(taskId)
    }
  }, [searchParams, setSelectedTask])

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
                  const params = new URLSearchParams(searchParams.toString())
                  if (pool.key === 'all') {
                    params.delete('pool')
                  } else {
                    params.set('pool', pool.key)
                  }
                  router.push(`${pathname}?${params.toString()}`)
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
              <TabsTrigger value="maintenance">维修工单</TabsTrigger>
              <TabsTrigger value="utilities">水电读数</TabsTrigger>
              <TabsTrigger value="finance">财务记录</TabsTrigger>
              <TabsTrigger value="materials">补充材料</TabsTrigger>
              <TabsTrigger value="comments">处理记录</TabsTrigger>
            </TabsList>

            <TabsContent value="photos">
              <PropertyPhotos task={task} onUpdate={() => { fetchTask(); onUpdate() }} />
            </TabsContent>

            <TabsContent value="tenant">
              <TenantProfile task={task} onUpdate={() => { fetchTask(); onUpdate() }} />
            </TabsContent>

            <TabsContent value="contract">
              <ContractVersions task={task} onUpdate={() => { fetchTask(); onUpdate() }} />
            </TabsContent>

            <TabsContent value="maintenance">
              <MaintenanceWorkOrders task={task} onUpdate={() => { fetchTask(); onUpdate() }} />
            </TabsContent>

            <TabsContent value="utilities">
              <UtilityReadingsTab task={task} onUpdate={() => { fetchTask(); onUpdate() }} />
            </TabsContent>

            <TabsContent value="finance">
              <FinanceRecordsTab task={task} onUpdate={() => { fetchTask(); onUpdate() }} />
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
          <TaskSidebar task={task} onUpdate={() => { fetchTask(); onUpdate() }} onSwitchTab={(tab) => setActiveTab(tab)} />
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

function PropertyPhotos({ task, onUpdate }: { task: any; onUpdate?: () => void }) {
  const photos = task.property?.photos || []
  const [showUpload, setShowUpload] = useState(false)
  const [newPhoto, setNewPhoto] = useState({ url: '', title: '', sortOrder: 0 })
  const [submitting, setSubmitting] = useState(false)

  const handleUpload = async () => {
    if (!newPhoto.url || !task.propertyId) return
    setSubmitting(true)
    try {
      await propertiesApi.uploadPhoto(task.propertyId, newPhoto)
      setShowUpload(false)
      setNewPhoto({ url: '', title: '', sortOrder: 0 })
      onUpdate?.()
    } catch (e) {
      console.error(e)
      alert('上传失败')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (photoId: string) => {
    if (!confirm('确定删除该照片？')) return
    try {
      await propertiesApi.deletePhoto(photoId)
      onUpdate?.()
    } catch (e) {
      console.error(e)
    }
  }

  const handleSetCover = async (photoId: string) => {
    if (!task.propertyId) return
    try {
      await propertiesApi.setCoverPhoto(task.propertyId, photoId)
      onUpdate?.()
    } catch (e) {
      console.error(e)
    }
  }

  if (photos.length === 0) {
    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium">房源照片 (0张)</h3>
          <Button size="sm" variant="outline" onClick={() => setShowUpload(true)}>
            <Plus className="mr-2 h-4 w-4" />
            上传首张照片
          </Button>
        </div>
        <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
          <ImageIcon className="mx-auto h-12 w-12 mb-2 opacity-50" />
          <p>暂无房源照片</p>
          <p className="text-sm mt-1">点击上方按钮上传首张照片</p>
        </div>

        {showUpload && (
          <Card className="mt-4">
            <CardContent className="pt-4 space-y-3">
              <Input
                placeholder="照片标题"
                value={newPhoto.title}
                onChange={(e) => setNewPhoto({ ...newPhoto, title: e.target.value })}
              />
              <Input
                placeholder="照片URL"
                value={newPhoto.url}
                onChange={(e) => setNewPhoto({ ...newPhoto, url: e.target.value })}
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowUpload(false)}>
                  取消
                </Button>
                <Button size="sm" onClick={handleUpload} disabled={submitting || !newPhoto.url}>
                  {submitting ? '上传中...' : '确认上传'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium">房源照片 ({photos.length}张)</h3>
        <Button size="sm" variant="outline" onClick={() => setShowUpload(true)}>
          <Plus className="mr-2 h-4 w-4" />
          上传照片
        </Button>
      </div>

      {showUpload && (
        <Card className="mb-4">
          <CardContent className="pt-4 space-y-3">
            <Input
              placeholder="照片标题"
              value={newPhoto.title}
              onChange={(e) => setNewPhoto({ ...newPhoto, title: e.target.value })}
            />
            <Input
              placeholder="照片URL"
              value={newPhoto.url}
              onChange={(e) => setNewPhoto({ ...newPhoto, url: e.target.value })}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowUpload(false)}>
                取消
              </Button>
              <Button size="sm" onClick={handleUpload} disabled={submitting || !newPhoto.url}>
                {submitting ? '上传中...' : '确认上传'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

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
              <Button size="sm" variant="secondary" onClick={() => handleSetCover(photo.id)}>设封面</Button>
              <Button size="sm" variant="destructive" onClick={() => handleDelete(photo.id)}>删除</Button>
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

function TenantProfile({ task, onUpdate }: { task: any; onUpdate?: () => void }) {
  const tenant = task.tenant
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<any>({})
  const [submitting, setSubmitting] = useState(false)

  const startEdit = () => {
    setForm({
      name: tenant?.name || '',
      phone: tenant?.phone || '',
      idCardNo: tenant?.idCardNo || '',
      gender: tenant?.gender || '',
      occupation: tenant?.occupation || '',
      company: tenant?.company || '',
      emergencyContact: tenant?.emergencyContact || '',
      emergencyPhone: tenant?.emergencyPhone || '',
    })
    setEditing(true)
  }

  const handleSave = async () => {
    if (!tenant?.id) return
    setSubmitting(true)
    try {
      await tenantsApi.updateTenant(tenant.id, form)
      setEditing(false)
      onUpdate?.()
    } catch (e) {
      console.error(e)
      alert('保存失败')
    } finally {
      setSubmitting(false)
    }
  }

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
        {!editing ? (
          <Button size="sm" variant="outline" onClick={startEdit} disabled={!tenant}>编辑信息</Button>
        ) : (
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setEditing(false)}>取消</Button>
            <Button size="sm" onClick={handleSave} disabled={submitting}>
              {submitting ? '保存中...' : '保存'}
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">基本信息</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {[
              { key: 'name', label: '姓名' },
              { key: 'phone', label: '手机号' },
              { key: 'idCardNo', label: '身份证号' },
              { key: 'gender', label: '性别' },
              { key: 'occupation', label: '职业' },
              { key: 'company', label: '公司' },
            ].map(({ key, label }) => (
              <div key={key} className="flex justify-between items-center">
                <span className="text-muted-foreground">{label}</span>
                {editing ? (
                  <Input
                    className="w-2/3 h-8 text-sm"
                    value={form[key] || ''}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  />
                ) : (
                  <span>{(tenant as any)?.[key] || '未填写'}</span>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">紧急联系人</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {[
              { key: 'emergencyContact', label: '联系人' },
              { key: 'emergencyPhone', label: '联系电话' },
            ].map(({ key, label }) => (
              <div key={key} className="flex justify-between items-center">
                <span className="text-muted-foreground">{label}</span>
                {editing ? (
                  <Input
                    className="w-2/3 h-8 text-sm"
                    value={form[key] || ''}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  />
                ) : (
                  <span>{(tenant as any)?.[key] || '未填写'}</span>
                )}
              </div>
            ))}
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

function ContractVersions({ task, onUpdate }: { task: any; onUpdate?: () => void }) {
  const contract = task.contract
  const [showNew, setShowNew] = useState(false)
  const [form, setForm] = useState<any>({ versionNote: '', monthlyRent: 0, deposit: 0 })
  const [submitting, setSubmitting] = useState(false)

  const handleCreateVersion = async () => {
    if (!contract?.id) return
    setSubmitting(true)
    try {
      await contractsApi.createVersion(contract.id, form)
      setShowNew(false)
      setForm({ versionNote: '', monthlyRent: 0, deposit: 0 })
      onUpdate?.()
    } catch (e) {
      console.error(e)
      alert('创建版本失败')
    } finally {
      setSubmitting(false)
    }
  }

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
        <Button size="sm" onClick={() => setShowNew(true)}>
          <Plus className="mr-2 h-4 w-4" />
          新建版本
        </Button>
      </div>

      {showNew && (
        <Card className="mb-6">
          <CardContent className="pt-4 space-y-3">
            <div>
              <label className="text-sm font-medium">版本说明</label>
              <Input
                className="mt-1"
                placeholder="请输入版本变更说明..."
                value={form.versionNote}
                onChange={(e) => setForm({ ...form, versionNote: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">月租金</label>
                <Input
                  className="mt-1"
                  type="number"
                  value={form.monthlyRent}
                  onChange={(e) => setForm({ ...form, monthlyRent: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">押金</label>
                <Input
                  className="mt-1"
                  type="number"
                  value={form.deposit}
                  onChange={(e) => setForm({ ...form, deposit: Number(e.target.value) })}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowNew(false)}>取消</Button>
              <Button size="sm" onClick={handleCreateVersion} disabled={submitting}>
                {submitting ? '创建中...' : '确认创建'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

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

function MaintenanceWorkOrders({ task, onUpdate }: { task: any; onUpdate?: () => void }) {
  const [records, setRecords] = useState<any[]>([])
  const [workOrders, setWorkOrders] = useState<any[]>([])
  const [workers, setWorkers] = useState<any[]>([])
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState<any>({
    description: '',
    workerId: '',
    priority: 'MEDIUM',
    recordId: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [showNewRecord, setShowNewRecord] = useState(false)
  const [newRecordForm, setNewRecordForm] = useState<any>({ type: '水电', description: '', cost: 0 })

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (task.propertyId) {
          const recordsResult: any = await maintenanceApi.getRecords({ propertyId: task.propertyId, pageSize: 20 })
          setRecords(recordsResult.list || recordsResult || [])
        }
        const workersResult: any = await usersApi.getUsersByRole('MAINTENANCE_WORKER')
        setWorkers(Array.isArray(workersResult) ? workersResult : workersResult.list || [])
      } catch (e) {
        console.error(e)
      }
    }
    fetchData()
  }, [task.propertyId])

  useEffect(() => {
    if (records.length > 0 && task.propertyId) {
      const fetchWorkOrders = async () => {
        try {
          const all: any[] = []
          for (const r of records) {
            const wo: any = await maintenanceApi.getWorkOrders({ recordId: r.id, pageSize: 20 })
            all.push(...(wo.list || wo || []))
          }
          setWorkOrders(all)
        } catch (e) {
          console.error(e)
        }
      }
      fetchWorkOrders()
    }
  }, [records, task.propertyId])

  const handleCreateRecord = async () => {
    if (!task.propertyId) return
    setSubmitting(true)
    try {
      await maintenanceApi.createRecord({
        ...newRecordForm,
        propertyId: task.propertyId,
        status: 'OPEN',
      })
      setShowNewRecord(false)
      setNewRecordForm({ type: '水电', description: '', cost: 0 })
      const recordsResult: any = await maintenanceApi.getRecords({ propertyId: task.propertyId, pageSize: 20 })
      setRecords(recordsResult.list || recordsResult || [])
      onUpdate?.()
    } catch (e) {
      console.error(e)
      alert('创建维修记录失败')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCreateWorkOrder = async () => {
    if (!form.recordId || !form.workerId) return
    setSubmitting(true)
    try {
      await maintenanceApi.createWorkOrder(form.recordId, {
        description: form.description,
        priority: form.priority,
        workerId: form.workerId,
      })
      setShowCreate(false)
      setForm({ description: '', workerId: '', priority: 'MEDIUM', recordId: '' })
      onUpdate?.()
      if (task.propertyId) {
        const all: any[] = []
        for (const r of records) {
          const wo: any = await maintenanceApi.getWorkOrders({ recordId: r.id, pageSize: 20 })
          all.push(...(wo.list || wo || []))
        }
        setWorkOrders(all)
      }
    } catch (e) {
      console.error(e)
      alert('创建工单失败')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCompleteWorkOrder = async (id: string) => {
    const solution = prompt('请输入维修解决方案：')
    if (!solution) return
    const costStr = prompt('维修费用（元）：', '0')
    const cost = costStr ? Number(costStr) : 0
    try {
      await maintenanceApi.completeWorkOrder(id, solution, cost)
      onUpdate?.()
      if (task.propertyId) {
        const all: any[] = []
        for (const r of records) {
          const wo: any = await maintenanceApi.getWorkOrders({ recordId: r.id, pageSize: 20 })
          all.push(...(wo.list || wo || []))
        }
        setWorkOrders(all)
      }
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium">维修工单 ({workOrders.length})</h3>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setShowNewRecord(true)}>
            <Plus className="mr-2 h-4 w-4" />
            新建维修记录
          </Button>
          <Button size="sm" onClick={() => setShowCreate(true)}>
            <Plus className="mr-2 h-4 w-4" />
            创建工单
          </Button>
        </div>
      </div>

      {showNewRecord && (
        <Card className="mb-4">
          <CardContent className="pt-4 space-y-3">
            <div>
              <label className="text-sm font-medium">维修类型</label>
              <select
                className="mt-1 w-full rounded-md border border-input p-2 text-sm"
                value={newRecordForm.type}
                onChange={(e) => setNewRecordForm({ ...newRecordForm, type: e.target.value })}
              >
                <option value="水电">水电</option>
                <option value="家具">家具</option>
                <option value="家电">家电</option>
                <option value="装修">装修</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">问题描述</label>
              <textarea
                className="mt-1 w-full rounded-md border border-input p-2 text-sm"
                rows={3}
                value={newRecordForm.description}
                onChange={(e) => setNewRecordForm({ ...newRecordForm, description: e.target.value })}
                placeholder="请输入问题描述..."
              />
            </div>
            <div>
              <label className="text-sm font-medium">预估费用（元）</label>
              <Input
                className="mt-1"
                type="number"
                value={newRecordForm.cost}
                onChange={(e) => setNewRecordForm({ ...newRecordForm, cost: Number(e.target.value) })}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowNewRecord(false)}>取消</Button>
              <Button size="sm" onClick={handleCreateRecord} disabled={submitting}>
                {submitting ? '创建中...' : '确认创建'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {showCreate && (
        <Card className="mb-4">
          <CardContent className="pt-4 space-y-3">
            <div>
              <label className="text-sm font-medium">关联维修记录</label>
              <select
                className="mt-1 w-full rounded-md border border-input p-2 text-sm"
                value={form.recordId}
                onChange={(e) => setForm({ ...form, recordId: e.target.value })}
              >
                <option value="">请选择</option>
                {records.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.type} - {r.description?.substring(0, 20)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">分派给</label>
              <select
                className="mt-1 w-full rounded-md border border-input p-2 text-sm"
                value={form.workerId}
                onChange={(e) => setForm({ ...form, workerId: e.target.value })}
              >
                <option value="">请选择</option>
                {workers.map((w) => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">优先级</label>
              <select
                className="mt-1 w-full rounded-md border border-input p-2 text-sm"
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
              >
                <option value="LOW">低</option>
                <option value="MEDIUM">中</option>
                <option value="HIGH">高</option>
                <option value="URGENT">紧急</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">问题描述</label>
              <textarea
                className="mt-1 w-full rounded-md border border-input p-2 text-sm"
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="请输入工单描述..."
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowCreate(false)}>取消</Button>
              <Button size="sm" onClick={handleCreateWorkOrder} disabled={submitting || !form.recordId || !form.workerId}>
                {submitting ? '创建中...' : '确认创建'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {workOrders.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">暂无维修工单</div>
      ) : (
        <div className="space-y-3">
          {workOrders.map((wo: any) => (
            <div key={wo.id} className="p-4 rounded-lg border bg-background">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      wo.status === 'COMPLETED' ? 'bg-green-100 text-green-600' :
                      wo.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-600' :
                      'bg-yellow-100 text-yellow-600'
                    }`}>
                      {wo.status === 'COMPLETED' ? '已完成' : wo.status === 'IN_PROGRESS' ? '处理中' : '待处理'}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-xs ${
                      wo.priority === 'URGENT' ? 'bg-red-100 text-red-600' :
                      wo.priority === 'HIGH' ? 'bg-orange-100 text-orange-600' :
                      wo.priority === 'MEDIUM' ? 'bg-blue-100 text-blue-600' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {wo.priority === 'URGENT' ? '紧急' : wo.priority === 'HIGH' ? '高' : wo.priority === 'MEDIUM' ? '中' : '低'}
                    </span>
                  </div>
                  <p className="font-medium mt-2 text-sm">{wo.description || '维修工单'}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    维修员：{wo.worker?.name || '未分派'} · 创建：{formatDate(wo.createdAt)}
                  </p>
                  {wo.solution && (
                    <p className="text-xs mt-2 bg-muted/50 p-2 rounded">
                      解决方案：{wo.solution}
                    </p>
                  )}
                  {wo.cost != null && (
                    <p className="text-xs text-muted-foreground mt-1">
                      费用：¥{wo.cost}
                    </p>
                  )}
                </div>
                {wo.status !== 'COMPLETED' && (
                  <Button size="sm" onClick={() => handleCompleteWorkOrder(wo.id)}>
                    完成
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function UtilityReadingsTab({ task, onUpdate }: { task: any; onUpdate?: () => void }) {
  const [readings, setReadings] = useState<any[]>([])
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState<any>({
    type: 'ELECTRIC',
    reading: 0,
    previousReading: 0,
    readingDate: new Date().toISOString().split('T')[0],
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (task.propertyId) {
          const result: any = await utilitiesApi.getPropertyReadings(task.propertyId, { pageSize: 50 })
          setReadings(result.list || result || [])
        }
      } catch (e) {
        console.error(e)
      }
    }
    fetchData()
  }, [task.propertyId])

  const handleCreate = async () => {
    if (!task.propertyId || !form.reading) return
    setSubmitting(true)
    try {
      const usage = Math.max(0, form.reading - form.previousReading)
      await utilitiesApi.createReading({
        ...form,
        propertyId: task.propertyId,
        usage,
      })
      setShowCreate(false)
      setForm({ type: 'ELECTRIC', reading: 0, previousReading: 0, readingDate: new Date().toISOString().split('T')[0] })
      const result: any = await utilitiesApi.getPropertyReadings(task.propertyId, { pageSize: 50 })
      setReadings(result.list || result || [])
      onUpdate?.()
    } catch (e) {
      console.error(e)
      alert('录入失败')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium">水电读数 ({readings.length})</h3>
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <Plus className="mr-2 h-4 w-4" />
          录入读数
        </Button>
      </div>

      {showCreate && (
        <Card className="mb-4">
          <CardContent className="pt-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">类型</label>
                <select
                  className="mt-1 w-full rounded-md border border-input p-2 text-sm"
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                >
                  <option value="ELECTRIC">电表</option>
                  <option value="WATER">水表</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">抄表日期</label>
                <Input
                  className="mt-1"
                  type="date"
                  value={form.readingDate}
                  onChange={(e) => setForm({ ...form, readingDate: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">上次读数</label>
                <Input
                  className="mt-1"
                  type="number"
                  value={form.previousReading}
                  onChange={(e) => setForm({ ...form, previousReading: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">本次读数</label>
                <Input
                  className="mt-1"
                  type="number"
                  value={form.reading}
                  onChange={(e) => setForm({ ...form, reading: Number(e.target.value) })}
                />
              </div>
            </div>
            <div className="text-xs text-muted-foreground">
              预计用量：{Math.max(0, form.reading - form.previousReading)} {form.type === 'ELECTRIC' ? '度' : '吨'}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowCreate(false)}>取消</Button>
              <Button size="sm" onClick={handleCreate} disabled={submitting || !form.reading}>
                {submitting ? '录入中...' : '确认录入'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {readings.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">暂无水电读数</div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {readings.map((r: any) => (
            <div key={r.id} className="p-4 rounded-lg border bg-background">
              <div className="flex items-center justify-between">
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                  r.type === 'ELECTRIC' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'
                }`}>
                  {r.type === 'ELECTRIC' ? '电表' : '水表'}
                </span>
                <span className="text-xs text-muted-foreground">{formatDate(r.readingDate)}</span>
              </div>
              <p className="text-2xl font-bold mt-2">
                {r.reading}
                <span className="text-sm font-normal text-muted-foreground ml-1">
                  {r.type === 'ELECTRIC' ? '度' : '吨'}
                </span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                用量：{r.usage} · 上次：{r.previousReading}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function FinanceRecordsTab({ task, onUpdate }: { task: any; onUpdate?: () => void }) {
  const [records, setRecords] = useState<any[]>([])
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState<any>({
    type: 'RENT',
    direction: 'INCOME',
    amount: 0,
    status: 'PENDING',
    dueDate: new Date().toISOString().split('T')[0],
    remark: '',
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (task.propertyId) {
          const params: any = { propertyId: task.propertyId, pageSize: 50 }
          if (task.tenantId) params.tenantId = task.tenantId
          if (task.contractId) params.contractId = task.contractId
          const result: any = await financeApi.getRecords(params)
          setRecords(result.list || result || [])
        }
      } catch (e) {
        console.error(e)
      }
    }
    fetchData()
  }, [task.propertyId, task.tenantId, task.contractId])

  const handleCreate = async () => {
    if (!task.propertyId || !form.amount) return
    setSubmitting(true)
    try {
      const recordNo = `FIN${Date.now()}`
      const data: any = {
        ...form,
        recordNo,
        propertyId: task.propertyId,
      }
      if (task.tenantId) data.tenantId = task.tenantId
      if (task.contractId) data.contractId = task.contractId
      await financeApi.createRecord(data)
      setShowCreate(false)
      setForm({ type: 'RENT', direction: 'INCOME', amount: 0, status: 'PENDING', dueDate: new Date().toISOString().split('T')[0], remark: '' })
      const params: any = { propertyId: task.propertyId, pageSize: 50 }
      if (task.tenantId) params.tenantId = task.tenantId
      if (task.contractId) params.contractId = task.contractId
      const result: any = await financeApi.getRecords(params)
      setRecords(result.list || result || [])
      onUpdate?.()
    } catch (e) {
      console.error(e)
      alert('生成失败')
    } finally {
      setSubmitting(false)
    }
  }

  const handleMarkPaid = async (id: string) => {
    try {
      await financeApi.markPaid(id)
      onUpdate?.()
      const params: any = { propertyId: task.propertyId, pageSize: 50 }
      if (task.tenantId) params.tenantId = task.tenantId
      if (task.contractId) params.contractId = task.contractId
      const result: any = await financeApi.getRecords(params)
      setRecords(result.list || result || [])
    } catch (e) {
      console.error(e)
    }
  }

  const typeLabels: Record<string, string> = {
    RENT: '租金',
    MAINTENANCE_FEE: '维修费',
    UTILITY_FEE: '水电费',
    DEPOSIT: '押金',
    OTHER: '其他',
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium">财务记录 ({records.length})</h3>
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <Plus className="mr-2 h-4 w-4" />
          生成记录
        </Button>
      </div>

      {showCreate && (
        <Card className="mb-4">
          <CardContent className="pt-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">类型</label>
                <select
                  className="mt-1 w-full rounded-md border border-input p-2 text-sm"
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                >
                  <option value="RENT">租金</option>
                  <option value="MAINTENANCE_FEE">维修费</option>
                  <option value="UTILITY_FEE">水电费</option>
                  <option value="DEPOSIT">押金</option>
                  <option value="OTHER">其他</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">方向</label>
                <select
                  className="mt-1 w-full rounded-md border border-input p-2 text-sm"
                  value={form.direction}
                  onChange={(e) => setForm({ ...form, direction: e.target.value })}
                >
                  <option value="INCOME">收入</option>
                  <option value="EXPENSE">支出</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">金额（元）</label>
                <Input
                  className="mt-1"
                  type="number"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">状态</label>
                <select
                  className="mt-1 w-full rounded-md border border-input p-2 text-sm"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                >
                  <option value="PENDING">待收款</option>
                  <option value="PAID">已收款</option>
                  <option value="OVERDUE">逾期</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">应收/应付日期</label>
              <Input
                className="mt-1"
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium">备注</label>
              <Input
                className="mt-1"
                value={form.remark}
                onChange={(e) => setForm({ ...form, remark: e.target.value })}
                placeholder="请输入备注..."
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowCreate(false)}>取消</Button>
              <Button size="sm" onClick={handleCreate} disabled={submitting || !form.amount}>
                {submitting ? '生成中...' : '确认生成'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {records.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">暂无财务记录</div>
      ) : (
        <div className="space-y-3">
          {records.map((r: any) => (
            <div key={r.id} className="p-4 rounded-lg border bg-background flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    r.direction === 'INCOME' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                  }`}>
                    {r.direction === 'INCOME' ? '收入' : '支出'}
                  </span>
                  <span className="text-xs text-muted-foreground">{r.recordNo}</span>
                </div>
                <p className="text-lg font-bold mt-1">
                  {r.direction === 'INCOME' ? '+' : '-'}¥{r.amount}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {typeLabels[r.type] || r.type} · {r.remark || ''} · 截止：{formatDate(r.dueDate)}
                </p>
              </div>
              <div className="text-right">
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  r.status === 'PAID' ? 'bg-green-100 text-green-600' :
                  r.status === 'OVERDUE' ? 'bg-red-100 text-red-600' :
                  'bg-yellow-100 text-yellow-600'
                }`}>
                  {r.status === 'PAID' ? '已收款' : r.status === 'OVERDUE' ? '逾期' : '待收款'}
                </span>
                {r.status !== 'PAID' && r.direction === 'INCOME' && (
                  <Button size="sm" variant="outline" className="mt-2" onClick={() => handleMarkPaid(r.id)}>
                    标记已收
                  </Button>
                )}
              </div>
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

function TaskSidebar({ task, onUpdate, onSwitchTab }: { task: any; onUpdate: () => void; onSwitchTab?: (tab: string) => void }) {
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
          <Button size="sm" variant="outline" className="w-full justify-start" onClick={() => onSwitchTab?.('maintenance')}>
            <Plus className="mr-2 h-4 w-4" />
            创建维修工单
          </Button>
          <Button size="sm" variant="outline" className="w-full justify-start" onClick={() => onSwitchTab?.('utilities')}>
            <Plus className="mr-2 h-4 w-4" />
            录入水电读数
          </Button>
          <Button size="sm" variant="outline" className="w-full justify-start" onClick={() => onSwitchTab?.('finance')}>
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
