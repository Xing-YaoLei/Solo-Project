import React, { useState, useEffect, useCallback } from 'react';
import { Table, Select, DatePicker, Button, Row, Col, Card, Statistic, Tag, Space } from 'antd';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { query, areas, staffApi, visitRecords, checkIns } from '../../api/apiClient';
import type { CombinedQuery as CombinedQueryType, PagedResult, Area, Staff, VisitCompliance, CheckInStats } from '../../types';
import {
  RiskEventTypeLabel, RiskEventSeverityLabel, RiskEventStatusLabel,
  MedicationStatusLabel, VisitStatusLabel, CheckInStatusLabel,
} from '../../types';

const entityTypeOptions = [
  { value: 'Elderly', label: '老人档案' },
  { value: 'RiskEvent', label: '风险事件' },
  { value: 'Schedule', label: '用药排程' },
  { value: 'Visit', label: '探访记录' },
  { value: 'CheckIn', label: '活动签到' },
];

const statusOptionsMap: Record<string, { value: string; label: string }[]> = {
  Elderly: [
    { value: 'Active', label: '在住' },
    { value: 'Discharged', label: '已出院' },
  ],
  RiskEvent: Object.entries(RiskEventStatusLabel).map(([k, v]) => ({ value: k, label: v })),
  Schedule: Object.entries(MedicationStatusLabel).map(([k, v]) => ({ value: k, label: v })),
  Visit: Object.entries(VisitStatusLabel).map(([k, v]) => ({ value: k, label: v })),
  CheckIn: Object.entries(CheckInStatusLabel).map(([k, v]) => ({ value: k, label: v })),
};

const severityColors: Record<string, string> = { Low: 'green', Medium: 'blue', High: 'orange', Critical: 'red' };
const riskStatusColors: Record<string, string> = { Open: 'red', Processing: 'orange', Resolved: 'green', Closed: 'default' };
const eventTypeColors: Record<string, string> = { Fall: 'red', Wander: 'orange', Choking: 'volcano', Other: 'blue' };
const medStatusColors: Record<string, string> = { Active: 'green', Paused: 'orange', Completed: 'blue' };
const visitStatusColors: Record<string, string> = { Scheduled: 'blue', Completed: 'green', Missed: 'red', Cancelled: 'default' };
const checkInStatusColors: Record<string, string> = { CheckedIn: 'green', Absent: 'red', Late: 'orange', Excused: 'default' };

