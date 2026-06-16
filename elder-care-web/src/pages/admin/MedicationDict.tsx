import React, { useState, useEffect, useCallback } from 'react';
import { Table, Button, Modal, Form, Input, Switch, Tag, Space, message, Popconfirm } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { medicationDict } from '../../api/apiClient';
import type { MedicationDictionary } from '../../types';

const MedicationDict: React.FC = () => {
  const [data, setData] = useState<MedicationDictionary[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<MedicationDictionary | null>(null);
  const [searchText, setSearchText] = useState('');
  const [form] = Form.useForm();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await medicationDict.getAll();
      setData(res.data);
    } catch {
      setData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAdd = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ isActive: true });
    setModalOpen(true);
  };

  const handleEdit = (record: MedicationDictionary) => {
    setEditing(record);
    form.setFieldsValue(record);
    setModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await medicationDict.remove(id);
      message.success('删除成功');
      fetchData();
    } catch {}
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editing) {
        await medicationDict.update(editing.id, values);
        message.success('更新成功');
      } else {
        await medicationDict.create(values);
        message.success('创建成功');
      }
      setModalOpen(false);
      fetchData();
    } catch {}
  };

  const handleToggleActive = async (record: MedicationDictionary) => {
    try {
      await medicationDict.update(record.id, { isActive: !record.isActive });
      message.success('状态更新成功');
      fetchData();
    } catch {}
  };

  const filteredData = searchText
    ? data.filter((item) => item.medicineName?.toLowerCase().includes(searchText.toLowerCase()))
    : data;

  const columns = [
    { title: '药品名称', dataIndex: 'medicineName', key: 'medicineName' },
    { title: '通用名', dataIndex: 'genericName', key: 'genericName' },
    { title: '剂型', dataIndex: 'dosageForm', key: 'dosageForm' },
    { title: '默认剂量', dataIndex: 'defaultDosage', key: 'defaultDosage' },
    { title: '单位', dataIndex: 'unit', key: 'unit' },
    { title: '频次', dataIndex: 'frequency', key: 'frequency' },
    { title: '分类', dataIndex: 'category', key: 'category' },
    { title: '副作用', dataIndex: 'sideEffects', key: 'sideEffects', ellipsis: true },
    { title: '禁忌症', dataIndex: 'contraindications', key: 'contraindications', ellipsis: true },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (val: boolean, record: MedicationDictionary) => (
        <Space>
          <Tag color={val ? 'green' : 'orange'}>{val ? '启用' : '停用'}</Tag>
          <Switch size="small" checked={val} onChange={() => handleToggleActive(record)} />
        </Space>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: MedicationDictionary) => (
        <Space>
          <Button type="link" size="small" onClick={() => handleEdit(record)}>编辑</Button>
          <Popconfirm title="确认删除?" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" size="small" danger>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <Input.Search
          placeholder="搜索药品名称"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          onSearch={(val) => setSearchText(val)}
          style={{ width: 300 }}
          allowClear
        />
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新增药品
        </Button>
      </div>
      <Table
        rowKey="id"
        columns={columns}
        dataSource={filteredData}
        loading={loading}
        pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (t) => `共 ${t} 条` }}
      />
      <Modal
        title={editing ? '编辑药品' : '新增药品'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        width={640}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item name="medicineName" label="药品名称" rules={[{ required: true, message: '请输入药品名称' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="genericName" label="通用名">
            <Input />
          </Form.Item>
          <Form.Item name="dosageForm" label="剂型">
            <Input />
          </Form.Item>
          <Form.Item name="defaultDosage" label="默认剂量">
            <Input />
          </Form.Item>
          <Form.Item name="unit" label="单位">
            <Input />
          </Form.Item>
          <Form.Item name="frequency" label="频次">
            <Input />
          </Form.Item>
          <Form.Item name="category" label="分类">
            <Input />
          </Form.Item>
          <Form.Item name="sideEffects" label="副作用">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="contraindications" label="禁忌症">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="isActive" label="启用状态" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default MedicationDict;
