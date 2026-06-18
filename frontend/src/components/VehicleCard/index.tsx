import { Card, Descriptions, Tag, Space, Divider, List } from 'antd';
import { CarOutlined, UserOutlined, HistoryOutlined } from '@ant-design/icons';
import type { VehicleInfo, HistoryRecord } from '@/types';

interface VehicleCardProps {
  vehicle: VehicleInfo | null;
  history?: HistoryRecord[];
  loading?: boolean;
}

export default function VehicleCard({ vehicle, history = [], loading }: VehicleCardProps) {
  if (!vehicle && !loading) {
    return (
      <Card style={{ height: '100%' }}>
        <div style={{ textAlign: 'center', color: '#999', padding: '40px 0' }}>
          <CarOutlined style={{ fontSize: 48, marginBottom: 16 }} />
          <p>请选择预约单查看车辆信息</p>
        </div>
      </Card>
    );
  }

  return (
    <Card 
      title={
        <Space>
          <CarOutlined />
          <span>车辆档案</span>
        </Space>
      }
      loading={loading}
      style={{ height: '100%' }}
      size="small"
    >
      {vehicle && (
        <>
          <Descriptions size="small" column={2}>
            <Descriptions.Item label="车牌号">
              <Tag color="blue" style={{ fontSize: 14, padding: '2px 10px' }}>
                {vehicle.plateNumber}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="品牌型号">
              {vehicle.brand} {vehicle.model}
            </Descriptions.Item>
            <Descriptions.Item label="车架号">
              <span style={{ fontSize: 12, color: '#666' }}>{vehicle.vinNumber}</span>
            </Descriptions.Item>
            <Descriptions.Item label="颜色">{vehicle.color}</Descriptions.Item>
            <Descriptions.Item label="里程">
              <span style={{ color: '#fa8c16', fontWeight: 'bold' }}>
                {vehicle.mileage.toLocaleString()} km
              </span>
            </Descriptions.Item>
            <Descriptions.Item label="维修次数">
              {vehicle.repairCount} 次
            </Descriptions.Item>
          </Descriptions>

          <Divider style={{ margin: '12px 0' }} />

          <div style={{ marginBottom: 8 }}>
            <Space>
              <UserOutlined />
              <strong>车主信息</strong>
            </Space>
          </div>
          <Descriptions size="small" column={2}>
            <Descriptions.Item label="姓名">{vehicle.ownerName}</Descriptions.Item>
            <Descriptions.Item label="电话">{vehicle.ownerPhone}</Descriptions.Item>
            <Descriptions.Item label="注册日期">{vehicle.registerDate}</Descriptions.Item>
            <Descriptions.Item label="上次保养">{vehicle.lastMaintenanceDate}</Descriptions.Item>
          </Descriptions>

          {history.length > 0 && (
            <>
              <Divider style={{ margin: '12px 0' }} />
              <div style={{ marginBottom: 8 }}>
                <Space>
                  <HistoryOutlined />
                  <strong>历史记录</strong>
                  <Tag color="green" style={{ marginLeft: 'auto' }}>
                    共 {history.length} 条
                  </Tag>
                </Space>
              </div>
              <List
                size="small"
                dataSource={history.slice(0, 3)}
                renderItem={(item) => (
                  <List.Item>
                    <List.Item.Meta
                      title={
                        <Space size={8}>
                          <span style={{ fontSize: 13 }}>{item.serviceType}</span>
                          <Tag color="blue" style={{ fontSize: 11 }}>¥{item.amount}</Tag>
                        </Space>
                      }
                      description={
                        <span style={{ fontSize: 12, color: '#999' }}>
                          {item.date} · {item.handler}
                        </span>
                      }
                    />
                  </List.Item>
                )}
                style={{ maxHeight: 120, overflow: 'auto' }}
              />
            </>
          )}
        </>
      )}
    </Card>
  );
}
