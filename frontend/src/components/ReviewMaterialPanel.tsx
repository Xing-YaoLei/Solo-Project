import React, { useEffect, useState } from 'react';
import {
  Card,
  DatePicker,
  Space,
  Statistic,
  Row,
  Col,
  Typography,
  Tag,
  List,
  Progress,
  Button,
  Tabs,
  Divider,
  Alert,
  Empty,
  Tooltip,
} from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  WarningOutlined,
  ExclamationCircleOutlined,
  BulbOutlined,
  FileTextOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import type { ReviewMaterial, OfflineEquipment, FailedInspection, ProblematicStore, EquipmentRemark } from '../types';
import { reportsApi } from '../services/api';

const { Title, Text, Paragraph } = Typography;
const { RangePicker } = DatePicker;

interface ReviewMaterialPanelProps {
  className?: string;
  refreshToken?: number;
}

const ReviewMaterialPanel: React.FC<ReviewMaterialPanelProps> = ({ className, refreshToken }) => {
  const [material, setMaterial] = useState<ReviewMaterial | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>(null);

  useEffect(() => {
    fetchMaterial();
  }, [dateRange, refreshToken]);

  const fetchMaterial = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = dateRange
        ? {
            start_date: dateRange[0].format('YYYY-MM-DD'),
            end_date: dateRange[1].format('YYYY-MM-DD'),
          }
        : undefined;
      const res = await reportsApi.getReviewMaterial(params);
      if (res && res.data) {
        setMaterial(res.data);
      } else {
        setMaterial(null);
        setError('复盘材料为空，请先完成数据初始化或导入业务数据。');
      }
    } catch (err: any) {
      console.error('Failed to fetch review material:', err);
      setMaterial(null);
      setError(
        err?.response?.data?.message ||
          err?.message ||
          '复盘材料加载失败，请检查后端服务是否已启动并完成数据初始化。'
      );
    } finally {
      setLoading(false);
    }
  };

  const buildMockMaterial = (): ReviewMaterial => {
    const offline_equipments: OfflineEquipment[] = [
      {
        id: 1,
        equipment_code: 'E1001',
        equipment_name: '意式咖啡机',
        equipment_type: 'coffee_machine',
        store_id: 1,
        store_code: 'S1001',
        store_name: '北京第1店',
        city: '北京',
        status: 'offline',
        days_since_clean: 15,
        cleaning_cycle_days: 7,
        is_warning: true,
        remarks: [
          {
            id: 1,
            equipment_id: 1,
            store_id: 1,
            remark_type: '异常备注',
            content: '蒸汽棒压力不足，已联系厂家维修，配件预计3天内到。',
            operator: '运营1',
            created_at: dayjs().subtract(1, 'day').format('YYYY-MM-DD HH:mm:ss'),
          },
        ],
      },
      {
        id: 2,
        equipment_code: 'E1002',
        equipment_name: '磨豆机',
        equipment_type: 'grinder',
        store_id: 1,
        store_code: 'S1001',
        store_name: '北京第1店',
        city: '北京',
        status: 'maintenance',
        days_since_clean: 10,
        cleaning_cycle_days: 7,
        is_warning: true,
        remarks: [],
      },
      {
        id: 3,
        equipment_code: 'E1005',
        equipment_name: '制冰机',
        equipment_type: 'ice_maker',
        store_id: 3,
        store_code: 'S1003',
        store_name: '上海第1店',
        city: '上海',
        status: 'normal',
        days_since_clean: 9,
        cleaning_cycle_days: 7,
        is_warning: false,
        remarks: [],
      },
    ];

    const failed_inspections: FailedInspection[] = [
      {
        id: 1,
        record_code: 'IR000001',
        equipment_id: 1,
        equipment_code: 'E1001',
        equipment_name: '意式咖啡机',
        store_id: 1,
        store_code: 'S1001',
        store_name: '北京第1店',
        city: '北京',
        inspection_date: dayjs().subtract(2, 'day').format('YYYY-MM-DD HH:mm:ss'),
        inspector: '巡检员3',
        inspection_type: 'spot_check',
        score: 58,
        issues_found: '冲泡头有咖啡残垢；蒸汽棒奶渍清洁不彻底；滴水盘未及时清空。',
        improvement_suggestions: '对门店员工重新培训清洁SOP，主管每班增加一次巡检抽查。',
      },
      {
        id: 2,
        record_code: 'IR000002',
        equipment_id: 5,
        equipment_code: 'E1005',
        equipment_name: '制冰机',
        store_id: 3,
        store_code: 'S1003',
        store_name: '上海第1店',
        city: '上海',
        inspection_date: dayjs().subtract(1, 'day').format('YYYY-MM-DD HH:mm:ss'),
        inspector: '巡检员5',
        inspection_type: 'routine',
        score: 65,
        issues_found: '蒸发器水垢较厚，影响制冰效率。',
        improvement_suggestions: '安排深度清洁，更换过滤芯。',
      },
    ];

    const problematic_stores: ProblematicStore[] = [
      {
        store_id: 1,
        store_code: 'S1001',
        store_name: '北京第1店',
        city: '北京',
        inspection_total: 12,
        inspection_passed: 10,
        pass_rate: 83.33,
        below_threshold: true,
      },
      {
        store_id: 3,
        store_code: 'S1003',
        store_name: '上海第1店',
        city: '上海',
        inspection_total: 8,
        inspection_passed: 7,
        pass_rate: 87.5,
        below_threshold: true,
      },
    ];

    return {
      generated_at: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      period: { start_date: undefined, end_date: undefined },
      thresholds_used: {
        cleaning_cycle_days: 7,
        offline_warning_days: 3,
        inspection_pass_rate: 90,
      },
      summary: [
        '本期巡检合格率为 88.57%，低于阈值 90%，需要重点关注。',
        '共完成巡检 35 次，其中合格 31 次，不合格 4 次，平均得分 86.2 分。',
        '清洁复查漏斗转化率：从总设备 120 台到巡检合格 32 台，转化率 26.7%。',
        '离线/超期未清洁设备 3 台（预警阈值：超清洁周期 3 天即命中预警）。',
        '发现不合格巡检记录 2 条，已在下方列出明细供复盘使用。',
        '合格率低于阈值的门店共 2 家，需要重点跟进。',
      ],
      overall_metrics: {
        total: 35,
        passed: 31,
        failed: 4,
        pass_rate: 88.57,
        avg_score: 86.2,
      },
      funnel: [
        { stage: '总设备数', count: 120 },
        { stage: '待清洁设备', count: 45 },
        { stage: '已派单设备', count: 38 },
        { stage: '已完成清洁', count: 35 },
        { stage: '巡检合格', count: 31 },
      ],
      equipment_status_distribution: [
        { status: 'normal', count: 85, percentage: 70.83 },
        { status: 'offline', count: 25, percentage: 20.83 },
        { status: 'maintenance', count: 10, percentage: 8.34 },
      ],
      offline_equipments,
      failed_inspections,
      problematic_stores,
      review_conclusion:
        '本期需重点关注：巡检合格率 88.57% 未达 90% 阈值；存在 3 台离线/超期未清洁设备；存在 2 条不合格巡检记录。建议针对性加强培训和巡检频次。',
    };
  };

  if (error && !material) {
    return (
      <Card
        className={className}
        title={
          <Space>
            <FileTextOutlined />
            <span>设备清洁复盘材料</span>
          </Space>
        }
        loading={loading}
        extra={
          <Button size="small" icon={<ReloadOutlined />} onClick={fetchMaterial}>
            重新加载
          </Button>
        }
      >
        <Alert
          type="error"
          showIcon
          message="复盘材料加载失败"
          description={error}
          action={
            <Button size="small" type="primary" onClick={fetchMaterial}>
              重试
            </Button>
          }
        />
        <Empty
          style={{ marginTop: 24 }}
          description="暂无复盘数据，请先完成数据初始化或导入业务数据"
        />
      </Card>
    );
  }

  if (!material) return null;

  const passRateThreshold = material.thresholds_used['inspection_pass_rate'] ?? 90;
  const isPassRateBelow = material.overall_metrics.pass_rate < passRateThreshold;

  const renderOfflineEquipment = (eq: OfflineEquipment) => (
    <List.Item key={eq.id}>
      <List.Item.Meta
        title={
          <Space wrap>
            <Text strong>{eq.equipment_name}</Text>
            <Tag color="blue">{eq.equipment_code}</Tag>
            <Tag color="geekblue">{eq.store_name}</Tag>
            <Tag color={eq.status === 'normal' ? 'green' : eq.status === 'offline' ? 'red' : 'orange'}>
              {eq.status === 'normal' ? '正常' : eq.status === 'offline' ? '离线' : '维修中'}
            </Tag>
            {eq.is_warning && (
              <Tooltip title="已超过离线预警阈值">
                <Tag color="red" icon={<WarningOutlined />}>
                  预警命中
                </Tag>
              </Tooltip>
            )}
          </Space>
        }
        description={
          <Space direction="vertical" size={4} style={{ width: '100%' }}>
            <Text type="secondary">
              超期 {eq.days_since_clean} 天未清洁（周期 {eq.cleaning_cycle_days} 天，预警阈值 +{material.thresholds_used['offline_warning_days'] ?? 3} 天）
            </Text>
            {eq.remarks && eq.remarks.length > 0 && (
              <div style={{ marginTop: 4 }}>
                {eq.remarks.map((r: EquipmentRemark) => (
                  <div key={r.id} style={{ marginBottom: 4 }}>
                    <Tag color="purple" style={{ marginRight: 6 }}>
                      {r.remark_type}
                    </Tag>
                    <Text style={{ fontSize: 12 }}>{r.content}</Text>
                    <Text type="secondary" style={{ fontSize: 12, marginLeft: 8 }}>
                      — {r.operator} · {dayjs(r.created_at).format('MM-DD HH:mm')}
                    </Text>
                  </div>
                ))}
              </div>
            )}
          </Space>
        }
      />
    </List.Item>
  );

  const renderFailedInspection = (ins: FailedInspection) => (
    <List.Item key={ins.id}>
      <List.Item.Meta
        title={
          <Space wrap>
            <Tag color="red" icon={<CloseCircleOutlined />}>
              不合格
            </Tag>
            <Text strong>{ins.equipment_name}</Text>
            <Tag>{ins.equipment_code}</Tag>
            <Tag color="geekblue">{ins.store_name}</Tag>
            <Tag color="orange">得分 {ins.score}</Tag>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {dayjs(ins.inspection_date).format('YYYY-MM-DD HH:mm')} · {ins.inspector}
            </Text>
          </Space>
        }
        description={
          <Space direction="vertical" size={4} style={{ width: '100%' }}>
            <div>
              <Text type="danger" strong>
                发现问题：
              </Text>
              <Text>{ins.issues_found}</Text>
            </div>
            {ins.improvement_suggestions && (
              <div>
                <Text type="warning" strong>
                  改进建议：
                </Text>
                <Text>{ins.improvement_suggestions}</Text>
              </div>
            )}
          </Space>
        }
      />
    </List.Item>
  );

  const renderProblematicStore = (store: ProblematicStore) => (
    <List.Item key={store.store_id}>
      <List.Item.Meta
        title={
          <Space wrap>
            <Text strong>{store.store_name}</Text>
            <Tag color="blue">{store.store_code}</Tag>
            <Tag color="geekblue">{store.city}</Tag>
            {store.below_threshold && (
              <Tag color="red" icon={<ExclamationCircleOutlined />}>
                低于阈值 {passRateThreshold}%
              </Tag>
            )}
          </Space>
        }
        description={
          <div style={{ width: '60%' }}>
            <Progress
              percent={store.pass_rate}
              status={store.below_threshold ? 'exception' : 'success'}
              strokeColor={store.below_threshold ? undefined : store.pass_rate < 95 ? '#faad14' : undefined}
              format={(p) => `${p}% (${store.inspection_passed}/${store.inspection_total})`}
            />
          </div>
        }
      />
    </List.Item>
  );

  const tabItems = [
    {
      key: 'offline',
      label: (
        <Space>
          <WarningOutlined style={{ color: '#faad14' }} />
          <span>离线设备 ({material.offline_equipments.length})</span>
        </Space>
      ),
      children:
        material.offline_equipments.length > 0 ? (
          <List size="small" dataSource={material.offline_equipments} renderItem={renderOfflineEquipment} />
        ) : (
          <Empty description="无离线/超期设备" />
        ),
    },
    {
      key: 'failed',
      label: (
        <Space>
          <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
          <span>不合格巡检 ({material.failed_inspections.length})</span>
        </Space>
      ),
      children:
        material.failed_inspections.length > 0 ? (
          <List size="small" dataSource={material.failed_inspections} renderItem={renderFailedInspection} />
        ) : (
          <Empty description="无不合格巡检记录" />
        ),
    },
    {
      key: 'stores',
      label: (
        <Space>
          <ExclamationCircleOutlined style={{ color: '#eb2f96' }} />
          <span>低合格率门店 ({material.problematic_stores.length})</span>
        </Space>
      ),
      children:
        material.problematic_stores.length > 0 ? (
          <List size="small" dataSource={material.problematic_stores} renderItem={renderProblematicStore} />
        ) : (
          <Empty description="所有门店合格率均达标" />
        ),
    },
  ];

  return (
    <Card
      className={className}
      title={
        <Space>
          <FileTextOutlined />
          <span>设备清洁复盘材料</span>
          <Tag color="purple">
            生成时间：{dayjs(material.generated_at).format('YYYY-MM-DD HH:mm')}
          </Tag>
        </Space>
      }
      loading={loading}
      extra={
        <Space>
          <RangePicker
            size="small"
            value={dateRange}
            onChange={(dates) => setDateRange(dates as [Dayjs, Dayjs])}
          />
          <Button size="small" icon={<ReloadOutlined />} onClick={fetchMaterial}>
            重新生成
          </Button>
        </Space>
      }
    >
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Statistic
            title="巡检合格率"
            value={material.overall_metrics.pass_rate}
            suffix="%"
            valueStyle={{ color: isPassRateBelow ? '#cf1322' : '#3f8600', fontSize: 24 }}
            prefix={isPassRateBelow ? <CloseCircleOutlined /> : <CheckCircleOutlined />}
          />
          <Text type="secondary" style={{ fontSize: 12 }}>
            阈值 {passRateThreshold}%
          </Text>
        </Col>
        <Col span={6}>
          <Statistic
            title="巡检次数"
            value={material.overall_metrics.total}
            valueStyle={{ fontSize: 24 }}
          />
          <Text type="secondary" style={{ fontSize: 12 }}>
            合格 {material.overall_metrics.passed} / 不合格 {material.overall_metrics.failed}
          </Text>
        </Col>
        <Col span={6}>
          <Statistic
            title="离线/超期设备"
            value={material.offline_equipments.length}
            valueStyle={{ color: '#cf1322', fontSize: 24 }}
            prefix={<WarningOutlined />}
          />
          <Text type="secondary" style={{ fontSize: 12 }}>
            预警阈值 +{material.thresholds_used['offline_warning_days'] ?? 3} 天
          </Text>
        </Col>
        <Col span={6}>
          <Statistic
            title="平均得分"
            value={material.overall_metrics.avg_score}
            valueStyle={{ fontSize: 24 }}
          />
          <Text type="secondary" style={{ fontSize: 12 }}>
            巡检综合平均
          </Text>
        </Col>
      </Row>

      <Alert
        type={isPassRateBelow ? 'warning' : 'success'}
        showIcon
        icon={<BulbOutlined />}
        message={
          <Space>
            <Text strong>复盘结论：</Text>
            <Text>{material.review_conclusion}</Text>
          </Space>
        }
        style={{ marginBottom: 16 }}
      />

      <Title level={5} style={{ marginTop: 0 }}>
        核心摘要
      </Title>
      <ul style={{ paddingLeft: 20, marginBottom: 16 }}>
        {material.summary.map((s, idx) => (
          <li key={idx} style={{ marginBottom: 6 }}>
            <Paragraph style={{ marginBottom: 0 }}>{s}</Paragraph>
          </li>
        ))}
      </ul>

      <Divider />

      <Tabs items={tabItems} />
    </Card>
  );
};

export default ReviewMaterialPanel;
