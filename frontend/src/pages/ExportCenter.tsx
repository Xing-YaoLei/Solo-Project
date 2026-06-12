import React, { useEffect, useState } from 'react';
import { Card, Button, Input, Select, Typography, Space, Row, Col, Divider, message } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import type { ExceptionOrder } from '../types';
import { exportSettlementSheet, exportArrivalList, exportExceptionOrders, getCaliberDescription, downloadBlob } from '../api/export';
import { getExceptionOrders } from '../api/exceptionOrders';

const { Title, Paragraph, Text } = Typography;

const ExportCenter: React.FC = () => {
  const [settlementId, setSettlementId] = useState<string>('');
  const [arrivalId, setArrivalId] = useState<string>('');
  const [exceptionIds, setExceptionIds] = useState<number[]>([]);
  const [exceptionOptions, setExceptionOptions] = useState<{ value: number; label: string }[]>([]);
  const [caliberTexts, setCaliberTexts] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchCaliber = async () => {
      try {
        const types = ['settlement', 'arrival', 'exception'];
        const results = await Promise.all(types.map((t) => getCaliberDescription(t)));
        const map: Record<string, string> = {};
        types.forEach((t, i) => {
          map[t] = results[i].data.data || '暂无口径说明';
        });
        setCaliberTexts(map);
      } catch {
        // handled
      }
    };

    const fetchExceptionOptions = async () => {
      try {
        const res = await getExceptionOrders();
        const orders = res.data.data || [];
        setExceptionOptions(
          orders.map((o: ExceptionOrder) => ({ value: o.id, label: `${o.exceptionNo} - ${o.exceptionType}` })),
        );
      } catch {
        // handled
      }
    };

    fetchCaliber();
    fetchExceptionOptions();
  }, []);

  const handleExportSettlement = async () => {
    if (!settlementId) {
      message.warning('请输入结算单ID');
      return;
    }
    try {
      const res = await exportSettlementSheet(Number(settlementId));
      downloadBlob(res.data as Blob, `结算单_${settlementId}.xlsx`);
      message.success('导出成功');
    } catch {
      // handled
    }
  };

  const handleExportArrival = async () => {
    if (!arrivalId) {
      message.warning('请输入到货清单ID');
      return;
    }
    try {
      const res = await exportArrivalList(Number(arrivalId));
      downloadBlob(res.data as Blob, `到货清单_${arrivalId}.xlsx`);
      message.success('导出成功');
    } catch {
      // handled
    }
  };

  const handleExportExceptions = async () => {
    if (exceptionIds.length === 0) {
      message.warning('请选择异常单');
      return;
    }
    try {
      const res = await exportExceptionOrders(exceptionIds);
      downloadBlob(res.data as Blob, `异常单_${exceptionIds.join('_')}.xlsx`);
      message.success('导出成功');
    } catch {
      // handled
    }
  };

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={3}>导出中心</Title>

      <Row gutter={16}>
        <Col span={8}>
          <Card title="结算单导出" hoverable>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text>请输入结算单ID：</Text>
              <Input
                placeholder="结算单ID"
                value={settlementId}
                onChange={(e) => setSettlementId(e.target.value)}
              />
              <Button type="primary" icon={<DownloadOutlined />} onClick={handleExportSettlement} block>
                导出结算单
              </Button>
            </Space>
          </Card>
        </Col>
        <Col span={8}>
          <Card title="到货清单导出" hoverable>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text>请输入到货清单ID：</Text>
              <Input
                placeholder="到货清单ID"
                value={arrivalId}
                onChange={(e) => setArrivalId(e.target.value)}
              />
              <Button type="primary" icon={<DownloadOutlined />} onClick={handleExportArrival} block>
                导出到货清单
              </Button>
            </Space>
          </Card>
        </Col>
        <Col span={8}>
          <Card title="异常单导出" hoverable>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text>请选择异常单：</Text>
              <Select
                mode="multiple"
                placeholder="选择异常单"
                style={{ width: '100%' }}
                value={exceptionIds}
                onChange={setExceptionIds}
                options={exceptionOptions}
                maxTagCount={3}
              />
              <Button type="primary" icon={<DownloadOutlined />} onClick={handleExportExceptions} block>
                导出异常单
              </Button>
            </Space>
          </Card>
        </Col>
      </Row>

      <Divider />

      <Card title="口径说明">
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <div>
            <Text strong>结算单口径说明：</Text>
            <Paragraph style={{ whiteSpace: 'pre-wrap', marginTop: 4, marginBottom: 0 }}>
              {caliberTexts.settlement || '加载中...'}
            </Paragraph>
          </div>
          <Divider style={{ margin: '8px 0' }} />
          <div>
            <Text strong>到货清单口径说明：</Text>
            <Paragraph style={{ whiteSpace: 'pre-wrap', marginTop: 4, marginBottom: 0 }}>
              {caliberTexts.arrival || '加载中...'}
            </Paragraph>
          </div>
          <Divider style={{ margin: '8px 0' }} />
          <div>
            <Text strong>异常单口径说明：</Text>
            <Paragraph style={{ whiteSpace: 'pre-wrap', marginTop: 4, marginBottom: 0 }}>
              {caliberTexts.exception || '加载中...'}
            </Paragraph>
          </div>
        </Space>
      </Card>
    </Space>
  );
};

export default ExportCenter;
