import { useState } from 'react';
import { Card, Tag, Button, Input, message } from 'antd';
import { EditOutlined, CheckOutlined } from '@ant-design/icons';
import type { NoteTask } from '../types';

interface NoteTaskPanelProps {
  tasks: NoteTask[];
  chartRef?: string;
  onResolve?: (taskId: number, conclusion: string) => Promise<void>;
}

const { TextArea } = Input;

const priorityColors: Record<string, string> = {
  high: 'red',
  medium: 'orange',
  low: 'blue',
};

const statusColors: Record<string, string> = {
  pending: 'default',
  processing: 'processing',
  resolved: 'success',
};

const statusNames: Record<string, string> = {
  pending: '待处理',
  processing: '处理中',
  resolved: '已解决',
};

const NoteTaskPanel = ({ tasks, chartRef, onResolve }: NoteTaskPanelProps) => {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [conclusion, setConclusion] = useState('');
  const [loading, setLoading] = useState(false);

  const filteredTasks = chartRef
    ? tasks.filter((t) => t.chart_ref === chartRef || !t.chart_ref)
    : tasks;

  const handleResolve = async (taskId: number) => {
    if (!conclusion.trim()) {
      message.warning('请输入处理结论');
      return;
    }
    setLoading(true);
    try {
      await onResolve?.(taskId, conclusion);
      message.success('处理结论已保存');
      setEditingId(null);
      setConclusion('');
    } catch (error) {
      message.error('保存失败');
    } finally {
      setLoading(false);
    }
  };

  if (filteredTasks.length === 0) {
    return (
      <div style={{ textAlign: 'center', color: '#999', padding: '20px 0' }}>
        暂无相关备注任务
      </div>
    );
  }

  return (
    <div style={{ maxHeight: '100%', overflowY: 'auto' }}>
      {filteredTasks.map((task) => (
        <Card
          key={task.id}
          size="small"
          style={{ marginBottom: 8 }}
          title={
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, fontWeight: 500 }}>{task.title}</span>
              <Tag color={statusColors[task.status]} style={{ margin: 0 }}>
                {statusNames[task.status]}
              </Tag>
            </div>
          }
          extra={
            <Tag color={priorityColors[task.priority]} style={{ margin: 0 }}>
              {task.priority === 'high' ? '高优' : task.priority === 'medium' ? '中优' : '低优'}
            </Tag>
          }
        >
          <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>
            {task.content}
          </div>

          {task.conclusion && (
            <div
              style={{
                padding: '8px 12px',
                background: '#f6ffed',
                border: '1px solid #b7eb8f',
                borderRadius: 4,
                fontSize: 12,
                color: '#389e0d',
              }}
            >
              <div style={{ fontWeight: 500, marginBottom: 4 }}>处理结论：</div>
              <div>{task.conclusion}</div>
            </div>
          )}

          {editingId === task.id ? (
            <div style={{ marginTop: 8 }}>
              <TextArea
                rows={2}
                value={conclusion}
                onChange={(e) => setConclusion(e.target.value)}
                placeholder="请输入处理结论..."
                style={{ marginBottom: 8 }}
              />
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <Button size="small" onClick={() => setEditingId(null)}>
                  取消
                </Button>
                <Button
                  size="small"
                  type="primary"
                  icon={<CheckOutlined />}
                  loading={loading}
                  onClick={() => handleResolve(task.id)}
                >
                  保存
                </Button>
              </div>
            </div>
          ) : (
            !task.conclusion && (
              <Button
                size="small"
                type="link"
                icon={<EditOutlined />}
                onClick={() => {
                  setEditingId(task.id);
                  setConclusion('');
                }}
                style={{ padding: 0, marginTop: 4 }}
              >
                添加处理结论
              </Button>
            )
          )}
        </Card>
      ))}
    </div>
  );
};

export default NoteTaskPanel;
