import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  NavBar,
  Steps,
  Card,
  Tag,
  Modal,
  TextArea,
  Button,
  Space,
  Toast,
  Dialog,
  DotLoading,
} from 'antd-mobile';
import {
  EnvironmentOutline,
  ClockCircleOutline,
  UserOutline,
  StarOutline,
} from 'antd-mobile-icons';
import { Badge, Upload, Select, Timeline } from 'antd';
import dayjs from 'dayjs';
import { useVerificationStore } from '@/store/verificationStore';
import {
  VerificationStatus,
  VerificationStage,
  STATUS_LABEL_MAP,
  STATUS_COLOR_MAP,
  STAGE_LABEL_MAP,
} from '@/types';
import DamageReportModal from '@/components/DamageReportModal';
import ResponsibilityAdjustModal from '@/components/ResponsibilityAdjustModal';
import './MobileRecordDetail.css';

const RATING_TAG_OPTIONS = [
  '外观异常',
  '需关注',
  '包装破损',
  '客户投诉',
  '清单不符',
  '正常',
  '严重损坏',
  '客户拒收',
  '需补充材料',
];

const MobileRecordDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    currentRecord,
    detailLoading,
    fetchRecordById,
    confirmRecord,
    supplementRecord,
    closeRecord,
  } = useVerificationStore();

  const [supplementVisible, setSupplementVisible] = useState(false);
  const [supplementRemark, setSupplementRemark] = useState('');
  const [supplementTags, setSupplementTags] = useState<string[]>([]);
  const [damageModalVisible, setDamageModalVisible] = useState(false);
  const [respAdjustVisible, setRespAdjustVisible] = useState(false);

  useEffect(() => {
    if (id) fetchRecordById(id);
  }, [id]);

  if (detailLoading || !currentRecord) {
    return (
      <div className="mobile-detail__loading">
        <DotLoading color="primary" />
        <span>加载中...</span>
      </div>
    );
  }

  const record = currentRecord;
  const isDamaged = record.status === VerificationStatus.Damaged;
  const isClosed = record.status === VerificationStatus.Closed;
  const isCancelled = record.status === VerificationStatus.Cancelled;
  const canConfirm = record.status === VerificationStatus.Pending || record.status === VerificationStatus.Assigned;
  const canSupplement = !isClosed && !isCancelled;
  const canClose = !isClosed && !isCancelled;

  const stageIndex = Object.values(VerificationStage).indexOf(record.stage);

  const handleConfirm = async () => {
    if (!id) return;
    const result = await Dialog.confirm({
      content: '确认该核验记录？',
    });
    if (result) {
      await confirmRecord(id, {});
      Toast.show({ icon: 'success', content: '已确认' });
    }
  };

  const handleClose = async () => {
    if (!id) return;
    const result = await Dialog.confirm({
      content: '确定关闭该核验记录？关闭后不可恢复。',
    });
    if (result) {
      await closeRecord(id, {});
      Toast.show({ icon: 'success', content: '已关闭' });
    }
  };

  const handleSupplement = async () => {
    if (!id) return;
    await supplementRecord(id, {
      remark: supplementRemark || undefined,
      ratingTags: supplementTags.length > 0 ? supplementTags : undefined,
    });
    setSupplementVisible(false);
    setSupplementRemark('');
    setSupplementTags([]);
    Toast.show({ icon: 'success', content: '已补充' });
  };

  const toggleSupplementTag = (tag: string) => {
    setSupplementTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  return (
    <div className="mobile-detail">
      <NavBar onBack={() => navigate(-1)} className="mobile-detail__navbar">
        {record.recordNo}
      </NavBar>

      <div className="mobile-detail__content">
        <div className="mobile-detail__steps">
          <Steps current={stageIndex}>
            <Steps.Step title="录入" />
            <Steps.Step title="动作" />
            <Steps.Step title="复盘" />
          </Steps>
        </div>

        <Card title="订单信息" className="mobile-detail__card">
          <div className="detail-info__row">
            <EnvironmentOutline className="detail-info__icon" />
            <span className="detail-info__label">取件地址:</span>
            <span>{record.order?.pickupAddress ?? '--'}</span>
          </div>
          <div className="detail-info__row">
            <EnvironmentOutline className="detail-info__icon" />
            <span className="detail-info__label">收件地址:</span>
            <span>{record.order?.deliveryAddress ?? '--'}</span>
          </div>
          <div className="detail-info__row">
            <span className="detail-info__label">订单号:</span>
            <span>{record.order?.orderNumber ?? '--'}</span>
          </div>
        </Card>

        <Card title="骑手信息" className="mobile-detail__card">
          <div className="detail-info__row">
            <UserOutline className="detail-info__icon" />
            <span className="detail-info__label">姓名:</span>
            <span>{record.rider?.name ?? '--'}</span>
          </div>
          <div className="detail-info__row">
            <span className="detail-info__label">电话:</span>
            <span>{record.rider?.phone ?? '--'}</span>
          </div>
          <div className="detail-info__row">
            <span className="detail-info__label">工号:</span>
            <span>{record.rider?.employeeNo ?? '--'}</span>
          </div>
          <div className="detail-info__row">
            <StarOutline className="detail-info__icon" />
            <span className="detail-info__label">评分:</span>
            <span>{record.rider?.rating ?? '--'}</span>
          </div>
          <div className="detail-info__row">
            <span className="detail-info__label">配送总量:</span>
            <span>{record.rider?.totalDeliveries ?? '--'}</span>
          </div>
          <div className="detail-info__row">
            <span className="detail-info__label">损坏次数:</span>
            <span style={{ color: '#ff3141' }}>
              {record.rider?.damageIncidents ?? '--'}
            </span>
          </div>
        </Card>

        {record.photos.length > 0 && (
          <Card title="核验照片" className="mobile-detail__card">
            <div className="detail-photos">
              {record.photos.map((photo) => (
                <div key={photo.id} className="detail-photos__item">
                  <img
                    src={photo.photoUrl}
                    alt={photo.photoType}
                    className="detail-photos__img"
                  />
                  {photo.isDamagePhoto && (
                    <Tag color="danger" className="detail-photos__tag">
                      损坏
                    </Tag>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}

        {record.ratingTags.length > 0 && (
          <Card title="评价标签" className="mobile-detail__card">
            <Space wrap>
              {record.ratingTags.map((tag) => (
                <Tag key={tag} round color="primary" fill="outline">
                  {tag}
                </Tag>
              ))}
            </Space>
          </Card>
        )}

        {record.riderTrajectory && (
          <Card title="骑手轨迹" className="mobile-detail__card">
            <p className="detail-trajectory">{record.riderTrajectory}</p>
          </Card>
        )}

        {record.timePoints.length > 0 && (
          <Card title="关键时间点" className="mobile-detail__card">
            <Timeline
              items={record.timePoints.map((tp) => ({
                children: (
                  <div className="detail-timeline__item">
                    <div className="detail-timeline__desc">
                      {tp.description}
                    </div>
                    <div className="detail-timeline__time">
                      {dayjs(tp.pointTime).format('YYYY-MM-DD HH:mm')}
                    </div>
                    {tp.operatorName && (
                      <div className="detail-timeline__operator">
                        操作人: {tp.operatorName}
                      </div>
                    )}
                  </div>
                ),
              }))}
            />
          </Card>
        )}

        {record.remark && (
          <Card title="备注" className="mobile-detail__card">
            <p className="detail-remark">{record.remark}</p>
          </Card>
        )}

        {isDamaged && record.damageReports.length > 0 && (
          <Card title="损坏报告" className="mobile-detail__card">
            {record.damageReports.map((dr) => (
              <div key={dr.id} className="detail-damage">
                <div className="detail-info__row">
                  <span className="detail-info__label">影响范围:</span>
                  <span>{dr.damageRange}</span>
                </div>
                <div className="detail-info__row">
                  <span className="detail-info__label">严重程度:</span>
                  <Tag color={dr.severity === 'Critical' ? '#8b0000' : 'red'}>
                    {dr.severity}
                  </Tag>
                </div>
                <div className="detail-info__row">
                  <span className="detail-info__label">损坏描述:</span>
                  <span>{dr.damageDescription}</span>
                </div>
                <div className="detail-info__row">
                  <span className="detail-info__label">受影响物品:</span>
                  <Space wrap>
                    {dr.affectedItems.map((item) => (
                      <Tag key={item} fill="outline" color="danger">
                        {item}
                      </Tag>
                    ))}
                  </Space>
                </div>
                <div className="detail-info__row">
                  <span className="detail-info__label">初步责任:</span>
                  <span>{dr.initialResponsibility}</span>
                </div>
                {dr.finalResponsibility && (
                  <div className="detail-info__row">
                    <span className="detail-info__label">最终责任:</span>
                    <span>{dr.finalResponsibility}</span>
                  </div>
                )}
              </div>
            ))}
            <Button
              block
              size="small"
              fill="outline"
              color="primary"
              style={{ marginTop: 12 }}
              onClick={() => setRespAdjustVisible(true)}
            >
              调整责任归属
            </Button>
          </Card>
        )}

        {isDamaged && (
          <Button
            block
            fill="outline"
            color="danger"
            size="small"
            style={{ margin: '12px 0' }}
            onClick={() => setDamageModalVisible(true)}
          >
            报告损坏
          </Button>
        )}

        <div className="mobile-detail__bottom-spacer" />
      </div>

      <div className="mobile-detail__footer">
        {canConfirm && (
          <Button
            block
            color="primary"
            size="large"
            onClick={handleConfirm}
          >
            确认
          </Button>
        )}
        {canSupplement && (
          <Button
            block
            fill="outline"
            color="primary"
            size="large"
            onClick={() => setSupplementVisible(true)}
          >
            补充
          </Button>
        )}
        {canClose && (
          <Button
            block
            fill="outline"
            color="danger"
            size="large"
            onClick={handleClose}
          >
            关闭
          </Button>
        )}
      </div>

      <Modal
        visible={supplementVisible}
        onClose={() => setSupplementVisible(false)}
        title="补充信息"
        content={
          <div className="supplement-modal">
            <div className="supplement-modal__field">
              <label>备注</label>
              <TextArea
                placeholder="请输入补充备注"
                value={supplementRemark}
                onChange={setSupplementRemark}
                rows={3}
              />
            </div>
            <div className="supplement-modal__field">
              <label>上传附件</label>
              <Upload maxCount={5} listType="picture-card">
                <div style={{ color: '#999', fontSize: 12 }}>+ 上传</div>
              </Upload>
            </div>
            <div className="supplement-modal__field">
              <label>标签选择</label>
              <Space wrap>
                {RATING_TAG_OPTIONS.map((tag) => (
                  <Tag
                    key={tag}
                    round
                    color={supplementTags.includes(tag) ? 'primary' : 'default'}
                    fill={supplementTags.includes(tag) ? 'solid' : 'outline'}
                    onClick={() => toggleSupplementTag(tag)}
                    style={{ cursor: 'pointer' }}
                  >
                    {tag}
                  </Tag>
                ))}
              </Space>
            </div>
          </div>
        }
        actions={[
          {
            key: 'cancel',
            text: '取消',
            onClick: () => setSupplementVisible(false),
          },
          {
            key: 'submit',
            text: '提交',
            
            onClick: handleSupplement,
          },
        ]}
      />

      <DamageReportModal
        visible={damageModalVisible}
        verificationRecordId={record.id}
        onCancel={() => setDamageModalVisible(false)}
        onOk={() => {
          setDamageModalVisible(false);
          if (id) fetchRecordById(id);
        }}
      />

      <ResponsibilityAdjustModal
        visible={respAdjustVisible}
        verificationRecordId={record.id}
        currentResponsibility={
          record.damageReports[0]?.initialResponsibility ?? 'Undetermined'
        }
        onCancel={() => setRespAdjustVisible(false)}
        onOk={() => {
          setRespAdjustVisible(false);
          if (id) fetchRecordById(id);
        }}
      />
    </div>
  );
};

export default MobileRecordDetail;
