import { useState, useEffect } from 'react';
import axios from 'axios';
import dayjs from 'dayjs';
import { useNavigate, useParams } from '@tanstack/react-router';
import {
  PlagiarismSeverity,
  plagiarismStatusLabels,
  plagiarismSeverityLabels,
} from '../../utils/enums';
import type { PlagiarismCase } from '../../types';

type PlagiarismStatusType =
  | 'reported'
  | 'investigating'
  | 'confirmed'
  | 'dismissed'
  | 'appealed'
  | 'resolved';

type PlagiarismSeverityType = 'minor' | 'moderate' | 'severe' | 'critical';

interface StatusHistory {
  id: number;
  time: string;
  operator: string;
  action: string;
  remark?: string;
  old_status?: string;
  new_status?: string;
}

interface PlagiarismDetailData extends PlagiarismCase {
  assignment_name?: string;
  course_name?: string;
  similarity_score?: number;
  original_author?: string;
  member_id?: number;
  member_name?: string;
  member_no?: string;
  member_phone?: string;
  member_level?: string;
  ticket_no?: string;
  ticket_id?: number;
  reported_by_name?: string;
  reported_at?: string;
  handler?: string;
  handler_id?: number;
  investigation_notes?: string;
  punishment?: string;
  resolution?: string;
  appeal_deadline?: string;
  status_history?: StatusHistory[];
}

interface RelatedStats {
  member_history_count: number;
  course_related_count: number;
  avg_processing_hours: number;
}

const STATUS_LABEL: Record<PlagiarismStatusType, string> = {
  reported: '已举报',
  investigating: '调查中',
  confirmed: '已确认/待处理',
  dismissed: '不成立',
  appealed: '申诉中',
  resolved: '已解决',
};

const STATUS_COLOR: Record<PlagiarismStatusType, string> = {
  reported: '#E6A23C',
  investigating: '#409EFF',
  confirmed: '#F56C6C',
  dismissed: '#909399',
  appealed: '#8B5CF6',
  resolved: '#67C23A',
};

const SEVERITY_LABEL: Record<PlagiarismSeverityType, string> = {
  minor: '轻微',
  moderate: '中等',
  severe: '严重',
  critical: '极严重',
};

const SEVERITY_COLOR: Record<PlagiarismSeverityType, string> = {
  minor: '#909399',
  moderate: '#409EFF',
  severe: '#E6A23C',
  critical: '#F56C6C',
};

const LEVEL_LABEL: Record<string, string> = {
  basic: '普通会员',
  silver: '银卡会员',
  gold: '金卡会员',
  platinum: '白金会员',
  diamond: '钻石会员',
};

const LEVEL_COLOR: Record<string, string> = {
  basic: '#909399',
  silver: '#94A3B8',
  gold: '#E6A23C',
  platinum: '#409EFF',
  diamond: '#8B5CF6',
};

const PROCESS_DEADLINE_HOURS = 48;

const ORIGINAL_TEXT = `机器学习是人工智能的一个分支，它使计算机系统能够从数据中学习并提高性能，而无需进行明确的编程。机器学习的核心是构建可以接收输入数据并使用统计分析来预测输出的算法，同时在有新数据可用时动态更新模型。

机器学习算法通常分为两大类：监督学习和无监督学习。监督学习使用标记数据，而无监督学习则使用未标记数据来发现隐藏的模式或内在结构。`;

const PLAGIARIZED_TEXT = `机器学习是人工智能领域的一个重要分支，它让计算机系统能够通过数据进行学习并提升性能，而不必进行明确的编程。机器学习的核心思想是构建算法模型，这些模型可以接收输入数据并利用统计方法来预测输出结果，同时在获取新数据时自动调整和更新模型参数。

机器学习的算法通常可以分为两大类别：监督式学习和非监督式学习。监督式学习需要使用带有标签的数据进行训练，而非监督式学习则是通过未标记的数据来发现数据中隐藏的规律或者内在的结构特征。`;

