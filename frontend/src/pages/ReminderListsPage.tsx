import { useState } from 'react'
import {
  App, Button, Card, Col, Descriptions, Drawer, Form, Input, List, Modal,
  Popconfirm, Row, Select, Space, Switch, Table, Tag, Typography,
} from 'antd'
import {
  PlusOutlined, EditOutlined, DeleteOutlined, HistoryOutlined,
  TeamOutlined, ReloadOutlined, SearchOutlined,
} from '@ant-design/icons'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { masterDataApi, reminderListApi } from '../services/api'
import { ReminderList, ReminderListItem, ReminderListChangeLog } from '../types'

const { Option } = Select
const { TextArea } = Input
const { Text } = Typography

function ReminderListsPage() {
  const { message } = App.useApp()
  const queryClient = useQueryClient()
  const [keyword, setKeyword] = useState('')
  const [editVisible, setEditVisible] = useState(false)
  const [selected, setSelected] = useState<ReminderList | null>(null)
  const [editMode, setEditMode] = useState<'create' | 'edit'>('create')
  const [editForm] = Form.useForm()
  const [changeLogsOpen, setChangeLogsOpen] = useState(false)
  const [currentLogList, setCurrentLogList] = useState<ReminderListChangeLog[]>([])
  const [changeLogsLoading, setChangeLogsLoading] = useState(false)

  const query = useQuery({
    queryKey: ['reminder-lists', keyword],
    queryFn: () => reminderListApi.getLists({
      searchKeyword: keyword,
      pageIndex: 1,
      pageSize: 100,
    }).catch(() => ({ items: [], totalCount: 0, pageIndex: 1, pageSize: 100, totalPages: 0 })),
  })

  const spotsQuery = useQuery({
    queryKey: ['scenic-spots'],
    queryFn: () => masterDataApi.getScenicSpots().catch(() => []),
  })

  const saveMutation = useMutation({
    mutationFn: (data: any) => {
      const payload = {
        ...data,
        items: (data.items || []).map((item: any, idx: number) => ({
          ...item,
          sortOrder: idx + 1,
        })),
        changeReason: editMode === 'create' ? '创建名单' : '更新名单',
        changedBy: '运营管理员',
      }
      if (editMode === 'create') {
        return reminderListApi.createList(payload)
      }
      return reminderListApi.updateList(selected!.id, payload)
    },
    onSuccess: () => {
      message.success(editMode === 'create' ? '创建成功' : '更新成功，变更已记录审计日志')
      setEditVisible(false)
      editForm.resetFields()
      queryClient.invalidateQueries({ queryKey: ['reminder-lists'] })
    },
    onError: () => message.error('保存失败'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => reminderListApi.deleteList(id),
    onSuccess: () => {
      message.success('已删除')
      queryClient.invalidateQueries({ queryKey: ['reminder-lists'] })
    },
    onError: () => message.error('删除失败'),
  })

  const openEdit = (record?: ReminderList) => {
    setEditMode(record ? 'edit' : 'create')
    setSelected(record || null)
    if (record) {
      editForm.setFieldsValue({
        name: record.name,
        description: record.description,
        scenicSpotId: record.scenicSpotId,
        isActive: record.isActive,
        items: record.items.map((i) => ({ ...i })),
      })
    } else {
      editForm.resetFields()
      editForm.setFieldsValue({ isActive: true, items: [] })
    }
    setEditVisible(true)
  }

  const openChangeLogs = async (record: ReminderList) => {
    setSelected(record)
    setChangeLogsLoading(true)
    setChangeLogsOpen(true)
    try {
      const result = await reminderListApi.getChangeLogs(record.id, { pageIndex: 1, pageSize: 200 })
      setCurrentLogList(result.items || [])
    } catch {
      setCurrentLogList([])
      message.warning('获取变更记录失败')
    } finally {
      setChangeLogsLoading(false)
    }
  }

  const data = query.data?.items || []
  const spots = spotsQuery.data || []

  const renderChangeLogDetail = (log: ReminderListChangeLog) => {
    const oldVals = log.oldValues || (log.oldValue ? { value: log.oldValue } : null)
    const newVals = log.newValues || (log.newValue ? { value: log.newValue } : null)
    return (
      <div style={{ padding: '8px 0' }}>
        <div style={{ marginBottom: 8 }}>
          <Tag color="blue">{log.changeType}</Tag>
          <Text strong>{log.fieldName}</Text>
          {log.changeReason && <Text type="secondary" style={{ marginLeft: 8 }}>· {log.changeReason}</Text>}
        </div>
        <div style={{ marginBottom: 8, color: '#666' }}>
          操作人：{log.changedBy} · 时间：{dayjs(log.changedAt).format('YYYY-MM-DD HH:mm:ss')}
        </div>
        {oldVals || newVals ? (
          <div className="change-log-compare">
            <div className="old-values">
              <Text strong style={{ color: '#cf1322', display: 'block', marginBottom: 4 }}>变更前</Text>
              <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all', margin: 0, fontSize: 12 }}>
                {oldVals ? JSON.stringify(oldVals, null, 2) : '<无>'}
              </pre>
            </div>
            <div className="new-values">
              <Text strong style={{ color: '#389e0d', display: 'block', marginBottom: 4 }}>变更后</Text>
              <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all', margin: 0, fontSize: 12 }}>
                {newVals ? JSON.stringify(newVals, null, 2) : '<已删除>'}
              </pre>
            </div>
          </div>
        ) : (
          <div className="change-log-compare">
            <div className="old-values" style={{ flex: 1 }}>
              <Text strong style={{ color: '#cf1322' }}>旧值：</Text>
              <span style={{ marginLeft: 6 }}>{log.oldValue || '<无>'}</span>
            </div>
            <div className="new-values" style={{ flex: 1 }}>
              <Text strong style={{ color: '#389e0d' }}>新值：</Text>
              <span style={{ marginLeft: 6 }}>{log.newValue || '<已删除>'}</span>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div style={{ padding: 24 }}>
      <Card className="page-container" style={{ marginBottom: 16 }}>
        <Space wrap>
          <Input.Search
            placeholder="搜索名单名称"
            allowClear
            style={{ width: 260 }}
            onSearch={(v) => setKeyword(v)}
          />
          <Button icon={<SearchOutlined />} onClick={() => queryClient.invalidateQueries({ queryKey: ['reminder-lists'] })}>查询</Button>
          <Button icon={<ReloadOutlined />} onClick={() => { setKeyword(''); queryClient.invalidateQueries({ queryKey: ['reminder-lists'] }) }}>重置</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => openEdit()}>新建名单</Button>
        </Space>
      </Card>

      <Card className="page-container">
        <Row gutter={[16, 16]}>
          {data.length === 0 && !query.isLoading ? (
            <Col span={24}>
              <div style={{ textAlign: 'center', padding: 60, color: '#999' }}>
                <TeamOutlined style={{ fontSize: 64, opacity: 0.2 }} />
                <div style={{ marginTop: 12 }}>暂无提醒名单，点击右上角「新建名单」创建</div>
              </div>
            </Col>
          ) : data.map((list) => (
            <Col xs={24} lg={12} xl={8} key={list.id}>
              <Card
                hoverable
                size="small"
                title={
                  <Space>
                    <Tag color={list.isActive ? 'green' : 'default'}>
                      {list.isActive ? '启用' : '停用'}
                    </Tag>
                    <span style={{ fontSize: 14, fontWeight: 600 }}>{list.name}</span>
                  </Space>
                }
                extra={
                  <Space size={2}>
                    <Button type="text" size="small" icon={<HistoryOutlined />} title="变更日志"
                      onClick={() => openChangeLogs(list)} />
                    <Button type="text" size="small" icon={<EditOutlined />} title="编辑"
                      onClick={() => openEdit(list)} />
                    <Popconfirm title="确定删除该名单？" onConfirm={() => deleteMutation.mutate(list.id)}>
                      <Button type="text" size="small" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                  </Space>
                }
                style={{ marginBottom: 0 }}
              >
                <Descriptions size="small" column={1} style={{ marginBottom: 12 }}>
                  {list.scenicSpotName && (
                    <Descriptions.Item label="关联景区">{list.scenicSpotName}</Descriptions.Item>
                  )}
                  {list.description && (
                    <Descriptions.Item label="说明" labelStyle={{ width: 64 }}>{list.description}</Descriptions.Item>
                  )}
                  <Descriptions.Item label="成员数" labelStyle={{ width: 64 }}>
                    {list.items.length} 人
                  </Descriptions.Item>
                </Descriptions>
                <List
                  size="small"
                  header={<Text type="secondary" style={{ fontSize: 12 }}>成员列表</Text>}
                  bordered
                  dataSource={list.items}
                  locale={{ emptyText: '暂无成员' }}
                  renderItem={(item: ReminderListItem) => (
                    <List.Item
                      style={{
                        padding: '8px 12px',
                        opacity: item.isActive ? 1 : 0.4,
                      }}
                      key={item.id}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600 }}>
                          {item.personName}
                          {item.role && <Tag color="blue" style={{ marginLeft: 6 }}>{item.role}</Tag>}
                          {!item.isActive && <Tag color="default">已停用</Tag>}
                        </div>
                        <div style={{ fontSize: 12, color: '#666' }}>
                          {item.phoneNumber && <span>📱 {item.phoneNumber} </span>}
                          {item.email && <span>✉️ {item.email}</span>}
                        </div>
                      </div>
                      <div style={{ fontSize: 12 }}>
                        {item.receiveConflictNotifications && <Tag color="red">冲突通知</Tag>}
                        {item.receiveDailySummary && <Tag color="blue">日报</Tag>}
                        {item.receiveMonthlyReport && <Tag color="green">月报</Tag>}
                      </div>
                    </List.Item>
                  )}
                />
              </Card>
            </Col>
          ))}
        </Row>
      </Card>

      <Modal
        title={editMode === 'create' ? '新建提醒名单' : `编辑：${selected?.name}`}
        open={editVisible}
        onCancel={() => setEditVisible(false)}
        onOk={editForm.submit}
        confirmLoading={saveMutation.isPending}
        width={800}
        destroyOnClose
      >
        <Form form={editForm} layout="vertical" onFinish={(v) => saveMutation.mutate(v)}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="名单名称" name="name" rules={[{ required: true, message: '请输入名称' }]}>
                <Input placeholder="例如：西湖景区冲突处理组" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="关联景区" name="scenicSpotId">
                <Select allowClear placeholder="不绑定特定景区（全局）">
                  {spots.map((s) => <Option key={s.id} value={s.id}>{s.name}</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="是否启用" name="isActive" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item label="说明" name="description">
                <TextArea rows={2} placeholder="名单用途说明" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.List
                name="items"
                rules={[{ validator: async (_, items) => {
                  if (!items || items.length === 0) return Promise.reject('至少添加1个成员')
                } }]}
              >
                {(fields, { add, remove }, { errors }) => (
                  <div>
                    <Space style={{ marginBottom: 12 }}>
                      <Button
                        type="dashed"
                        icon={<PlusOutlined />}
                        onClick={() => add({
                          isActive: true,
                          receiveConflictNotifications: true,
                          receiveDailySummary: false,
                          receiveMonthlyReport: true,
                          sortOrder: 0,
                        })}
                      >
                        添加成员
                      </Button>
                      <Text type="danger" style={{ fontSize: 12 }}>修改字段、增减成员都会被写入审计日志</Text>
                    </Space>
                    {fields.map(({ key, name, ...restField }) => {
                      const current = editForm.getFieldValue('items')?.[name] || {}
                      return (
                        <Card
                          key={key}
                          size="small"
                          style={{ marginBottom: 12, background: '#fafafa' }}
                          extra={
                            <Popconfirm title="确定删除该成员？" onConfirm={() => remove(name)}>
                              <Button type="text" danger size="small" icon={<DeleteOutlined />} />
                            </Popconfirm>
                          }
                          title={`成员 ${name + 1}`}
                        >
                          <Row gutter={12}>
                            <Col xs={24} sm={12}>
                              <Form.Item {...restField} name={[name, 'personName']} label="姓名"
                                rules={[{ required: true, message: '请输入姓名' }]}>
                                <Input placeholder="姓名" />
                              </Form.Item>
                            </Col>
                            <Col xs={24} sm={12}>
                              <Form.Item {...restField} name={[name, 'role']} label="角色">
                                <Input placeholder="例如：运营主管" />
                              </Form.Item>
                            </Col>
                            <Col xs={24} sm={12}>
                              <Form.Item {...restField} name={[name, 'phoneNumber']} label="手机号">
                                <Input placeholder="11位手机号，用于短信通知" maxLength={11} />
                              </Form.Item>
                            </Col>
                            <Col xs={24} sm={12}>
                              <Form.Item {...restField} name={[name, 'email']} label="邮箱">
                                <Input placeholder="用于邮件通知" />
                              </Form.Item>
                            </Col>
                            <Col xs={24} sm={8}>
                              <Form.Item {...restField} name={[name, 'receiveConflictNotifications']}
                                label="冲突通知" valuePropName="checked">
                                <Switch defaultChecked={current.receiveConflictNotifications} />
                              </Form.Item>
                            </Col>
                            <Col xs={24} sm={8}>
                              <Form.Item {...restField} name={[name, 'receiveDailySummary']}
                                label="接收日报" valuePropName="checked">
                                <Switch defaultChecked={!!current.receiveDailySummary} />
                              </Form.Item>
                            </Col>
                            <Col xs={24} sm={8}>
                              <Form.Item {...restField} name={[name, 'receiveMonthlyReport']}
                                label="接收月报" valuePropName="checked">
                                <Switch defaultChecked={!!current.receiveMonthlyReport} />
                              </Form.Item>
                            </Col>
                            <Col xs={24}>
                              <Form.Item {...restField} name={[name, 'isActive']} label="启用该成员" valuePropName="checked">
                                <Switch defaultChecked={!!(current.isActive ?? true)} />
                              </Form.Item>
                            </Col>
                          </Row>
                        </Card>
                      )
                    })}
                    <Form.ErrorList errors={errors} />
                  </div>
                )}
              </Form.List>
            </Col>
          </Row>
        </Form>
      </Modal>

      <Drawer
        title={
          <Space>
            <HistoryOutlined />
            {`「${selected?.name}」变更审计日志`}
          </Space>
        }
        open={changeLogsOpen}
        onClose={() => setChangeLogsOpen(false)}
        width={800}
      >
        {currentLogList.length === 0 && !changeLogsLoading ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#999' }}>
            <HistoryOutlined style={{ fontSize: 48, opacity: 0.2 }} />
            <div style={{ marginTop: 8 }}>暂无变更记录</div>
          </div>
        ) : (
          <List
            loading={changeLogsLoading}
            dataSource={currentLogList}
            locale={{ emptyText: '暂无变更记录' }}
            split
            renderItem={(log) => (
              <List.Item key={log.id} style={{ alignItems: 'flex-start', padding: '12px 0' }}>
                {renderChangeLogDetail(log)}
              </List.Item>
            )}
          />
        )}
      </Drawer>
    </div>
  )
}

export default ReminderListsPage
