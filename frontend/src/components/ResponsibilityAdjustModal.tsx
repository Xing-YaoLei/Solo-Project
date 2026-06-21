import React, { useState } from 'react';
import { Modal, TextArea, Toast } from 'antd-mobile';
import { Select } from 'antd';
import {
  ResponsibleParty,
  RESPONSIBLE_PARTY_LABEL_MAP,
} from '@/types';
import { useVerificationStore } from '@/store/verificationStore';
import type { ResponsibilityAdjustmentDto } from '@/types';

interface ResponsibilityAdjustModalProps {
  visible: boolean;
  verificationRecordId: string;
  currentResponsibility: ResponsibleParty;
  onCancel: () => void;
  onOk: () => void;
}

const RESPONSIBILITY_OPTIONS = Object.entries(RESPONSIBLE_PARTY_LABEL_MAP).map(
  ([value, label]) => ({ value, label })
);

const ResponsibilityAdjustModal: React.FC<ResponsibilityAdjustModalProps> = ({
  visible,
  verificationRecordId,
  currentResponsibility,
  onCancel,
  onOk,
}) => {
  const { adjustResponsibility } = useVerificationStore();

  const [newResponsibility, setNewResponsibility] = useState<ResponsibleParty>(
    currentResponsibility
  );
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const [supplementaryNotes, setSupplementaryNotes] = useState('');

  const handleOk = async () => {
    if (!adjustmentReason.trim()) {
      Toast.show('请填写调整原因');
      return;
    }

    const dto: ResponsibilityAdjustmentDto = {
      finalResponsibility: newResponsibility,
      adjustmentReason: adjustmentReason.trim(),
      supplementaryNotes: supplementaryNotes.trim() || undefined,
    };

    await adjustResponsibility(verificationRecordId, dto);
    Toast.show({ icon: 'success', content: '责任归属已调整' });
    resetForm();
    onOk();
  };

  const resetForm = () => {
    setNewResponsibility(currentResponsibility);
    setAdjustmentReason('');
    setSupplementaryNotes('');
  };

  const handleCancel = () => {
    resetForm();
    onCancel();
  };

  return (
    <Modal
      visible={visible}
      onClose={handleCancel}
      title="责任归属调整"
      content={
        <div className="resp-adjust-modal">
          <div className="resp-adjust-modal__field">
            <label>当前责任归属</label>
            <div className="resp-adjust-modal__current">
              {RESPONSIBLE_PARTY_LABEL_MAP[currentResponsibility]}
            </div>
          </div>

          <div className="resp-adjust-modal__field">
            <label>新责任归属</label>
            <Select
              value={newResponsibility}
              onChange={(val) => setNewResponsibility(val as ResponsibleParty)}
              options={RESPONSIBILITY_OPTIONS}
              style={{ width: '100%' }}
            />
          </div>

          <div className="resp-adjust-modal__field">
            <label>调整原因</label>
            <TextArea
              placeholder="请说明调整原因"
              value={adjustmentReason}
              onChange={setAdjustmentReason}
              rows={3}
            />
          </div>

          <div className="resp-adjust-modal__field">
            <label>补充说明（被指派角色）</label>
            <TextArea
              placeholder="请输入补充说明"
              value={supplementaryNotes}
              onChange={setSupplementaryNotes}
              rows={2}
            />
          </div>
        </div>
      }
      actions={[
        {
          key: 'cancel',
          text: '取消',
          onClick: handleCancel,
        },
        {
          key: 'submit',
          text: '确认调整',
          onClick: handleOk,
        },
      ]}
    />
  );
};

export default ResponsibilityAdjustModal;
