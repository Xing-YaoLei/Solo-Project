import { Card, Row, Col, Statistic, List, Tag, Badge, Button, Empty, Checkbox } from 'antd';
import {
  WarningOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  AlertOutlined,
  RiseOutlined,
  ArrowRightOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { statisticsAPI, lossReportAPI, todoAPI } from '@/api';
import { useNavigate } from '@tanstack/react-router';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import {
  LossStatusMap,
  LossStatusColorMap,
  AbnormalTypeMap,
  type TodoItem,
  type LossReport,
} from '@/types';
import { useState } from 'react';
import dayjs from 'dayjs';

function Dashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showCompleted, setShowCompleted] = useState(false);

  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => statisticsAPI.getDashboard().then((res) => res.data),
  });

  const { data: todos, isLoading: todosLoading } = useQuery({
    queryKey: ['todos', showCompleted],
    queryFn: () =>
      todoAPI
        .getTodos({
          is_completed: showCompleted ? undefined : false,
          my_only: true,
        })
        .then((res) => res.data),
  });

  const { data: todoReports } = useQuery({
    queryKey: ['todoReports'],
    queryFn: () => lossReportAPI.getLossReports({ my_todo: true, limit: 5 }).then((res) => res.data),
  });

  const toggleTodoMutation = useMutation({
    mutationFn: (id: number) => todoAPI.toggleTodo(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    },
  });

  const handleTodoClick = (todo: TodoItem) => {
    navigate({
      to: '/loss-reports/$id',
      params: { id: todo.loss_report_id.toString() },
    });
  };

  const handleTodoToggle = (e: React.MouseEvent, todo: TodoItem) => {
    e.stopPropagation();
    toggleTodoMutation.mutate(todo.id);
  };

  if (isLoading) {
    return <div className="text-center py-12">加载中...</div>;
  }

  const statCards = [
    {
      title: '今日报损金额',
      value: dashboard?.today_loss_amount || 0,
      suffix: '元',
      icon: <FileTextOutlined className="text-blue-500" />,
      color: 'blue',
    },
    {
      title: '今日报损单数',
      value: dashboard?.today_report_count || 0,
      suffix: '单',
      icon: <AlertOutlined className="text-green-500" />,
      color: 'green',
    },
    {
      title: '待复核',
      value: dashboard?.pending_review_count || 0,
      suffix: '单',
      icon: <ClockCircleOutlined className="text-orange-500" />,
      color: 'orange',
    },
    {
      title: '待审批',
      value: dashboard?.pending_approval_count || 0,
      suffix: '单',
      icon: <ClockCircleOutlined className="text-purple-500" />,
      color: 'purple',
    },
    {
      title: '异常提醒',
      value: dashboard?.abnormal_count || 0,
      suffix: '单',
      icon: <WarningOutlined className="text-red-500" />,
      color: 'red',
    },
    {
      title: '本月损耗率',
      value: dashboard?.month_loss_rate || 0,
      suffix: '%',
      icon: <RiseOutlined className="text-coffee-600" />,
      color: 'coffee',
      precision: 2,
    },
  ];

  return (
    <div className="space-y-6">
      <Row gutter={[16, 16]}>
        {statCards.map((stat, index) => (
          <Col xs={24} sm={12} lg={8} xl={4} key={index}>
            <Card className="hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-gray-500 text-sm mb-1">{stat.title}</p>
                  <Statistic
                    value={stat.value}
                    suffix={stat.suffix}
                    precision={(stat as any).precision}
                    valueStyle={{ color: '#333', fontSize: '24px' }}
                  />
                </div>
                <div className="text-2xl">{stat.icon}</div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card
            title="近7天损耗趋势"
            extra={
              <Button type="link" onClick={() => navigate({ to: '/statistics' })}>
                查看详情 <ArrowRightOutlined />
              </Button>
            }
          >
            <div style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dashboard?.loss_trend || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="loss_amount"
                    stroke="#977669"
                    strokeWidth={2}
                    name="损耗金额(元)"
                    dot={{ fill: '#977669' }}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="loss_rate"
                    stroke="#f5222d"
                    strokeWidth={2}
                    name="损耗率(%)"
                    dot={{ fill: '#f5222d' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card
            title={
              <div className="flex items-center justify-between">
                <span>我的待办 ({todos?.filter((t) => !t.is_completed).length || 0})</span>
                <Checkbox
                  checked={showCompleted}
                  onChange={(e) => setShowCompleted(e.target.checked)}
                  className="text-sm"
                >
                  显示已完成
                </Checkbox>
              </div>
            }
            extra={
              <Button
                type="link"
                onClick={() => navigate({ to: '/loss-reports', search: { my_todo: 'true' } })}
              >
                全部 <ArrowRightOutlined />
              </Button>
            }
          >
            {todosLoading ? (
              <div className="text-center py-8">加载中...</div>
            ) : todos && todos.length > 0 ? (
              <List
                dataSource={todos}
                renderItem={(item) => (
                  <List.Item
                    className={`cursor-pointer hover:bg-gray-50 px-2 rounded ${item.is_completed ? 'opacity-60' : ''}`}
                    onClick={() => handleTodoClick(item)}
                  >
                    <List.Item.Meta
                      avatar={
                        <Checkbox
                          checked={item.is_completed}
                          onClick={(e) => handleTodoToggle(e as any, item)}
                          className="mt-1"
                        />
                      }
                      title={
                        <div className="flex items-center justify-between">
                          <span className={`font-medium ${item.is_completed ? 'line-through text-gray-400' : ''}`}>
                            {item.title}
                          </span>
                          {!item.is_completed && (
                            <Tag color="orange" className="ml-2">
                              <ClockCircleOutlined /> 待处理
                            </Tag>
                          )}
                          {item.is_completed && (
                            <Tag color="green" className="ml-2">
                              <CheckCircleOutlined /> 已完成
                            </Tag>
                          )}
                        </div>
                      }
                      description={
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">
                            报损单: {item.loss_report_no || item.loss_report_id}
                          </span>
                          <span className="text-gray-400">
                            {dayjs(item.created_at).format('MM-DD HH:mm')}
                          </span>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            ) : (
              <Empty description="暂无待办事项" />
            )}

            {!showCompleted && todoReports && todoReports.length > 0 && todos?.length === 0 && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-sm text-gray-500 mb-3">关联待处理报损单：</p>
                <List
                  dataSource={todoReports}
                  size="small"
                  renderItem={(item: LossReport) => (
                    <List.Item
                      className="cursor-pointer hover:bg-gray-50 px-2 rounded"
                      onClick={() =>
                        navigate({ to: '/loss-reports/$id', params: { id: item.id.toString() } })
                      }
                    >
                      <List.Item.Meta
                        title={
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-sm">{item.title}</span>
                            <Tag color={LossStatusColorMap[item.status]} className="ml-2">
                              {LossStatusMap[item.status]}
                            </Tag>
                          </div>
                        }
                        description={
                          <div className="flex items-center justify-between text-xs">
                            <span>{item.report_no}</span>
                            {item.is_abnormal && (
                              <Badge status="error" text={AbnormalTypeMap[item.abnormal_type!]} />
                            )}
                          </div>
                        }
                      />
                    </List.Item>
                  )}
                />
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {dashboard?.store_ranking && dashboard.store_ranking.length > 0 && (
        <Card
          title="门店损耗率排名（本月）"
          extra={
            <Button type="link" onClick={() => navigate({ to: '/statistics' })}>
              查看详情 <ArrowRightOutlined />
            </Button>
          }
        >
          <Row gutter={[16, 16]}>
            {dashboard.store_ranking.slice(0, 5).map((store, index) => (
              <Col xs={24} sm={12} lg={8} xl={4} key={store.store_id}>
                <Card
                  size="small"
                  className={index === 0 ? 'border-2 border-red-200 bg-red-50' : ''}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                        index === 0
                          ? 'bg-red-500'
                          : index === 1
                          ? 'bg-orange-500'
                          : index === 2
                          ? 'bg-yellow-500'
                          : 'bg-gray-400'
                      }`}
                    >
                      {index + 1}
                    </span>
                    <span className="font-medium">{store.store_name}</span>
                  </div>
                  <p className="text-xl font-bold text-red-500">{store.loss_rate}%</p>
                  <p className="text-sm text-gray-500">损耗金额：¥{store.loss_amount.toFixed(2)}</p>
                </Card>
              </Col>
            ))}
          </Row>
        </Card>
      )}
    </div>
  );
}

export default Dashboard;
