import React from 'react';
import { Row, Col, Card, Statistic, Progress, List, Tag, Empty } from 'antd';
import {
  BookOutlined,
  UserOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  RiseOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { courseApi, notificationApi, progressApi } from '@/api';
import { getCourseStatusColor, getCourseStatusText, formatDateTime, getNotificationStatusColor, getNotificationStatusText } from '@/utils';
import { useNavigate } from '@tanstack/react-router';
import { useAuthStore } from '@/store/auth';

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const { data: courses = [] } = useQuery({
    queryKey: ['courses'],
    queryFn: () => courseApi.list(),
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationApi.list({ limit: 5 }),
  });

  const { data: progressList = [] } = useQuery({
    queryKey: ['progress'],
    queryFn: () => progressApi.list({ limit: 10 }),
  });

  const inProgressCount = courses.filter((c) => c.status === 'in_progress').length;
  const completedCount = courses.filter((c) => c.status === 'completed').length;
  const behindCount = notifications.filter((n) => n.status === 'pending').length;
  const avgCompletion =
    courses.length > 0
      ? Math.round(courses.reduce((acc, c) => acc + c.completion_rate, 0) / courses.length)
      : 0;

  return (
    <div>
      <h2 style={{ marginTop: 0, marginBottom: 24 }}>
        👋 欢迎回来，{user?.full_name}
      </h2>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="课程总数"
              value={courses.length}
              prefix={<BookOutlined style={{ color: '#3b82f6' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="进行中课程"
              value={inProgressCount}
              prefix={<TeamOutlined style={{ color: '#16a34a' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="已完成课程"
              value={completedCount}
              prefix={<CheckCircleOutlined style={{ color: '#8b5cf6' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="待处理通知"
              value={behindCount}
              prefix={<WarningOutlined style={{ color: '#dc2626' }} />}
              valueStyle={{ color: behindCount > 0 ? '#dc2626' : undefined }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} md={10}>
          <Card title="整体完成率" extra={<RiseOutlined style={{ color: '#16a34a' }} />}>
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <Progress
                type="dashboard"
                percent={avgCompletion}
                size={180}
                strokeColor={avgCompletion >= 80 ? '#16a34a' : avgCompletion >= 50 ? '#f59e0b' : '#dc2626'}
              />
            </div>
          </Card>
        </Col>
        <Col xs={24} md={14}>
          <Card
            title="最近通知"
            extra={<a onClick={() => navigate({ to: '/notifications' })}>查看全部</a>}
          >
            {notifications.length === 0 ? (
              <Empty description="暂无通知" />
            ) : (
              <List
                dataSource={notifications.slice(0, 5)}
                renderItem={(item) => (
                  <List.Item
                    onClick={() => navigate({ to: '/notifications' })}
                    style={{ cursor: 'pointer' }}
                  >
                    <List.Item.Meta
                      title={
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span>{item.title}</span>
                          <Tag color={getNotificationStatusColor(item.status) as any}>
                            {getNotificationStatusText(item.status)}
                          </Tag>
                        </div>
                      }
                      description={
                        <div>
                          <div style={{ fontSize: 13, color: '#666', marginBottom: 4 }}>
                            {item.content.substring(0, 60)}...
                          </div>
                          <div style={{ fontSize: 12, color: '#999' }}>
                            {formatDateTime(item.created_at)}
                          </div>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>
      </Row>

      <Card
        title="课程概览"
        extra={<a onClick={() => navigate({ to: '/courses' })}>管理课程</a>}
      >
        {courses.length === 0 ? (
          <Empty description="暂无课程，去创建一个吧" />
        ) : (
          <Row gutter={[16, 16]}>
            {courses.slice(0, 8).map((course) => (
              <Col xs={24} sm={12} md={8} lg={6} key={course.id}>
                <Card
                  hoverable
                  onClick={() => navigate({ to: `/courses/${course.id}` })}
                  size="small"
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 8 }}>
                    <div style={{ fontWeight: 500, fontSize: 14 }}>{course.name}</div>
                    <Tag color={getCourseStatusColor(course.status) as any} style={{ margin: 0 }}>
                      {getCourseStatusText(course.status)}
                    </Tag>
                  </div>
                  <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>
                    <UserOutlined /> {course.trainer_name} · {course.member_count}人
                  </div>
                  <Progress
                    percent={Math.round(course.completion_rate)}
                    size="small"
                    strokeColor={course.completion_rate >= 80 ? '#16a34a' : course.completion_rate >= 50 ? '#f59e0b' : '#dc2626'}
                  />
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </Card>
    </div>
  );
};

export default DashboardPage;
