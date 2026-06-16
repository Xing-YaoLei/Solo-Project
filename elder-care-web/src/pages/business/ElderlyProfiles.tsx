import React, { useState, useEffect, useCallback } from 'react';
import { Table, Button, Modal, Form, Input, Select, Tag, Row, Col, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { elderly, areas, staffApi } from '../../api/apiClient';
import type { ElderlyProfile, Area, Staff } from '../../types';

const ElderlyProfiles: React.FC = () => {
  const [data, setData] = useState<ElderlyProfile[]>([]);
  const [areaList, setAreaList] = useState<Area[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ElderlyProfile | null>(null);
  const [filterArea, setFilterArea] = useState<number | undefined>();
  const [filterStatus, setFilterStatus] = useState<string | undefined>();
  const [searchName, setSearchName] = useState('');
  const [form] = Form.useForm();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await elderly.getAll();
      setData(res.data);
    } catch {
      setData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAreas = useCallback(async () => {
    try {
      const res = await areas.getAll();
      setAreaList(res.data);
    } catch {
      setAreaList([]);
    }
  }, []);

  const fetchStaff = useCallback(async () => {
    try {
      const res = await staffApi.getAll();
      setStaffList(res.data);
    } catch {
      setStaffList([]);
    }
  }, []);

  useEffect(() => {
    fetchData();
    fetchAreas();
    fetchStaff();
  }, [fetchData, fetchAreas, fetchStaff]);

  const handleAdd = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ gender: '男', status: 'Active' });
    setModalOpen(true);
  };

  const handleEdit = (record: ElderlyProfile) => {
    setEditing(record);
    form.setFieldsValue({
      ...record,
      birthDate: record.birthDate ? dayjs(record.birthDate) : undefined,
      admissionDate: record.admissionDate ? dayjs(record.admissionDate) : undefined,
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (values.birthDate) {
        values.birthDate = values.birthDate.format('YYYY-MM-DD');
      }
      if (values.admissionDate) {
        values.admissionDate = values.admissionDate.format('YYYY-MM-DD');
      }
      if (editing) {
        await elderly.update(editing.id, values);
        message.success('更新成功');
      } else {
        await elderly.create(values);
        message.success('创建成功');
      }
      setModalOpen(false);
      fetchData();
    } catch {}
  };

  const calcAge = (birthDate: string) => {
    if (!birthDate) return '-';
    return dayjs().diff(dayjs(birthDate), 'year');
  };

  const filteredData = data.filter((item) => {
    if (filterArea && item.areaId !== filterArea) return false;
    if (filterStatus && item.status !== filterStatus) return false;
    if (searchName && !item.name?.includes(searchName)) return false;
    return true;
  });

  const statusColors: Record<string, string> = {
    Active: 'green',
    Discharged: 'default',
  };
  const statusLabels: Record<string, string> = {
    Active: '在住',
    Discharged: '已出院',
  };

  const columns = [
    { title: '姓名', dataIndex: 'name', key: 'name' },
    { title: '性别', dataIndex: 'gender', key: 'gender' },
    { title: '年龄', dataIndex: 'birthDate', key: 'age', render: (val: string) => calcAge(val) },
    { title: '房间号', dataIndex: 'roomNumber', key: 'roomNumber' },
    {
      title: '区域',
      dataIndex: 'areaId',
      key: 'areaId',
      render: (_: number, record: ElderlyProfile) => record.areaName || '-',
    },
    {
      title: '责任人',
      dataIndex: 'primaryStaffId',
      key: 'primaryStaffId',
      render: (_: number, record: ElderlyProfile) => record.primaryStaffName || '-',
    },
    { title: '健康状况', dataIndex: 'healthConditions', key: 'healthConditions', ellipsis: true },
    { title: '紧急联系人', dataIndex: 'emergencyContact', key: 'emergencyContact' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (val: string) => <Tag color={statusColors[val] || 'default'}>{statusLabels[val] || val}</Tag>,
    },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: ElderlyProfile) => (
        <Button type="link" size="small" onClick={() => handleEdit(record)}>编辑</Button>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col>
            <Select
              placeholder="选择区域"
              value={filterArea}
              onChange={setFilterArea}
              allowClear
              style={{ width: 160 }}
            >
              {areaList.map((a) => (
                <Select.Option key={a.id} value={a.id}>{a.name}</Select.Option>
              ))}
            </Select>
          </Col>
          <Col>
            <Select
              placeholder="选择状态"
              value={filterStatus}
              onChange={setFilterStatus}
              allowClear
              style={{ width: 120 }}
            >
              <Select.Option value="Active">在住</Select.Option>
              <Select.Option value="Discharged">已出院</Select.Option>
            </Select>
          </Col>
          <Col>
            <Input.Search
              placeholder="搜索姓名"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              onSearch={(val) => setSearchName(val)}
              style={{ width: 200 }}
              allowClear
            />
          </Col>
          <Col flex="auto" />
          <Col>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              新增老人
            </Button>
          </Col>
        </Row>
      </div>
      <Table
        rowKey="id"
        columns={columns}
        dataSource={filteredData}
        loading={loading}
        pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (t) => `共 ${t} 条` }}
      />
      <Modal
        title={editing ? '编辑老人档案' : '新增老人档案'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        width={720}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="name" label="姓名" rules={[{ required: true, message: '请输入姓名' }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="gender" label="性别" rules={[{ required: true }]}>
                <Select>
                  <Select.Option value="男">男</Select.Option>
                  <Select.Option value="女">女</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="birthDate" label="出生日期" rules={[{ required: true, message: '请选择出生日期' }]}>
                <Input type="date" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="roomNumber" label="房间号" rules={[{ required: true, message: '请输入房间号' }]}>
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="areaId" label="区域" rules={[{ required: true, message: '请选择区域' }]}>
                <Select>
                  {areaList.map((a) => (
                    <Select.Option key={a.id} value={a.id}>{a.name}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="primaryStaffId" label="责任人" rules={[{ required: true, message: '请选择责任人' }]}>
                <Select>
                  {staffList.map((s) => (
                    <Select.Option key={s.id} value={s.id}>{s.name}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="healthConditions" label="健康状况">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="emergencyContact" label="紧急联系人" rules={[{ required: true, message: '请输入紧急联系人' }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="emergencyPhone" label="紧急联系电话" rules={[{ required: true, message: '请输入紧急联系电话' }]}>
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="admissionDate" label="入院日期">
                <Input type="date" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="status" label="状态" rules={[{ required: true }]}>
                <Select>
                  <Select.Option value="Active">在住</Select.Option>
                  <Select.Option value="Discharged">已出院</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default ElderlyProfiles;