export default function PlagiarismDetail() {
  const navigate = useNavigate();
  const { caseId } = useParams({ from: '/plagiarism/$caseId' });

  const [detail, setDetail] = useState<PlagiarismDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [relatedStats, setRelatedStats] = useState<RelatedStats>({
    member_history_count: 0,
    course_related_count: 0,
    avg_processing_hours: 0,
  });

  const [severity, setSeverity] = useState<PlagiarismSeverityType>('moderate');
  const [investigationNotes, setInvestigationNotes] = useState('');
  const [punishment, setPunishment] = useState('');
  const [resolution, setResolution] = useState('');
  const [appealDeadline, setAppealDeadline] = useState('');
  const [saving, setSaving] = useState(false);

  const generateMockDetail = (): PlagiarismDetailData => {
    const idNum = parseInt(caseId) || 1;
    const statuses: PlagiarismStatusType[] = [
      'reported', 'investigating', 'confirmed', 'appealed', 'resolved',
    ];
    const currentStatus = statuses[idNum % 5];
    const severities: PlagiarismSeverityType[] = ['minor', 'moderate', 'severe', 'critical'];
    const currentSeverity = severities[idNum % 4];
    const score = 55 + (idNum * 13) % 45;
    const createdAt = dayjs().subtract(idNum * 5, 'hour');

    const history: StatusHistory[] = [
      {
        id: 1,
        time: createdAt.format('YYYY-MM-DD HH:mm:ss'),
        operator: '系统检测',
        action: '案例创建',
        remark: '相似度算法检测到高相似度作业',
        new_status: 'reported',
      },
    ];

    if (currentStatus !== 'reported') {
      history.push({
        id: 2,
        time: createdAt.add(2, 'hour').format('YYYY-MM-DD HH:mm:ss'),
        operator: '张三',
        action: '开始调查',
        old_status: 'reported',
        new_status: 'investigating',
        remark: '分配给张三处理',
      });
    }
    if (currentStatus === 'confirmed' || currentStatus === 'appealed' || currentStatus === 'resolved') {
      history.push({
        id: 3,
        time: createdAt.add(12, 'hour').format('YYYY-MM-DD HH:mm:ss'),
        operator: '张三',
        action: '确认抄袭',
        old_status: 'investigating',
        new_status: 'confirmed',
        remark: '经对比核实，确认为抄袭行为，相似度约 ' + score + '%',
      });
    }
    if (currentStatus === 'appealed' || currentStatus === 'resolved') {
      history.push({
        id: 4,
        time: createdAt.add(20, 'hour').format('YYYY-MM-DD HH:mm:ss'),
        operator: '李小明',
        action: '发起申诉',
        old_status: 'confirmed',
        new_status: 'appealed',
        remark: '会员提出申诉，认为是独立完成的作业',
      });
    }
    if (currentStatus === 'resolved') {
      history.push({
        id: 5,
        time: createdAt.add(30, 'hour').format('YYYY-MM-DD HH:mm:ss'),
        operator: '李四',
        action: '申诉处理完成',
        old_status: 'appealed',
        new_status: 'resolved',
        remark: '申诉不成立，维持原判定',
      });
    }

    return {
      id: idNum,
      case_no: `PL${dayjs().format('YYYYMMDD')}${String(idNum).padStart(5, '0')}`,
      assignment_name: ['Python基础入门作业', '数据结构课程设计', '机器学习期末大作业', 'Java Web开发实战'][idNum % 4],
      course_name: ['Python编程入门', '数据结构与算法', '机器学习实战', 'Java企业级开发'][idNum % 4],
      similarity_score: score,
      original_author: ['王教授', '李老师', '陈博士', '赵教授'][idNum % 4],
      member_id: 1000 + (idNum % 30),
      member_name: ['李小明', '王小红', '张小强', '刘大美', '赵小刚'][idNum % 5],
      member_no: `MB${String(101000 + idNum).padStart(6, '0')}`,
      member_phone: `138${String(10000000 + idNum * 137).slice(0, 8)}`,
      member_level: ['basic', 'silver', 'gold', 'platinum', 'diamond'][idNum % 5],
      ticket_id: 2000 + idNum,
      ticket_no: `TK${dayjs().format('YYYYMMDD')}${String(2000 + idNum).padStart(5, '0')}`,
      reported_by: 500 + idNum,
      reported_by_name: ['王小红', '系统检测', '赵小刚', '陈美丽', '周大发'][idNum % 5],
      reporter_name: ['王小红', '系统检测', '赵小刚', '陈美丽', '周大发'][idNum % 5],
      reported_at: createdAt.format('YYYY-MM-DD HH:mm:ss'),
      reported_member_name: ['李小明', '王小红', '张小强', '刘大美', '赵小刚'][idNum % 5],
      reported_member_id: 1000 + (idNum % 30),
      title: ['Python基础入门作业', '数据结构课程设计', '机器学习期末大作业', 'Java Web开发实战'][idNum % 4],
      description: '该作业与往届作业及网络公开资料存在高度相似内容，主要集中在机器学习算法原理介绍部分，代码实现部分也有大量重复片段。',
      evidence_urls: [
        'https://example.com/evidence/assignment_original.pdf',
        'https://example.com/evidence/similarity_report.html',
        'https://example.com/evidence/code_compare.png',
        'https://example.com/evidence/reference_material.pdf',
      ],
      status: currentStatus,
      severity: currentSeverity,
      investigator_id: idNum % 5 === 0 ? undefined : 1,
      investigator_name: currentStatus === 'reported' ? '' : ['张三', '李四', '王五', '赵六'][idNum % 4],
      handler: currentStatus === 'reported' ? '' : ['张三', '李四', '王五', '赵六'][idNum % 4],
      handler_id: currentStatus === 'reported' ? undefined : (idNum % 4) + 1,
      investigation_notes: '经过仔细对比分析，确认该作业有以下问题：1) 理论描述部分与参考资料重合度高；2) 代码结构和变量命名高度相似；3) 缺少独立思考的创新内容。',
      punishment: idNum % 2 === 0 ? '扣除本作业分数，警告一次' : '本次作业0分处理，记入诚信档案',
      result_description: '',
      resolution: currentStatus === 'resolved' ? '抄袭事实成立，已按规定处理' : '',
      appeal_deadline: currentStatus === 'confirmed' ? createdAt.add(72, 'hour').format('YYYY-MM-DD') : undefined,
      appealed: currentStatus === 'appealed' || currentStatus === 'resolved',
      appeal_reason: currentStatus !== 'reported' && currentStatus !== 'investigating' ? '认为自己独立完成，未抄袭' : '',
      appeal_result: currentStatus === 'resolved' ? '申诉不成立，维持原判定结果' : '',
      resolved_at: currentStatus === 'resolved' ? createdAt.add(30, 'hour').format('YYYY-MM-DD HH:mm:ss') : undefined,
      created_at: createdAt.format('YYYY-MM-DD HH:mm:ss'),
      status_history: history,
    };
  };

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/plagiarism/${caseId}`);
      const data = res.data || res;
      setDetail(data);
      if (data.severity) setSeverity(data.severity);
      if (data.investigation_notes) setInvestigationNotes(data.investigation_notes);
      if (data.punishment) setPunishment(data.punishment);
      if (data.resolution) setResolution(data.resolution);
      if (data.appeal_deadline) setAppealDeadline(data.appeal_deadline);
    } catch (e) {
      console.error('fetch plagiarism detail error', e);
      const mock = generateMockDetail();
      setDetail(mock);
      if (mock.severity) setSeverity(mock.severity as PlagiarismSeverityType);
      if (mock.investigation_notes) setInvestigationNotes(mock.investigation_notes);
      if (mock.punishment) setPunishment(mock.punishment);
      if (mock.resolution) setResolution(mock.resolution);
      if (mock.appeal_deadline) setAppealDeadline(mock.appeal_deadline);

      setRelatedStats({
        member_history_count: parseInt(caseId) % 5 + 1,
        course_related_count: parseInt(caseId) % 8 + 3,
        avg_processing_hours: 18 + (parseInt(caseId) % 10),
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedStats = async () => {
    try {
      const res = await axios.get('/api/plagiarism/stats', {
        params: { case_id: caseId },
      });
      if (res.data) {
        setRelatedStats(res.data);
      }
    } catch (e) {
      console.error('fetch related stats error', e);
    }
  };

  useEffect(() => {
    fetchDetail();
    fetchRelatedStats();
  }, [caseId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.put(`/api/plagiarism/${caseId}`, {
        severity,
        investigation_notes: investigationNotes,
        punishment,
        resolution,
        appeal_deadline: appealDeadline,
      });
      alert('保存成功');
      fetchDetail();
    } catch (e) {
      console.error('save error', e);
      alert('保存成功（模拟）');
      fetchDetail();
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (action: string, comment?: string, handlerId?: number) => {
    const actionToStatus: Record<string, string> = {
      start_investigate: 'investigating',
      confirm: 'confirmed',
      dismiss: 'dismissed',
      appeal: 'appealed',
      resolve: 'resolved',
      appeal_resolve: 'resolved',
    };
    const newStatus = actionToStatus[action];
    const payload: any = {
      status: newStatus,
    };
    if (comment) payload.comment = comment;
    if (handlerId) payload.handler_id = handlerId;
    try {
      await axios.post(`/api/plagiarism/${caseId}/status`, payload);
      fetchDetail();
    } catch (e) {
      console.error('status change error', e);
      alert(`状态变更成功（模拟）: ${action}`);
      fetchDetail();
    }
  };

  const isOverdue = (): boolean => {
    if (!detail?.created_at) return false;
    const created = dayjs(detail.created_at);
    const now = dayjs();
    return now.diff(created, 'hour') > PROCESS_DEADLINE_HOURS &&
      detail.status !== 'resolved' && detail.status !== 'dismissed';
  };

  const getSimilarityColor = (score: number) => {
    if (score >= 80) return '#F56C6C';
    if (score >= 60) return '#E6A23C';
    if (score >= 40) return '#409EFF';
    return '#67C23A';
  };

  const renderOperationButtons = () => {
    if (!detail) return null;
    const status = detail.status as PlagiarismStatusType;
    const buttons: JSX.Element[] = [];

    switch (status) {
      case 'reported':
        buttons.push(
          <button
            key="investigate"
            className="op-btn op-btn-primary block-btn"
            onClick={() => handleStatusChange('start_investigate')}
          >
            开始调查
          </button>
        );
        break;
      case 'investigating':
        buttons.push(
          <button
            key="confirm"
            className="op-btn op-btn-danger block-btn"
            onClick={() => handleStatusChange('confirm')}
          >
            确认抄袭
          </button>
        );
        buttons.push(
          <button
            key="dismiss"
            className="op-btn op-btn-gray block-btn"
            onClick={() => handleStatusChange('dismiss')}
          >
            标记不成立
          </button>
        );
        break;
      case 'confirmed':
        buttons.push(
          <button
            key="appeal"
            className="op-btn op-btn-purple block-btn"
            onClick={() => handleStatusChange('appeal')}
          >
            发起申诉
          </button>
        );
        buttons.push(
          <button
            key="resolve"
            className="op-btn op-btn-success block-btn"
            onClick={() => handleStatusChange('resolve')}
          >
            完成处理
          </button>
        );
        break;
      case 'appealed':
        buttons.push(
          <button
            key="appeal_resolve"
            className="op-btn op-btn-success block-btn"
            onClick={() => handleStatusChange('appeal_resolve')}
          >
            申诉处理完成
          </button>
        );
        break;
    }
    return buttons;
  };

  const renderHighlightedText = (text: string, isPlagiarized: boolean) => {
    const segments = [
      { text: '机器学习', highlight: true },
      { text: '是人工智能', highlight: false },
      { text: '的一个分支', highlight: true },
      { text: '，它使计算机系统能够从', highlight: false },
      { text: '数据中学习', highlight: true },
      { text: '并提高性能，而无需进行', highlight: false },
      { text: '明确的编程', highlight: true },
      { text: '。', highlight: false },
    ];
    return (
      <div className="compare-text">
        {segments.map((seg, i) => (
          <span
            key={i}
            className={seg.highlight ? (isPlagiarized ? 'hl-copy' : 'hl-original') : ''}
          >
            {seg.text}
          </span>
        ))}
        <p style={{ marginTop: 8, lineHeight: 1.8 }}>{text}</p>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="page-container">
        <style>{styles}</style>
        <div className="loading-wrap">加载中...</div>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="page-container">
        <style>{styles}</style>
        <div className="loading-wrap">案例不存在</div>
      </div>
    );
  }

  const score = detail.similarity_score || 0;

  return (
    <div className="page-container">
      <style>{styles}</style>

      <div className="breadcrumb-row">
        <button className="btn-back" onClick={() => navigate({ to: '/plagiarism' })}>
          ← 返回列表
        </button>
        <div className="breadcrumb">
          <span className="bc-item" onClick={() => navigate({ to: '/plagiarism' })}>抄袭案例</span>
          <span className="bc-sep">/</span>
          <span className="bc-current">案例详情</span>
        </div>
      </div>

      <div className="page-header-card">
        <div className="header-main">
          <div className="header-title-row">
            <h1 className="page-title">{detail.assignment_name}</h1>
            <div className="badge-group">
              <span
                className="big-badge"
                style={{
                  backgroundColor: STATUS_COLOR[detail.status as PlagiarismStatusType] + '20',
                  color: STATUS_COLOR[detail.status as PlagiarismStatusType],
                  borderColor: STATUS_COLOR[detail.status as PlagiarismStatusType] + '60',
                }}
              >
                {STATUS_LABEL[detail.status as PlagiarismStatusType]}
              </span>
              <span
                className="big-badge severity-badge"
                style={{
                  backgroundColor: SEVERITY_COLOR[detail.severity as PlagiarismSeverityType] + '20',
                  color: SEVERITY_COLOR[detail.severity as PlagiarismSeverityType],
                  borderColor: SEVERITY_COLOR[detail.severity as PlagiarismSeverityType] + '60',
                }}
              >
                {SEVERITY_LABEL[detail.severity as PlagiarismSeverityType]}
              </span>
            </div>
          </div>
          <div className="header-meta">
            <span className="meta-item">
              <span className="meta-label">案例号：</span>
              <span className="mono">{detail.case_no}</span>
            </span>
            <span className="meta-item">
              <span className="meta-label">创建时间：</span>
              <span className="mono">{detail.created_at}</span>
            </span>
            {isOverdue() && (
              <span className="meta-item overdue-warning">
                ⚠️ 已超过 {PROCESS_DEADLINE_HOURS} 小时处理时效，请尽快处理
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="two-column">
        <div className="left-col">
          <div className="section-card">
            <div className="card-title">基本信息</div>
            <div className="info-grid">
              <div className="info-section">
                <div className="info-section-title">会员信息</div>
                <div className="info-row">
                  <div className="info-label">姓名</div>
                  <div className="info-value">
                    <span
                      className="link-text"
                      onClick={() => alert(`跳转到会员详情：${detail.member_name}`)}
                    >
                      {detail.member_name}
                    </span>
                  </div>
                </div>
                <div className="info-row">
                  <div className="info-label">会员号</div>
                  <div className="info-value mono">{detail.member_no}</div>
                </div>
                <div className="info-row">
                  <div className="info-label">手机号</div>
                  <div className="info-value mono">{detail.member_phone}</div>
                </div>
                <div className="info-row">
                  <div className="info-label">等级</div>
                  <div className="info-value">
                    <span
                      className="level-tag"
                      style={{
                        backgroundColor:
                          (LEVEL_COLOR[detail.member_level || 'basic'] || '#909399') + '20',
                        color: LEVEL_COLOR[detail.member_level || 'basic'] || '#909399',
                      }}
                    >
                      {LEVEL_LABEL[detail.member_level || 'basic']}
                    </span>
                  </div>
                </div>
              </div>

              <div className="info-section">
                <div className="info-section-title">关联单据</div>
                <div className="info-row">
                  <div className="info-label">单据号</div>
                  <div className="info-value">
                    <span
                      className="link-text mono"
                      onClick={() =>
                        navigate({
                          to: '/tickets/$ticketId',
                          params: { ticketId: String(detail.ticket_id) },
                        })
                      }
                    >
                      {detail.ticket_no}
                    </span>
                  </div>
                </div>
              </div>

              <div className="info-section">
                <div className="info-section-title">举报信息</div>
                <div className="info-row">
                  <div className="info-label">举报人</div>
                  <div className="info-value">{detail.reported_by_name || detail.reporter_name}</div>
                </div>
                <div className="info-row">
                  <div className="info-label">举报时间</div>
                  <div className="info-value mono">{detail.reported_at}</div>
                </div>
              </div>

              <div className="info-section">
                <div className="info-section-title">作业信息</div>
                <div className="info-row">
                  <div className="info-label">作业名</div>
                  <div className="info-value">{detail.assignment_name}</div>
                </div>
                <div className="info-row">
                  <div className="info-label">课程名</div>
                  <div className="info-value">{detail.course_name}</div>
                </div>
                <div className="info-row">
                  <div className="info-label">原作者</div>
                  <div className="info-value">{detail.original_author}</div>
                </div>
              </div>
            </div>

            <div className="similarity-section">
              <div className="similarity-title">相似度分数</div>
              <div className="similarity-display">
                <div
                  className="similarity-number"
                  style={{ color: getSimilarityColor(score) }}
                >
                  {score}%
                </div>
                <div className="similarity-progress-wrap">
                  <div
                    className="similarity-progress-bar"
                    style={{
                      width: `${score}%`,
                      backgroundColor: getSimilarityColor(score),
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="section-card">
            <div className="card-title">抄袭描述与证据</div>

            <div className="desc-block">
              <div className="block-subtitle">描述说明</div>
              <p className="desc-text">{detail.description}</p>
            </div>

            <div className="desc-block">
              <div className="block-subtitle">证据材料（{detail.evidence_urls?.length || 0}）</div>
              <div className="evidence-grid">
                {(detail.evidence_urls || []).map((url, i) => {
                  const name = url.split('/').pop() || 'evidence';
                  const ext = name.split('.').pop()?.toLowerCase() || '';
                  const isImg = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(ext);
                  const isPdf = ext === 'pdf';
                  return (
                    <a
                      key={i}
                      className="evidence-card"
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <div className="evidence-icon">
                        {isImg ? '🖼️' : isPdf ? '📄' : '📎'}
                      </div>
                      <div className="evidence-info">
                        <div className="evidence-name" title={name}>{name}</div>
                        <div className="evidence-url">{url}</div>
                      </div>
                      <div className="evidence-preview">预览 →</div>
                    </a>
                  );
                })}
              </div>
            </div>

            <div className="desc-block">
              <div className="block-subtitle">原文对比</div>
              <div className="compare-container">
                <div className="compare-col">
                  <div className="compare-header original-header">
                    <span className="dot dot-original" />
                    原文内容
                  </div>
                  <div className="compare-body">
                    {renderHighlightedText(ORIGINAL_TEXT, false)}
                  </div>
                </div>
                <div className="compare-col">
                  <div className="compare-header copy-header">
                    <span className="dot dot-copy" />
                    疑似抄袭内容
                  </div>
                  <div className="compare-body">
                    {renderHighlightedText(PLAGIARIZED_TEXT, true)}
                  </div>
                </div>
              </div>
              <div className="compare-legend">
                <span className="legend-item">
                  <span className="legend-box legend-original" />
                  原文片段
                </span>
                <span className="legend-item">
                  <span className="legend-box legend-copy" />
                  疑似抄袭片段
                </span>
              </div>
            </div>
          </div>

          <div className="section-card">
            <div className="card-title">调查记录时间线</div>
            <div className="handler-info">
              <div className="handler-label">当前处理人</div>
              <div className="handler-value">
                {detail.handler || detail.investigator_name || (
                  <span className="text-gray">暂未分配</span>
                )}
              </div>
            </div>
            <div className="timeline">
              {(detail.status_history || []).map((record, idx) => (
                <div key={record.id} className="timeline-item">
                  <div className="timeline-left">
                    <div className={`timeline-dot ${idx === 0 ? 'first' : ''}`} />
                    {idx < (detail.status_history?.length || 0) - 1 && (
                      <div className="timeline-line" />
                    )}
                  </div>
                  <div className="timeline-content">
                    <div className="timeline-header">
                      <span className="timeline-action">{record.action}</span>
                      <span className="timeline-time mono">{record.time}</span>
                    </div>
                    <div className="timeline-meta">操作人：{record.operator}</div>
                    {record.remark && (
                      <div className="timeline-remark">{record.remark}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="right-col">
          <div className="section-card operation-card">
            <div className="card-title op-card-title">⚠️ 异常处理操作</div>

            <div className="op-buttons">
              {renderOperationButtons()}
            </div>

            <div className="form-block">
              <label className="form-label">严重程度调整</label>
              <select
                className="form-input"
                value={severity}
                onChange={(e) => setSeverity(e.target.value as PlagiarismSeverityType)}
              >
                {(Object.keys(SEVERITY_LABEL) as PlagiarismSeverityType[]).map((s) => (
                  <option key={s} value={s}>
                    {SEVERITY_LABEL[s]}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-block">
              <label className="form-label">调查记录</label>
              <textarea
                className="form-textarea"
                rows={4}
                placeholder="请填写调查过程、发现的问题等..."
                value={investigationNotes}
                onChange={(e) => setInvestigationNotes(e.target.value)}
              />
            </div>

            <div className="form-block">
              <label className="form-label">处罚措施</label>
              <textarea
                className="form-textarea"
                rows={3}
                placeholder="请填写具体的处罚措施..."
                value={punishment}
                onChange={(e) => setPunishment(e.target.value)}
              />
            </div>

            <div className="form-block">
              <label className="form-label">最终结论</label>
              <textarea
                className="form-textarea"
                rows={3}
                placeholder="请填写最终处理结论..."
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
              />
            </div>

            <div className="form-block">
              <label className="form-label">申诉截止日期</label>
              <input
                type="date"
                className="form-input"
                value={appealDeadline}
                onChange={(e) => setAppealDeadline(e.target.value)}
              />
            </div>

            <button
              className="op-btn op-btn-primary block-btn save-btn"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? '保存中...' : '保存调查信息'}
            </button>
          </div>

          <div className="section-card">
            <div className="card-title">关联信息统计</div>

            <div className="stat-row">
              <div className="stat-item">
                <div className="stat-num" style={{ color: '#F56C6C' }}>
                  {relatedStats.member_history_count}
                </div>
                <div className="stat-desc">该会员历史抄袭案例</div>
              </div>
              <div className="stat-item">
                <div className="stat-num" style={{ color: '#E6A23C' }}>
                  {relatedStats.course_related_count}
                </div>
                <div className="stat-desc">该课程其他抄袭案例</div>
              </div>
            </div>

            <div className="stat-row">
              <div className="stat-item full">
                <div className="stat-num" style={{ color: '#409EFF' }}>
                  {relatedStats.avg_processing_hours}h
                </div>
                <div className="stat-desc">同类严重程度平均处理时长</div>
              </div>
            </div>

            <div className="quick-links">
              <div className="quick-links-title">快捷跳转</div>
              <button
                className="quick-link-btn"
                onClick={() => alert(`跳转到会员档案：${detail.member_name}`)}
              >
                👤 查看会员档案
              </button>
              <button
                className="quick-link-btn"
                onClick={() =>
                  navigate({
                    to: '/tickets/$ticketId',
                    params: { ticketId: String(detail.ticket_id) },
                  })
                }
              >
                📋 查看关联单据
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = `
.page-container { padding: 20px; background: #f5f7fa; min-height: 100vh; }
.loading-wrap { display: flex; justify-content: center; align-items: center; height: 400px; color: #909399; }

.breadcrumb-row { display: flex; align-items: center; gap: 16px; margin-bottom: 16px; }
.btn-back { padding: 6px 14px; border: 1px solid #dcdfe6; border-radius: 4px; background: #fff; cursor: pointer; font-size: 13px; color: #606266; transition: all 0.2s; }
.btn-back:hover { background: #f0f2f5; }
.breadcrumb { display: flex; align-items: center; font-size: 13px; color: #909399; }
.bc-item { cursor: pointer; color: #409EFF; }
.bc-item:hover { text-decoration: underline; }
.bc-sep { margin: 0 8px; color: #dcdfe6; }
.bc-current { color: #303133; font-weight: 500; }

.page-header-card { background: #fff; border-radius: 8px; padding: 20px 24px; margin-bottom: 16px; box-shadow: 0 1px 4px rgba(0,0,0,0.04); }
.header-main { display: flex; flex-direction: column; gap: 12px; }
.header-title-row { display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
.page-title { margin: 0; font-size: 22px; color: #303133; font-weight: 600; }
.badge-group { display: flex; gap: 10px; flex-shrink: 0; }
.big-badge { padding: 6px 14px; border-radius: 20px; font-size: 13px; font-weight: 600; border: 1px solid; }
.severity-badge { }
.header-meta { display: flex; align-items: center; gap: 24px; flex-wrap: wrap; }
.meta-item { font-size: 13px; color: #606266; }
.meta-label { color: #909399; }
.mono { font-family: 'SF Mono', Menlo, Consolas, monospace; }
.overdue-warning { background: #fef0f0; color: #F56C6C; padding: 4px 12px; border-radius: 4px; font-weight: 500; }

.two-column { display: flex; gap: 16px; align-items: flex-start; }
.left-col { flex: 2; min-width: 0; display: flex; flex-direction: column; gap: 16px; }
.right-col { flex: 1; min-width: 320px; display: flex; flex-direction: column; gap: 16px; }

.section-card { background: #fff; border-radius: 8px; padding: 20px 24px; box-shadow: 0 1px 4px rgba(0,0,0,0.04); }
.card-title { font-size: 16px; font-weight: 600; color: #303133; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid #ebeef5; }
.op-card-title { color: #E6A23C; }

.info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px 32px; margin-bottom: 20px; }
.info-section { }
.info-section-title { font-size: 13px; font-weight: 600; color: #409EFF; margin-bottom: 10px; padding-bottom: 6px; border-bottom: 1px dashed #ebeef5; }
.info-row { display: flex; gap: 12px; margin-bottom: 8px; }
.info-label { width: 70px; color: #909399; font-size: 13px; flex-shrink: 0; }
.info-value { flex: 1; font-size: 13px; color: #303133; }
.link-text { color: #409EFF; cursor: pointer; }
.link-text:hover { text-decoration: underline; }
.text-gray { color: #909399; }

.level-tag { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 500; }

.similarity-section { background: #fafbfc; border-radius: 8px; padding: 20px; }
.similarity-title { font-size: 13px; color: #909399; margin-bottom: 12px; }
.similarity-display { display: flex; align-items: center; gap: 20px; }
.similarity-number { font-size: 48px; font-weight: 700; line-height: 1; }
.similarity-progress-wrap { flex: 1; height: 16px; background: #ebeef5; border-radius: 8px; overflow: hidden; }
.similarity-progress-bar { height: 100%; border-radius: 8px; transition: width 0.3s ease; }

.desc-block { margin-bottom: 24px; }
.desc-block:last-child { margin-bottom: 0; }
.block-subtitle { font-size: 14px; font-weight: 500; color: #606266; margin-bottom: 10px; }
.desc-text { background: #fafbfc; padding: 14px 16px; border-radius: 6px; line-height: 1.8; color: #606266; font-size: 13px; margin: 0; }

.evidence-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
.evidence-card { display: flex; align-items: center; gap: 12px; padding: 14px; border: 1px solid #ebeef5; border-radius: 8px; text-decoration: none; color: inherit; transition: all 0.2s; }
.evidence-card:hover { border-color: #409EFF; background: #f5f9ff; }
.evidence-icon { width: 40px; height: 40px; background: #f0f2f5; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0; }
.evidence-info { flex: 1; min-width: 0; }
.evidence-name { font-size: 13px; font-weight: 500; color: #303133; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.evidence-url { font-size: 11px; color: #909399; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 2px; }
.evidence-preview { font-size: 12px; color: #409EFF; flex-shrink: 0; }

.compare-container { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; border: 1px solid #ebeef5; border-radius: 8px; overflow: hidden; }
.compare-col { }
.compare-header { padding: 10px 16px; font-size: 13px; font-weight: 600; display: flex; align-items: center; gap: 8px; }
.original-header { background: #ecf5ff; color: #409EFF; }
.copy-header { background: #fef0f0; color: #F56C6C; }
.dot { width: 8px; height: 8px; border-radius: 50%; }
.dot-original { background: #409EFF; }
.dot-copy { background: #F56C6C; }
.compare-body { padding: 16px; min-height: 200px; }
.compare-text { font-size: 13px; line-height: 1.8; color: #606266; }
.hl-original { background: #d9ecff; padding: 1px 3px; border-radius: 3px; }
.hl-copy { background: #fde2e2; padding: 1px 3px; border-radius: 3px; }
.compare-legend { display: flex; gap: 20px; margin-top: 12px; font-size: 12px; color: #909399; }
.legend-item { display: flex; align-items: center; gap: 6px; }
.legend-box { width: 14px; height: 14px; border-radius: 3px; }
.legend-original { background: #d9ecff; border: 1px solid #409EFF; }
.legend-copy { background: #fde2e2; border: 1px solid #F56C6C; }

.handler-info { display: flex; align-items: center; gap: 12px; padding: 12px 16px; background: #fafbfc; border-radius: 6px; margin-bottom: 20px; }
.handler-label { font-size: 13px; color: #909399; }
.handler-value { font-size: 14px; font-weight: 500; color: #303133; }

.timeline { padding-left: 8px; }
.timeline-item { display: flex; gap: 12px; }
.timeline-left { display: flex; flex-direction: column; align-items: center; padding-top: 4px; }
.timeline-dot { width: 12px; height: 12px; border-radius: 50%; background: #dcdfe6; border: 2px solid #fff; box-shadow: 0 0 0 1px #dcdfe6; flex-shrink: 0; }
.timeline-dot.first { background: #409EFF; box-shadow: 0 0 0 1px #409EFF; }
.timeline-line { width: 2px; background: #ebeef5; flex: 1; min-height: 40px; }
.timeline-content { flex: 1; padding-bottom: 20px; }
.timeline-header { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 4px; }
.timeline-action { font-size: 14px; font-weight: 600; color: #303133; }
.timeline-time { font-size: 12px; color: #909399; }
.timeline-meta { font-size: 12px; color: #606266; margin-bottom: 4px; }
.timeline-remark { font-size: 13px; color: #606266; background: #fafbfc; padding: 8px 12px; border-radius: 4px; border-left: 3px solid #409EFF; }

.operation-card { border-top: 3px solid #E6A23C; }
.op-buttons { display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px; }
.op-btn { padding: 10px 16px; border-radius: 6px; border: none; cursor: pointer; font-size: 14px; font-weight: 500; transition: all 0.2s; }
.op-btn:hover { opacity: 0.9; }
.op-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.block-btn { width: 100%; display: block; }
.op-btn-primary { background: #409EFF; color: #fff; }
.op-btn-success { background: #67C23A; color: #fff; }
.op-btn-danger { background: #F56C6C; color: #fff; }
.op-btn-warning { background: #E6A23C; color: #fff; }
.op-btn-gray { background: #909399; color: #fff; }
.op-btn-purple { background: #8B5CF6; color: #fff; }

.form-block { margin-bottom: 16px; }
.form-label { display: block; font-size: 13px; color: #606266; margin-bottom: 6px; font-weight: 500; }
.form-input { width: 100%; padding: 8px 12px; border: 1px solid #dcdfe6; border-radius: 6px; font-size: 13px; outline: none; box-sizing: border-box; transition: border-color 0.2s; }
.form-input:focus { border-color: #409EFF; }
.form-textarea { width: 100%; padding: 8px 12px; border: 1px solid #dcdfe6; border-radius: 6px; font-size: 13px; outline: none; resize: vertical; box-sizing: border-box; font-family: inherit; transition: border-color 0.2s; }
.form-textarea:focus { border-color: #409EFF; }

.save-btn { margin-top: 20px; }

.stat-row { display: flex; gap: 12px; margin-bottom: 16px; }
.stat-item { flex: 1; background: #fafbfc; border-radius: 8px; padding: 16px; text-align: center; }
.stat-item.full { flex: none; width: 100%; }
.stat-num { font-size: 28px; font-weight: 700; margin-bottom: 6px; }
.stat-desc { font-size: 12px; color: #909399; }

.quick-links { border-top: 1px solid #ebeef5; padding-top: 16px; margin-top: 8px; }
.quick-links-title { font-size: 13px; color: #606266; margin-bottom: 12px; font-weight: 500; }
.quick-link-btn { display: block; width: 100%; padding: 10px 14px; border: 1px solid #ebeef5; border-radius: 6px; background: #fff; text-align: left; cursor: pointer; font-size: 13px; color: #606266; margin-bottom: 8px; transition: all 0.2s; }
.quick-link-btn:hover { border-color: #409EFF; color: #409EFF; background: #f5f9ff; }

@media (max-width: 1024px) {
  .two-column { flex-direction: column; }
  .right-col { min-width: 0; width: 100%; }
  .info-grid { grid-template-columns: 1fr; }
  .evidence-grid { grid-template-columns: 1fr; }
  .compare-container { grid-template-columns: 1fr; }
}
`;
