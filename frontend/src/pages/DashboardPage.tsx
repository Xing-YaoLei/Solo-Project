import { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Progress, List, Tag, Space, Button } from 'antd';
import {
  BookOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  BellOutlined,
  TrophyOutlined,
  ArrowUpOutlined,
} from '@ant-design/icons';
import type { ProgressAlert, LearningProgress } from '../types';
import { Link } from 'react-router-dom';
import dayjs from 'dayjs';

const mockAlerts: ProgressAlert[] = [
  {
    id: 1,
    learningProgressId: 1,
    userId: 3,
    userName: '李学员',
    certificateName: '一级建造师',
    courseName: '建设工程经济',
    alertType: 1,
    alertTypeText: '进度落后',
    severity: 2,
    severityText: '中',
    currentRate: 35.5,
    expectedRate: 50,
    behindRate: 14.5,
    message: '学习进度落后14.5%，当前35.5%，预期50%',
    status: 0,
    statusText: '待处理',
    createdAt: '2025-05-20T00:00:00Z',
  },
];

const mockProgressList: LearningProgress[] = [
  {
    id: 1,
    userId: 3,
    userName: '李学员',
    certificateId: 1,
    certificateName: '一级建造师',
    courseId: 1,
    courseName: '建设工程经济',
    completionRate: 35.5,
    targetRate: 60,
    startDate: '2025-03-01T00:00:00Z',
    targetDate: '2025-08-31T00:00:00Z',
    status: 3,
    statusText: '进度落后',
    note: '学习进度落后，需要加快节奏',
    createdAt: '2025-03-01T00:00:00Z',
    updatedAt: '2025-05-20T00:00:00Z',
  },
  {
    id: 2,
    userId: 3,
    userName: '李学员',
    certificateId: 1,
    certificateName: '一级建造师',
    courseId: 2,
    courseName: '建设工程项目管理',
    completionRate: 72,
    targetRate: 65,
    startDate: '2025-03-15T00:00:00Z',
    targetDate: '2025-08-31T00:00:00Z',
    status: 2,
    statusText: '正常推进',
    note: '进度良好',
    createdAt: '2025-03-15T00:00:00Z',
    updatedAt: '2025-05-15T00:00:00Z',
  },
];

function DashboardPage() {
  const [alertCount, setAlertCount] = useState(1);

  const getSeverityColor = (severity: number) => {
    switch (severity) {
      case 1: return 'blue';
      case 2: return 'orange';
      case 3: return 'red';
      case 4: return '#722ed1';
      default: return 'default';
    }
  };

  const getStatusColor = (status: number) => {
    switch (status) {
      case 0: return 'default';
      case 1: return 'processing';
      case 2: return 'success';
      case 3: return 'warning';
      case 4: return 'success';
      default: return 'default';
    }
  };

  return (
    <div>
      <h2 style={{ marginTop: 0 }}>工作台</h2>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="在学课程"
              value={mockProgressList.length}
              prefix={<BookOutlined />}
              valueStyle={{ color: '#1677ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="正常推进"
              value={mockProgressList.filter(p => p.status === 2).length}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="进度落后"
              value={mockProgressList.filter(p => p.status === 3).length}
              prefix={<WarningOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="待处理告警"
              value={alertCount}
              prefix={<BellOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={16}>
          <Card
            title="我的学习进度"
            extra={<Link to="/records">查看全部</Link>}
            style={{ marginBottom: 16 }}
          >
            <List
              dataSource={mockProgressList}
              renderItem={(item) => (
                <List.Item>
                  <div style={{ width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontWeight: 500 }}>
                        {item.certificateName} - {item.courseName}
                      </span>
                      <Tag color={getStatusColor(item.status)}>{item.statusText}</Tag>
                    </div>
                    <Progress percent={item.completionRate} status={item.status === 3 ? 'exception' : 'active'} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 12, color: '#8c8c8c' }}>
                      <span>目标：{item.targetRate}%</span>
                      <span>更新于 {dayjs(item.updatedAt).format('MM-DD')}</span>
                    </div>
                  </div>
                </List.Item>
              )}
            />
          </Card>
        </Col>

        <Col span={8}>
          <Card
            title="告警提醒"
            extra={<Link to="/alerts">全部告警</Link>}
            style={{ marginBottom: 16 }}
          >
            {mockAlerts.length > 0 ? (
              <List
                dataSource={mockAlerts}
                renderItem={(alert) => (
                  <List.Item style={{ paddingLeft: 0, paddingRight: 0 }}>
                    <div style={{ width: '100%' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: 500 }}>{alert.courseName}</span>
                        <Tag color={getSeverityColor(alert.severity)}>{alert.severityText}</Tag>
                      </div>
                      <div style={{ fontSize: 13, color: '#ff4d4f', marginBottom: 4 }}>
                        落后 {alert.behindRate}%
                      </div>
                      <div style={{ fontSize: 12, color: '#8c8c8c' }}>
                        {dayjs(alert.createdAt).format('MM-DD HH:mm')}
                      </div>
                    </div>
                  </List.Item>
                )}
              />
            ) : (
              <div style={{ textAlign: 'center', color: '#8c8c8c', padding: 20 }}>
                暂无告警
              </div>
            )}
          </Card>

          <Card
            title="快捷操作"
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              <Link to="/records">
                <Button type="primary" block icon={<BookOutlined />}>
                  查看学习记录
                </Button>
              </Link>
              <Link to="/review">
                <Button block icon={<TrophyOutlined />}>
                  月度复盘
                </Button>
              </Link>
              <Link to="/exports">
                <Button block icon={<ArrowUpOutlined />}>
                  数据导出
                </Button>
              </Link>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default DashboardPage;
