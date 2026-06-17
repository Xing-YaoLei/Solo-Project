import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, message } from 'antd';
import { paymentAPI } from '../../services/api';
import { PaymentRecord } from '../../types';

interface CommentModalProps {
  open: boolean;
  record: PaymentRecord | null;
  onCancel: () => void;
  onSuccess?: () => void;
}

const CommentModal: React.FC<CommentModalProps> = ({
  open,
  record,
  onCancel,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && record) {
      form.setFieldsValue({
        comment: record.comment || '',
      });
    }
  }, [open, record, form]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      if (!record) return;

      setLoading(true);
      await paymentAPI.addComment(record.id, values.comment);
      message.success('备注添加成功');
      onSuccess?.();
      onCancel();
    } catch (error) {
      if ((error as Error).message !== 'Validation failed') {
        message.error('备注添加失败');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  return (
    <Modal
      title="租金逾期注释"
      open={open}
      onOk={handleOk}
      onCancel={handleCancel}
      confirmLoading={loading}
      okText="保存"
      cancelText="取消"
      width={500}
    >
      {record && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ marginBottom: 8 }}>
            <strong>支付人：</strong>
            {record.payer}
          </div>
          <div style={{ marginBottom: 8 }}>
            <strong>金额：</strong>
            {record.amount.toLocaleString('zh-CN', {
              style: 'currency',
              currency: 'CNY',
            })}
          </div>
          <div style={{ marginBottom: 8 }}>
            <strong>逾期天数：</strong>
            <span style={{ color: '#ff4d4f' }}>{record.overdueDays} 天</span>
          </div>
          <div style={{ marginBottom: 8 }}>
            <strong>类型：</strong>
            {record.type}
          </div>
        </div>
      )}
      <Form form={form} layout="vertical">
        <Form.Item
          name="comment"
          label="备注说明"
          rules={[
            { required: true, message: '请输入备注内容' },
            { max: 500, message: '备注内容不能超过500字' },
          ]}
        >
          <Input.TextArea
            rows={4}
            placeholder="请输入逾期原因或其他说明..."
            showCount
            maxLength={500}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default CommentModal;
