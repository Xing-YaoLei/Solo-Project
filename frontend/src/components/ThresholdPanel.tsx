import React, { useEffect, useState } from 'react';
import { Card, List, InputNumber, Button, Tag, Space, Typography, message, Modal, Form } from 'antd';
import { SettingOutlined, SaveOutlined, WarningOutlined } from '@ant-design/icons';
import type { ThresholdConfig } from '../types';
import { thresholdsApi } from '../services/api';

const { Title, Text } = Typography;

interface ThresholdPanelProps {
  className?: string;
  onSaved?: () => void;
}

const ThresholdPanel: React.FC<ThresholdPanelProps> = ({ className, onSaved }) => {
  const [thresholds, setThresholds] = useState<ThresholdConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingThreshold, setEditingThreshold] = useState<ThresholdConfig | null>(null);
  const [editValue, setEditValue] = useState<number>(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchThresholds();
  }, []);

  const fetchThresholds = async () => {
    setLoading(true);
    try {
      const res = await thresholdsApi.list();
      setThresholds(Array.isArray(res) ? res : []);
    } catch (error) {
      console.error('Failed to fetch thresholds:', error);
      setThresholds([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (threshold: ThresholdConfig) => {
    setEditingThreshold(threshold);
    setEditValue(threshold.config_value);
    setEditModalVisible(true);
  };

  const handleSave = async () => {
    if (!editingThreshold) return;
    setSaving(true);
    try {
      await thresholdsApi.update(editingThreshold.config_key, {
        config_value: editValue,
      });
      message.success('阈值更新成功');
      setEditModalVisible(false);
      fetchThresholds();
      onSaved?.();
    } catch (error) {
      message.error('阈值更新失败');
    } finally {
      setSaving(false);
    }
  };

  const getCategoryColor = (category?: string) => {
    switch (category) {
      case 'cleaning':
        return 'blue';
      case 'warning':
        return 'orange';
      case 'inspection':
        return 'green';
      case 'maintenance':
        return 'purple';
      default:
        return 'default';
    }
  };

  const getCategoryLabel = (category?: string) => {
    switch (category) {
      case 'cleaning':
        return '清洁';
      case 'warning':
        return '预警';
      case 'inspection':
        return '巡检';
      case 'maintenance':
        return '维护';
      default:
        return '其他';
    }
  };

  return (
    <Card
      className={className}
      title={
        <Space>
          <SettingOutlined />
          <span>预警阈值配置</span>
        </Space>
      }
      loading={loading}
      extra={
        <Button size="small" type="primary" onClick={fetchThresholds}>
          刷新
        </Button>
      }
    >
      <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
        <WarningOutlined style={{ color: '#faad14', marginRight: 4 }} />
        业务人员可自行调整各项预警阈值，调整后立即生效
      </Text>

      <List
        size="large"
        dataSource={thresholds}
        renderItem={(item) => (
          <List.Item
            actions={[
              <Button
                type="link"
                size="small"
                icon={<SaveOutlined />}
                onClick={() => handleEdit(item)}
              >
                调整
              </Button>,
            ]}
          >
            <List.Item.Meta
              title={
                <Space>
                  <span style={{ fontWeight: 500 }}>{item.config_name}</span>
                  <Tag color={getCategoryColor(item.category)}>{getCategoryLabel(item.category)}</Tag>
                </Space>
              }
              description={
                <Space direction="vertical" size={4} style={{ width: '100%' }}>
                  <Text type="secondary">{item.description}</Text>
                  <Space>
                    <Text strong style={{ fontSize: 18, color: '#1890ff' }}>
                      {item.config_value}
                    </Text>
                    <Text type="secondary">{item.config_unit}</Text>
                  </Space>
                </Space>
              }
            />
          </List.Item>
        )}
      />

      <Modal
        title="调整阈值"
        open={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        onOk={handleSave}
        confirmLoading={saving}
        okText="保存"
        cancelText="取消"
      >
        {editingThreshold && (
          <div style={{ padding: '20px 0' }}>
            <Title level={5}>{editingThreshold.config_name}</Title>
            <Text type="secondary">{editingThreshold.description}</Text>
            <div style={{ marginTop: 20, textAlign: 'center' }}>
              <InputNumber
                size="large"
                value={editValue}
                onChange={(val) => setEditValue(Number(val) || 0)}
                min={0}
                step={1}
                style={{ width: 200 }}
                addonAfter={editingThreshold.config_unit}
              />
            </div>
          </div>
        )}
      </Modal>
    </Card>
  );
};

export default ThresholdPanel;
