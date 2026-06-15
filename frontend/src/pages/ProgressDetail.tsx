import { useState, useEffect } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { studyProgressApi, processingApi } from '@/api';
import { useAuthStore } from '@/store/auth';
import type {
  StudyProgress, Communication, ReviewConclusion,
  PracticeRecord, RiskLevel, ChapterProgress
} from '@/types';

const riskColors: Record<RiskLevel, string> = {
  normal: 'bg-risk-normal',
  warning: 'bg-risk-warning',
  danger: 'bg-risk-danger',
  critical: 'bg-risk-critical',
};

const riskLabels: Record<RiskLevel, string> = {
  normal: '正常',
  warning: '提醒',
  danger: '风险',
  critical: '严重',
};

export default function ProgressDetailPage() {
  const { id } = useParams({ from: '/study-progress/$id' });
  const navigate = useNavigate();
  const { hasRole, user } = useAuthStore();
  const [progress, setProgress] = useState<StudyProgress | null>(null);
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [reviews, setReviews] = useState<ReviewConclusion[]>([]);
  const [practiceRecords, setPracticeRecords] = useState<PracticeRecord[]>([]);
  const [chapterProgress, setChapterProgress] = useState<ChapterProgress | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    conclusion: '',
    action_plan: '',
    risk_level_after: '' as string,
  });
  const [activeTab, setActiveTab] = useState<'overview' | 'chapters' | 'records' | 'communication' | 'reviews'>('overview');

  const progressId = Number(id);

  useEffect(() => {
    if (progressId) {
      loadData();
    }
  }, [progressId]);

  const loadData = async () => {
    try {
      const [progressData, commData, reviewData, recordData, chapterData] = await Promise.all([
        studyProgressApi.get(progressId),
        processingApi.listCommunications(progressId),
        processingApi.listReviews(progressId),
        studyProgressApi.listPracticeRecords({ student_id: undefined, page_size: 20 }),
        studyProgressApi.getChapterProgress(progressId),
      ]);
      setProgress(progressData);
      setCommunications(commData);
      setReviews(reviewData);
      setPracticeRecords(recordData.filter(r => r.course_id === progressData.course_id));
      setChapterProgress(chapterData);
    } catch (error) {
      console.error('加载数据失败:', error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    try {
      await processingApi.createCommunication({
        study_progress_id: progressId,
        message: newMessage,
        message_type: 'comment',
      });
      setNewMessage('');
      loadData();
    } catch (error: any) {
      alert(error.response?.data?.detail || '发送失败');
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await processingApi.createReview({
        study_progress_id: progressId,
        conclusion: reviewForm.conclusion,
        action_plan: reviewForm.action_plan || undefined,
        risk_level_after: reviewForm.risk_level_after || undefined,
      });
      setShowReviewModal(false);
      setReviewForm({ conclusion: '', action_plan: '', risk_level_after: '' });
      loadData();
    } catch (error: any) {
      alert(error.response?.data?.detail || '提交失败');
    }
  };

  const handleAssessRisk = async () => {
    try {
      const result = await studyProgressApi.assessRisk(progressId);
      if (result.changed) {
        alert(`风险等级已从 ${result.previous_level} 调整为 ${result.current_level}`);
        loadData();
      } else {
        alert('风险等级无变化');
      }
    } catch (error: any) {
      alert(error.response?.data?.detail || '评估失败');
    }
  };

  if (!progress) {
    return <div className="p-12 text-center text-gray-400">加载中...</div>;
  }

  const canReview = hasRole(['admin', 'manager', 'teacher']);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate({ to: '/study-progress' })}
            className="text-gray-400 hover:text-gray-600"
          >
            ← 返回
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {progress.student?.full_name || progress.student?.username}
            </h1>
            <p className="text-gray-500">{progress.course?.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {canReview && (
            <button
              onClick={handleAssessRisk}
              className="px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              重新评估风险
            </button>
          )}
          {canReview && (
            <button
              onClick={() => setShowReviewModal(true)}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
            >
              提交复核
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-3 bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="border-b border-gray-200">
            <div className="flex flex-wrap">
              {[
                { key: 'overview', label: '进度概览' },
                { key: 'chapters', label: '章节追踪' },
                { key: 'records', label: '练习记录' },
                { key: 'communication', label: `沟通记录 (${communications.length})` },
                { key: 'reviews', label: `复核结论 (${reviews.length})` },
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`px-6 py-3 text-sm font-medium border-b-2 transition ${
                    activeTab === tab.key
                      ? 'border-primary-600 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <InfoCard label="总题数" value={progress.total_questions} />
                  <InfoCard label="已完成" value={progress.completed_questions} />
                  <InfoCard label="正确数" value={progress.correct_count} />
                  <InfoCard label="正确率" value={`${progress.accuracy_rate}%`} />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">完成进度</span>
                    <span className="font-medium text-gray-900">{progress.completion_rate}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-4">
                    <div
                      className={`h-4 rounded-full transition-all ${
                        progress.risk_level === 'normal' ? 'bg-green-500' :
                        progress.risk_level === 'warning' ? 'bg-yellow-500' :
                        progress.risk_level === 'danger' ? 'bg-orange-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${progress.completion_rate}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-500">上次练习时间</span>
                    <p className="font-medium mt-1">
                      {progress.last_practice_at
                        ? new Date(progress.last_practice_at).toLocaleString('zh-CN')
                        : '暂无记录'}
                    </p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-500">风险等级</span>
                    <p className="mt-1">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium text-white ${riskColors[progress.risk_level]}`}>
                        {riskLabels[progress.risk_level]}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'chapters' && chapterProgress && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-500">
                    共 {chapterProgress.chapters.length} 个章节
                  </p>
                </div>
                {chapterProgress.chapters.map(chapter => (
                  <div
                    key={chapter.chapter_id}
                    className={`p-4 rounded-lg border ${
                      chapter.risk_level === 'normal' ? 'bg-green-50 border-green-200' :
                      chapter.risk_level === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                      chapter.risk_level === 'danger' ? 'bg-orange-50 border-orange-200' :
                      'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-white border border-gray-200 flex items-center justify-center text-xs font-medium">
                          {chapter.order_index}
                        </span>
                        <h4 className="font-medium text-gray-900">{chapter.chapter_name}</h4>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium text-white ${riskColors[chapter.risk_level]}`}>
                        {riskLabels[chapter.risk_level]}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-sm mb-3">
                      <div>
                        <span className="text-gray-500">题目数</span>
                        <p className="font-medium text-gray-900 mt-1">{chapter.total_questions}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">已完成</span>
                        <p className="font-medium text-gray-900 mt-1">{chapter.completed_questions} / {chapter.total_questions}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">正确率</span>
                        <p className={`font-medium mt-1 ${
                          chapter.accuracy_rate >= 70 ? 'text-green-600' :
                          chapter.accuracy_rate >= 50 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {chapter.completed_questions > 0 ? `${chapter.accuracy_rate}%` : '-'}
                        </p>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                        <span>章节完成率</span>
                        <span>{chapter.completion_rate}%</span>
                      </div>
                      <div className="w-full bg-white rounded-full h-2.5 overflow-hidden">
                        <div
                          className={`h-2.5 rounded-full transition-all ${
                            chapter.risk_level === 'normal' ? 'bg-green-500' :
                            chapter.risk_level === 'warning' ? 'bg-yellow-500' :
                            chapter.risk_level === 'danger' ? 'bg-orange-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${chapter.completion_rate}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
                {chapterProgress.chapters.length === 0 && (
                  <p className="text-center text-gray-400 py-12">暂无章节数据</p>
                )}
              </div>
            )}

            {activeTab === 'records' && (
              <div className="space-y-3">
                {practiceRecords.map(record => (
                  <div key={record.id} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm text-gray-800 line-clamp-2">
                          {record.question?.content || `题目 #${record.question_id}`}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          <span>第 {record.attempt_number} 次练习</span>
                          {record.is_correct !== undefined && (
                            <span className={record.is_correct ? 'text-green-600' : 'text-red-600'}>
                              {record.is_correct ? '正确' : '错误'}
                            </span>
                          )}
                          {record.score !== undefined && (
                            <span>得分: {record.score}</span>
                          )}
                        </div>
                      </div>
                      <span className="text-xs text-gray-400">
                        {new Date(record.created_at).toLocaleString('zh-CN')}
                      </span>
                    </div>
                  </div>
                ))}
                {practiceRecords.length === 0 && (
                  <p className="text-center text-gray-400 py-8">暂无练习记录</p>
                )}
              </div>
            )}

            {activeTab === 'communication' && (
              <div className="space-y-4">
                <div className="space-y-4 max-h-96 overflow-auto">
                  {communications.map(comm => (
                    <div
                      key={comm.id}
                      className={`flex ${comm.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-md ${comm.sender_id === user?.id ? 'order-2' : 'order-1'}`}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium text-gray-700">
                            {comm.sender?.full_name || comm.sender?.username || '用户'}
                          </span>
                          <span className="text-xs text-gray-400">
                            {new Date(comm.created_at).toLocaleString('zh-CN')}
                          </span>
                        </div>
                        <div className={`px-4 py-2 rounded-lg ${
                          comm.sender_id === user?.id
                            ? 'bg-primary-500 text-white'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {comm.message}
                        </div>
                      </div>
                    </div>
                  ))}
                  {communications.length === 0 && (
                    <p className="text-center text-gray-400 py-8">暂无沟通记录</p>
                  )}
                </div>

                <form onSubmit={handleSendMessage} className="flex gap-3 pt-4 border-t border-gray-200">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="输入消息..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  />
                  <button
                    type="submit"
                    className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
                  >
                    发送
                  </button>
                </form>
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="space-y-4">
                {reviews.map(review => (
                  <div key={review.id} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">
                          {review.reviewer?.full_name || review.reviewer?.username || '审核人'}
                        </span>
                        <span className="text-xs text-gray-400">
                          {new Date(review.created_at).toLocaleString('zh-CN')}
                        </span>
                      </div>
                      {review.risk_level_after && (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium text-white ${riskColors[review.risk_level_after]}`}>
                          调整为: {riskLabels[review.risk_level_after]}
                        </span>
                      )}
                    </div>
                    <div className="space-y-2">
                      <div>
                        <span className="text-sm text-gray-500">复核结论：</span>
                        <p className="text-sm text-gray-800 mt-1">{review.conclusion}</p>
                      </div>
                      {review.action_plan && (
                        <div>
                          <span className="text-sm text-gray-500">行动计划：</span>
                          <p className="text-sm text-gray-800 mt-1">{review.action_plan}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {reviews.length === 0 && (
                  <p className="text-center text-gray-400 py-8">暂无复核结论</p>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <h3 className="font-medium text-gray-900 mb-3">风险状态</h3>
            <div className={`p-4 rounded-lg ${
              progress.risk_level === 'normal' ? 'bg-green-50' :
              progress.risk_level === 'warning' ? 'bg-yellow-50' :
              progress.risk_level === 'danger' ? 'bg-orange-50' : 'bg-red-50'
            }`}>
              <div className="flex items-center gap-3">
                <span className={`w-3 h-3 rounded-full ${riskColors[progress.risk_level]}`} />
                <span className="font-semibold text-gray-900">
                  {riskLabels[progress.risk_level]}
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                {progress.risk_level === 'normal' && '学习进度正常，继续保持！'}
                {progress.risk_level === 'warning' && '学习进度稍有落后，建议增加练习频率。'}
                {progress.risk_level === 'danger' && '学习进度明显落后，需要重点关注和跟进。'}
                {progress.risk_level === 'critical' && '学习进度严重落后，请立即介入处理！'}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <h3 className="font-medium text-gray-900 mb-3">学生信息</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">姓名</span>
                <span className="text-gray-900">{progress.student?.full_name || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">用户名</span>
                <span className="text-gray-900">{progress.student?.username || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">邮箱</span>
                <span className="text-gray-900">{progress.student?.email || '-'}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <h3 className="font-medium text-gray-900 mb-3">快捷操作</h3>
            <div className="space-y-2">
              <button
                onClick={() => setActiveTab('communication')}
                className="w-full px-3 py-2 text-sm text-left text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
              >
                💬 发送消息
              </button>
              {canReview && (
                <button
                  onClick={() => setShowReviewModal(true)}
                  className="w-full px-3 py-2 text-sm text-left text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                >
                  📝 提交复核
                </button>
              )}
              <button
                onClick={handleAssessRisk}
                className="w-full px-3 py-2 text-sm text-left text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
              >
                ⚠️ 风险评估
              </button>
            </div>
          </div>
        </div>
      </div>

      {showReviewModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold mb-4">提交复核结论</h2>
            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">复核结论</label>
                <textarea
                  value={reviewForm.conclusion}
                  onChange={(e) => setReviewForm({ ...reviewForm, conclusion: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  rows={3}
                  required
                  placeholder="请输入复核结论..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">行动计划</label>
                <textarea
                  value={reviewForm.action_plan}
                  onChange={(e) => setReviewForm({ ...reviewForm, action_plan: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  rows={2}
                  placeholder="请输入后续行动计划..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">调整风险等级</label>
                <select
                  value={reviewForm.risk_level_after}
                  onChange={(e) => setReviewForm({ ...reviewForm, risk_level_after: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                >
                  <option value="">不调整</option>
                  <option value="normal">正常</option>
                  <option value="warning">提醒</option>
                  <option value="danger">风险</option>
                  <option value="critical">严重</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReviewModal(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
                >
                  提交
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="p-4 bg-gray-50 rounded-lg">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
    </div>
  );
}
