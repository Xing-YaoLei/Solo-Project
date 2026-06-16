import React, { useState } from 'react';
import { Card, Form, Input, Select, Button, Space, Divider, List, Tag, Modal, message, Tabs } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';

const { Option } = Select;
const { TextArea } = Input;

const SettingsPage: React.FC = () => {
  const [form] = Form.useForm();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('rejectionReasons');

  const [rejectionReasons, setRejectionReasons] = useState([
    { id: 1, code: 'R001', name: '费用超标', description: '治疗费用超出医保支付标准' },
    { id: 2, code: 'R002', name: '适应症不符', description: '治疗项目与诊断不符' },
    { id: 3, code: 'R003', name: '材料不全', description: '缺少必要的诊断证明和材料' },
    { id: 4, code: 'R004', name: '时间不符', description: '治疗时间不符合规定' },
    { id: 5, code: 'R005', name: '其他', description: '其他原因' },
  ]);

  const [sourceChannels, setSourceChannels] = useState([
    { id: 1, name: '门诊转诊', description: '门诊患者转诊' },
    { id: 2, name: '住院转诊', description: '住院患者转诊' },
    { id: 3, name: '社区推荐', description: '社区卫生服务中心推荐' },
    { id: 4, name: '线上预约', description: '线上平台预约' },
    { id: 5, name: '其他', description: '其他来源' },
  ]);

  const [reviewTags, setReviewTags] = useState([
    { id: 1, name: '术后康复', color: '#1890ff' },
    { id: 2, name: '运动损伤', color: '#52c41a' },
    { id: 3, name: '老年康复', color: '#faad14' },
    { id: 4, name: '神经系统', color: '#722ed1' },
    { id: 5, name: '骨关节', color: '#eb2f96' },
    { id: 6, name: '心肺康复', color: '#13c2c2' },
    { id: 7, name: '儿童康复', color: '#fa8c16' },
  ]);

  const [users, setUsers] = useState([
    { id: 1, userName: 'admin', realName: '系统管理员', role: 'Admin', department: '信息科' },
    { id: 2, userName: 'zhangdoctor', realName: '张医生', role: 'Reviewer', department: '康复科' },
    { id: 3, userName: 'litherapeutist', realName: '李治疗师', role: 'Therapist', department: '康复科' },
    { id: 4, userName: 'wangnurse', realName: '王护士', role: 'Nurse', department: '护理部' },
    { id: 5, userName: 'chendirector', realName: '陈主任', role: 'FinalReviewer', department: '康复科' },
  ]);

  const handleAdd = (type: string) => {
    setActiveTab(type);
    setEditingItem(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    form.setFieldsValue(item);
    setModalVisible(true);
  };

  const handleDelete = (id: number, type: string) => {
    if (type === 'rejectionReasons') {
      setRejectionReasons(rejectionReasons.filter((r) => r.id !== id));
    } else if (type === 'sourceChannels') {
      setSourceChannels(sourceChannels.filter((s) => s.id !== id));
    } else if (type === 'reviewTags') {
      setReviewTags(reviewTags.filter((t) => t.id !== id));
    } else if (type === 'users') {
      setUsers(users.filter((u) => u.id !== id));
    }
    message.success('删除成功');
  };

  const handleSubmit = (values: any) => {
    if (activeTab === 'rejectionReasons') {
      if (editingItem) {
        setRejectionReasons(
          rejectionReasons.map((r) => (r.id === editingItem.id ? { ...r, ...values } : r))
        );
      } else {
        const newId = Math.max(...rejectionReasons.map((r) => r.id)) + 1;
        setRejectionReasons([...rejectionReasons, { id: newId, ...values }]);
      }
    } else if (activeTab === 'sourceChannels') {
      if (editingItem) {
        setSourceChannels(
          sourceChannels.map((s) => (s.id === editingItem.id ? { ...s, ...values } : s))
        );
      } else {
        const newId = Math.max(...sourceChannels.map((s) => s.id)) + 1;
        setSourceChannels([...sourceChannels, { id: newId, ...values }]);
      }
    } else if (activeTab === 'reviewTags') {
      if (editingItem) {
        setReviewTags(
          reviewTags.map((t) => (t.id === editingItem.id ? { ...t, ...values } : t))
        );
      } else {
        const newId = Math.max(...reviewTags.map((t) => t.id)) + 1;
        setReviewTags([...reviewTags, { id: newId, ...values }]);
      }
    } else if (activeTab === 'users') {
      if (editingItem) {
        setUsers(users.map((u) => (u.id === editingItem.id ? { ...u, ...values } : u)));
      } else {
        const newId = Math.max(...users.map((u) => u.id)) + 1;
        setUsers([...users, { id: newId, ...values }]);
      }
    }
    message.success('保存成功');
    setModalVisible(false);
  };

  const settingsTabs = [
    {
      key: 'rejectionReasons',
      label: '拒付原因',
      children: (
        <Card
          title="拒付原因管理"
          extra={
            <Button type="primary" icon={<PlusOutlined />} onClick={() => handleAdd('rejectionReasons')}>
              新增
            </Button>
          }
        >
          <List
            dataSource={rejectionReasons}
            renderItem={(item) => (
              <List.Item
                key={item.id}
                actions={[
                  <Button
                    type="link"
                    size="small"
                    icon={<EditOutlined />}
                    onClick={() => handleEdit(item)}
                  >
                    编辑
                  </Button>,
                  <Button
                    type="link"
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => handleDelete(item.id, 'rejectionReasons')}
                  >
                    删除
                  </Button>,
                ]}
              >
                <List.Item.Meta
                  title={
                    <Space>
                      <Tag color="red">{item.code}</Tag>
                      <strong>{item.name}</strong>
                    </Space>
                  }
                  description={item.description}
                />
              </List.Item>
            )}
          />
        </Card>
      ),
    },
    {
      key: 'sourceChannels',
      label: '来源渠道',
      children: (
        <Card
          title="来源渠道管理"
          extra={
            <Button type="primary" icon={<PlusOutlined />} onClick={() => handleAdd('sourceChannels')}>
              新增
            </Button>
          }
        >
          <List
            dataSource={sourceChannels}
            renderItem={(item) => (
              <List.Item
                key={item.id}
                actions={[
                  <Button
                    type="link"
                    size="small"
                    icon={<EditOutlined />}
                    onClick={() => handleEdit(item)}
                  >
                    编辑
                  </Button>,
                  <Button
                    type="link"
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => handleDelete(item.id, 'sourceChannels')}
                  >
                    删除
                  </Button>,
                ]}
              >
                <List.Item.Meta
                  title={<strong>{item.name}</strong>}
                  description={item.description}
                />
              </List.Item>
            )}
          />
        </Card>
      ),
    },
    {
      key: 'reviewTags',
      label: '复盘标签',
      children: (
        <Card
          title="复盘标签管理"
          extra={
            <Button type="primary" icon={<PlusOutlined />} onClick={() => handleAdd('reviewTags')}>
              新增
            </Button>
          }
        >
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {reviewTags.map((tag) => (
              <Tag
                key={tag.id}
                color={tag.color}
                style={{ fontSize: 14, padding: '8px 16px', cursor: 'pointer' }}
              >
                {tag.name}
                <Button
                  type="text"
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  style={{ marginLeft: 8, fontSize: 12 }}
                  onClick={() => handleDelete(tag.id, 'reviewTags')}
                />
              </Tag>
            ))}
          </div>
        </Card>
      ),
    },
    {
      key: 'users',
      label: '用户管理',
      children: (
        <Card
          title="用户管理"
          extra={
            <Button type="primary" icon={<PlusOutlined />} onClick={() => handleAdd('users')}>
              新增
            </Button>
          }
        >
          <List
            dataSource={users}
            renderItem={(item) => (
              <List.Item
                key={item.id}
                actions={[
                  <Button
                    type="link"
                    size="small"
                    icon={<EditOutlined />}
                    onClick={() => handleEdit(item)}
                  >
                    编辑
                  </Button>,
                  <Button
                    type="link"
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => handleDelete(item.id, 'users')}
                  >
                    删除
                  </Button>,
                ]}
              >
                <List.Item.Meta
                  title={
                    <Space>
                      <strong>{item.realName}</strong>
                      <Tag color="blue">{item.userName}</Tag>
                      <Tag>{item.role}</Tag>
                    </Space>
                  }
                  description={item.department}
                />
              </List.Item>
            )}
          />
        </Card>
      ),
    },
  ];

  const getFormFields = () => {
    switch (activeTab) {
      case 'rejectionReasons':
        return (
          <>
            <Form.Item
              name="code"
              label="编码"
              rules={[{ required: true, message: '请输入编码' }]}
            >
              <Input placeholder="请输入编码" />
            </Form.Item>
            <Form.Item
              name="name"
              label="名称"
              rules={[{ required: true, message: '请输入名称' }]}
            >
              <Input placeholder="请输入名称" />
            </Form.Item>
            <Form.Item name="description" label="描述">
              <TextArea rows={3} placeholder="请输入描述" />
            </Form.Item>
          </>
        );
      case 'sourceChannels':
        return (
          <>
            <Form.Item
              name="name"
              label="渠道名称"
              rules={[{ required: true, message: '请输入名称' }]}
            >
              <Input placeholder="请输入渠道名称" />
            </Form.Item>
            <Form.Item name="description" label="描述">
              <TextArea rows={3} placeholder="请输入描述" />
            </Form.Item>
          </>
        );
      case 'reviewTags':
        return (
          <>
            <Form.Item
              name="name"
              label="标签名称"
              rules={[{ required: true, message: '请输入名称' }]}
            >
              <Input placeholder="请输入标签名称" />
            </Form.Item>
            <Form.Item name="color" label="颜色">
              <Select placeholder="请选择颜色">
                <Option value="#1890ff">蓝色</Option>
                <Option value="#52c41a">绿色</Option>
                <Option value="#faad14">橙色</Option>
                <Option value="#f5222d">红色</Option>
                <Option value="#722ed1">紫色</Option>
                <Option value="#13c2c2">青色</Option>
                <Option value="#eb2f96">粉色</Option>
                <Option value="#fa8c16">金色</Option>
              </Select>
            </Form.Item>
          </>
        );
      case 'users':
        return (
          <>
            <Form.Item
              name="userName"
              label="用户名"
              rules={[{ required: true, message: '请输入用户名' }]}
            >
              <Input placeholder="请输入用户名" />
            </Form.Item>
            <Form.Item
              name="realName"
              label="真实姓名"
              rules={[{ required: true, message: '请输入真实姓名' }]}
            >
              <Input placeholder="请输入真实姓名" />
            </Form.Item>
            <Form.Item
              name="role"
              label="角色"
              rules={[{ required: true, message: '请选择角色' }]}
            >
              <Select placeholder="请选择角色">
                <Option value="Admin">管理员</Option>
                <Option value="DataEntry">录入员</Option>
                <Option value="Reviewer">审核员</Option>
                <Option value="Processor">处理员</Option>
                <Option value="FinalReviewer">复盘员</Option>
                <Option value="Nurse">护士</Option>
                <Option value="Therapist">治疗师</Option>
              </Select>
            </Form.Item>
            <Form.Item name="department" label="部门">
              <Input placeholder="请输入部门" />
            </Form.Item>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div>
      <Card>
        <Tabs defaultActiveKey="rejectionReasons" items={settingsTabs} />
      </Card>

      <Modal
        title={editingItem ? '编辑' : '新增'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        okText="保存"
        cancelText="取消"
        width={500}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          {getFormFields()}
        </Form>
      </Modal>
    </div>
  );
};

export default SettingsPage;