const CombinedQuery: React.FC = () => {
  const [areaList, setAreaList] = useState<Area[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [entityType, setEntityType] = useState<string>('Elderly');
  const [filterStatus, setFilterStatus] = useState<string | undefined>();
  const [filterArea, setFilterArea] = useState<number | undefined>();
  const [filterStaff, setFilterStaff] = useState<number | undefined>();
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);
  const [tableData, setTableData] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ total: 0, active: 0, compliance: 0 });

  const fetchDeps = useCallback(async () => {
    try {
      const [areaRes, staffRes] = await Promise.all([areas.getAll(), staffApi.getAll()]);
      setAreaList(areaRes.data);
      setStaffList(staffRes.data);
    } catch {}
  }, []);

  useEffect(() => {
    fetchDeps();
  }, [fetchDeps]);

  const doQuery = async (p: number = 1, ps: number = pageSize) => {
    setLoading(true);
    try {
      const params: CombinedQueryType = {
        entityType: entityType as CombinedQueryType['entityType'],
        page: p,
        pageSize: ps,
      };
      if (filterStatus) params.status = filterStatus;
      if (filterArea) params.areaId = filterArea;
      if (filterStaff) params.staffId = filterStaff;
      if (dateRange && dateRange[0] && dateRange[1]) {
        params.startDate = dateRange[0].format('YYYY-MM-DD');
        params.endDate = dateRange[1].format('YYYY-MM-DD');
      }
      const res = await query.combined(params);
      const result: PagedResult<any> = res.data;
      setTableData(result.items || []);
      setTotalCount(result.totalCount);
      setPage(p);

      let complianceRate = 0;
      let compliantCount = 0;
      let activeCount = 0;

      if (entityType === 'Visit') {
        try {
          const complianceRes = await visitRecords.getCompliance(filterStaff ?? undefined, dateRange?.[0]?.format('YYYY-MM-DD'), dateRange?.[1]?.format('YYYY-MM-DD'));
          const visitCompliances: VisitCompliance[] = complianceRes.data;
          if (visitCompliances.length > 0) {
            complianceRate = Math.round(visitCompliances.reduce((sum, c) => sum + c.complianceRate, 0) / visitCompliances.length * 100);
            compliantCount = visitCompliances.filter(c => c.complianceRate >= 1).length;
          }
        } catch {}
        activeCount = (result.items || []).filter((i: any) => i.status === 'Completed').length;
      } else if (entityType === 'CheckIn') {
        try {
          const statsRes = await checkIns.getStats(filterStaff ?? undefined);
          const checkInStatsList: CheckInStats[] = statsRes.data;
          if (checkInStatsList.length > 0) {
            compliantCount = checkInStatsList.filter(c => c.isCompliant).length;
            complianceRate = Math.round((compliantCount / checkInStatsList.length) * 100);
          }
        } catch {}
        activeCount = (result.items || []).filter((i: any) => i.status === 'CheckedIn').length;
      } else {
        activeCount = (result.items || []).filter((i: any) => i.status === 'Active' || i.status === 'Completed' || i.status === 'CheckedIn').length || 0;
        if (result.items?.length) {
          const successCount = result.items.filter((i: any) => i.status === 'Completed' || i.status === 'CheckedIn' || i.status === 'Active').length;
          complianceRate = Math.round((successCount / result.items.length) * 100);
          compliantCount = successCount;
        }
      }

      setStats({
        total: result.totalCount,
        active: activeCount,
        compliance: complianceRate,
      });
    } catch {
      setTableData([]);
      setTotalCount(0);
      setStats({ total: 0, active: 0, compliance: 0 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    doQuery(1);
  }, [entityType]);

  const handleSearch = () => {
    doQuery(1, pageSize);
  };

  const handleReset = () => {
    setFilterStatus(undefined);
    setFilterArea(undefined);
    setFilterStaff(undefined);
    setDateRange(null);
    doQuery(1, pageSize);
  };

  const getColumns = () => {
    switch (entityType) {
      case 'Elderly':
        return [
          { title: '姓名', dataIndex: 'name', key: 'name' },
          { title: '性别', dataIndex: 'gender', key: 'gender' },
          {
            title: '年龄',
            dataIndex: 'birthDate',
            key: 'age',
            render: (val: string) => (val ? dayjs().diff(dayjs(val), 'year') : '-'),
          },
          { title: '房间', dataIndex: 'roomNumber', key: 'roomNumber' },
          { title: '区域', dataIndex: 'areaName', key: 'areaName', render: (v: string) => v || '-' },
          { title: '责任人', dataIndex: 'primaryStaffName', key: 'primaryStaffName', render: (v: string) => v || '-' },
          {
            title: '状态',
            dataIndex: 'status',
            key: 'status',
            render: (val: string) => (
              <Tag color={val === 'Active' ? 'green' : 'default'}>{val === 'Active' ? '在住' : val === 'Discharged' ? '已出院' : val}</Tag>
            ),
          },
        ];
      case 'RiskEvent':
        return [
          { title: '老人', dataIndex: 'elderlyName', key: 'elderlyName', render: (v: string) => v || '-' },
          {
            title: '类型',
            dataIndex: 'eventType',
            key: 'eventType',
            render: (val: string) => <Tag color={eventTypeColors[val] || 'blue'}>{RiskEventTypeLabel[val] || val}</Tag>,
          },
          {
            title: '严重度',
            dataIndex: 'severity',
            key: 'severity',
            render: (val: string) => <Tag color={severityColors[val] || 'blue'}>{RiskEventSeverityLabel[val] || val}</Tag>,
          },
          {
            title: '时间',
            dataIndex: 'eventTime',
            key: 'eventTime',
            render: (val: string) => (val ? dayjs(val).format('YYYY-MM-DD HH:mm') : '-'),
          },
          { title: '区域', dataIndex: 'areaName', key: 'areaName', render: (v: string) => v || '-' },
          { title: '负责人', dataIndex: 'assignedStaffName', key: 'assignedStaffName', render: (v: string) => v || '-' },
          {
            title: '状态',
            dataIndex: 'status',
            key: 'status',
            render: (val: string) => <Tag color={riskStatusColors[val] || 'default'}>{RiskEventStatusLabel[val] || val}</Tag>,
          },
        ];
      case 'Schedule':
        return [
          { title: '老人', dataIndex: 'elderlyName', key: 'elderlyName', render: (v: string) => v || '-' },
          { title: '药品', dataIndex: 'medicineName', key: 'medicineName', render: (v: string) => v || '-' },
          { title: '剂量', dataIndex: 'dosage', key: 'dosage' },
          { title: '频次', dataIndex: 'frequency', key: 'frequency' },
          {
            title: '时间',
            dataIndex: 'timeOfDay',
            key: 'timeOfDay',
            render: (v: string) => v || '-',
          },
          {
            title: '状态',
            dataIndex: 'status',
            key: 'status',
            render: (val: string) => <Tag color={medStatusColors[val] || 'default'}>{MedicationStatusLabel[val] || val}</Tag>,
          },
        ];
      case 'Visit':
        return [
          { title: '老人', dataIndex: 'elderlyName', key: 'elderlyName', render: (v: string) => v || '-' },
          { title: '护工', dataIndex: 'staffName', key: 'staffName', render: (v: string) => v || '-' },
          {
            title: '日期',
            dataIndex: 'visitDate',
            key: 'visitDate',
            render: (val: string) => (val ? dayjs(val).format('YYYY-MM-DD') : '-'),
          },
          { title: '时长(分钟)', dataIndex: 'duration', key: 'duration' },
          {
            title: '状态',
            dataIndex: 'status',
            key: 'status',
            render: (val: string) => <Tag color={visitStatusColors[val] || 'default'}>{VisitStatusLabel[val] || val}</Tag>,
          },
        ];
      case 'CheckIn':
        return [
          { title: '老人', dataIndex: 'elderlyName', key: 'elderlyName', render: (v: string) => v || '-' },
          { title: '活动', dataIndex: 'activityName', key: 'activityName' },
          {
            title: '时间',
            dataIndex: 'checkInTime',
            key: 'checkInTime',
            render: (val: string) => (val ? dayjs(val).format('YYYY-MM-DD HH:mm') : '-'),
          },
          {
            title: '状态',
            dataIndex: 'status',
            key: 'status',
            render: (val: string) => <Tag color={checkInStatusColors[val] || 'default'}>{CheckInStatusLabel[val] || val}</Tag>,
          },
        ];
      default:
        return [];
    }
  };

  const entityLabel = entityTypeOptions.find((o) => o.value === entityType)?.label || '';

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card size="small">
            <Statistic title="查询总数" value={stats.total} />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic title="活跃/完成" value={stats.active} />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic title="合规率" value={stats.compliance} suffix="%" />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic title="查询类型" value={entityLabel} />
          </Card>
        </Col>
      </Row>

      <div style={{ marginBottom: 16 }}>
        <Row gutter={[16, 12]} align="middle">
          <Col>
            <Select
              value={entityType}
              onChange={(val) => {
                setEntityType(val);
                setFilterStatus(undefined);
              }}
              style={{ width: 140 }}
              options={entityTypeOptions}
            />
          </Col>
          <Col>
            <Select
              placeholder="状态"
              value={filterStatus}
              onChange={setFilterStatus}
              allowClear
              style={{ width: 130 }}
            >
              {(statusOptionsMap[entityType] || []).map((o) => (
                <Select.Option key={o.value} value={o.value}>{o.label}</Select.Option>
              ))}
            </Select>
          </Col>
          <Col>
            <Select
              placeholder="区域"
              value={filterArea}
              onChange={setFilterArea}
              allowClear
              style={{ width: 140 }}
            >
              {areaList.map((a) => (
                <Select.Option key={a.id} value={a.id}>{a.name}</Select.Option>
              ))}
            </Select>
          </Col>
          <Col>
            <Select
              placeholder="责任人"
              value={filterStaff}
              onChange={setFilterStaff}
              allowClear
              style={{ width: 140 }}
            >
              {staffList.map((s) => (
                <Select.Option key={s.id} value={s.id}>{s.name}</Select.Option>
              ))}
            </Select>
          </Col>
          <Col>
            <DatePicker.RangePicker
              value={dateRange}
              onChange={(val) => setDateRange(val)}
              style={{ width: 260 }}
            />
          </Col>
          <Col>
            <Space>
              <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>查询</Button>
              <Button icon={<ReloadOutlined />} onClick={handleReset}>重置</Button>
            </Space>
          </Col>
        </Row>
      </div>

      <Table
        rowKey="id"
        columns={getColumns()}
        dataSource={tableData}
        loading={loading}
        pagination={{
          current: page,
          pageSize,
          total: totalCount,
          showSizeChanger: true,
          showTotal: (t) => `共 ${t} 条`,
          onChange: (p, ps) => doQuery(p, ps),
        }}
      />
    </div>
  );
};

export default CombinedQuery;
