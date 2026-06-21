import React, { useState } from 'react';
import { Modal, Input, TextArea, Tag, Space, Radio, Toast } from 'antd-mobile';
import { Select, Upload } from 'antd';
import {
  DamageRange,
  DamageSeverity,
  ResponsibleParty,
  DAMAGE_RANGE_LABEL_MAP,
  DAMAGE_SEVERITY_LABEL_MAP,
  DAMAGE_SEVERITY_COLOR_MAP,
  RESPONSIBLE_PARTY_LABEL_MAP,
} from '@/types';
import { useVerificationStore } from '@/store/verificationStore';
import type { DamageReportDto } from '@/types';

interface DamageReportModalProps {
  visible: boolean;
  verificationRecordId: string;
  onCancel: () => void;
  onOk: () => void;
}

const DAMAGE_RANGE_OPTIONS = Object.entries(DAMAGE_RANGE_LABEL_MAP).map(
  ([value, label]) => ({ value, label })
);

const DAMAGE_SEVERITY_OPTIONS = Object.entries(DAMAGE_SEVERITY_LABEL_MAP).map(
  ([value, label]) => ({ value, label })
);

const RESPONSIBILITY_OPTIONS = Object.entries(RESPONSIBLE_PARTY_LABEL_MAP).map(
  ([value, label]) => ({ value, label })
);

const DamageReportModal: React.FC<DamageReportModalProps> = ({
  visible,
  verificationRecordId,
  onCancel,
  onOk,
}) => {
  const { reportDamage } = useVerificationStore();

  const [damageRange, setDamageRange] = useState<DamageRange>(DamageRange.SingleItem);
  const [severity, setSeverity] = useState<DamageSeverity>(DamageSeverity.Minor);
  const [description, setDescription] = useState('');
  const [affectedItems, setAffectedItems] = useState<string[]>([]);
  const [newItem, setNewItem] = useState('');
  const [initialResponsibility, setInitialResponsibility] = useState<ResponsibleParty>(
    ResponsibleParty.Undetermined
  );
  const [fileList, setFileList] = useState<any[]>([]);

  const handleAddItem = () => {
    const trimmed = newItem.trim();
    if (!trimmed) return;
    if (affectedItems.includes(trimmed)) {
      Toast.show('物品已存在');
      return;
    }
    setAffectedItems((prev) => [...prev, trimmed]);
    setNewItem('');
  };

  const handleRemoveItem = (item: string) => {
    setAffectedItems((prev) => prev.filter((i) => i !== item));
  };

  const handleOk = async () => {
    if (!description.trim()) {
      Toast.show('请填写损坏描述');
      return;
    }

    const dto: DamageReportDto = {
      damageRange,
      severity,
      damageDescription: description.trim(),
      affectedItems,
      initialResponsibility,
    };

    await reportDamage(verificationRecordId, dto);
    Toast.show({ icon: 'success', content: '损坏报告已提交' });
    resetForm();
    onOk();
  };

  const resetForm = () => {
    setDamageRange(DamageRange.SingleItem);
    setSeverity(DamageSeverity.Minor);
    setDescription('');
    setAffectedItems([]);
    setNewItem('');
    setInitialResponsibility(ResponsibleParty.Undetermined);
    setFileList([]);
  };

  const handleCancel = () => {
    resetForm();
    onCancel();
  };

  return (
    <Modal
      visible={visible}
      onClose={handleCancel}
      title="损坏报告"
      content={
        <div className="damage-report-modal">
          <div className="damage-report-modal__field">
            <label>影响范围</label>
            <Radio.Group
              value={damageRange}
              onChange={(val) => setDamageRange(val as DamageRange)}
            >
              <Space direction="vertical">
                {DAMAGE_RANGE_OPTIONS.map((opt) => (
                  <Radio key={opt.value} value={opt.value}>
                    {opt.label}
                  </Radio>
                ))}
              </Space>
            </Radio.Group>
          </div>

          <div className="damage-report-modal__field">
            <label>损坏严重程度</label>
            <Space wrap>
              {DAMAGE_SEVERITY_OPTIONS.map((opt) => (
                <Tag
                  key={opt.value}
                  color={severity === opt.value ? DAMAGE_SEVERITY_COLOR_MAP[opt.value as DamageSeverity] : 'default'}
                  fill={severity === opt.value ? 'solid' : 'outline'}
                  onClick={() => setSeverity(opt.value as DamageSeverity)}
                  style={{ cursor: 'pointer' }}
                >
                  {opt.label}
                </Tag>
              ))}
            </Space>
          </div>

          <div className="damage-report-modal__field">
            <label>损坏描述</label>
            <TextArea
              placeholder="请描述损坏情况"
              value={description}
              onChange={setDescription}
              rows={3}
            />
          </div>

          <div className="damage-report-modal__field">
            <label>受影响物品</label>
            <div className="damage-report-modal__items-input">
              <Input
                placeholder="输入物品名称"
                value={newItem}
                onChange={setNewItem}
                onEnterPress={handleAddItem}
              />
              <Tag
                color="primary"
                fill="solid"
                onClick={handleAddItem}
                style={{ cursor: 'pointer', marginLeft: 8 }}
              >
                + 添加
              </Tag>
            </div>
            {affectedItems.length > 0 && (
              <Space wrap style={{ marginTop: 8 }}>
                {affectedItems.map((item) => (
                  <Tag
                    key={item}
                    color="danger"
                    fill="outline"
                    onClick={() => handleRemoveItem(item)}
                    style={{ cursor: 'pointer' }}
                  >
                    {item} ×
                  </Tag>
                ))}
              </Space>
            )}
          </div>

          <div className="damage-report-modal__field">
            <label>初步责任归属</label>
            <Select
              value={initialResponsibility}
              onChange={(val) => setInitialResponsibility(val as ResponsibleParty)}
              options={RESPONSIBILITY_OPTIONS}
              style={{ width: '100%' }}
            />
          </div>

          <div className="damage-report-modal__field">
            <label>上传损坏照片</label>
            <Upload
              listType="picture-card"
              maxCount={5}
              fileList={fileList}
              onChange={({ fileList: newList }) => setFileList(newList)}
            >
              <div style={{ color: '#999', fontSize: 12 }}>+ 上传</div>
            </Upload>
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
          text: '提交',
          onClick: handleOk,
        },
      ]}
    />
  );
};

export default DamageReportModal;
