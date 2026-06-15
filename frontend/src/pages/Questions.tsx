import { useState, useEffect } from 'react';
import { questionsApi, coursesApi, tagsApi } from '@/api';
import { useAuthStore } from '@/store/auth';
import type { Question, Course, Tag, QuestionType } from '@/types';

const typeLabels: Record<QuestionType, string> = {
  single_choice: '单选题',
  multiple_choice: '多选题',
  true_false: '判断题',
  short_answer: '简答题',
  essay: '论述题',
};

export default function QuestionsPage() {
  const { hasRole } = useAuthStore();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [filters, setFilters] = useState({
    course_id: '',
    question_type: '',
    difficulty: '',
    search: '',
  });
  const [showModal, setShowModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [formData, setFormData] = useState({
    course_id: 0,
    chapter_id: undefined as number | undefined,
    question_type: 'single_choice' as QuestionType,
    content: '',
    options: {} as Record<string, any>,
    correct_answer: '',
    explanation: '',
    difficulty: 2,
    tag_ids: [] as number[],
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadQuestions();
  }, [filters]);

  const loadData = async () => {
    const [coursesData, tagsData] = await Promise.all([
      coursesApi.list(),
      tagsApi.list(),
    ]);
    setCourses(coursesData);
    setTags(tagsData);
  };

  const loadQuestions = async () => {
    try {
      const params: any = { page_size: 50 };
      if (filters.course_id) params.course_id = Number(filters.course_id);
      if (filters.question_type) params.question_type = filters.question_type;
      if (filters.difficulty) params.difficulty = Number(filters.difficulty);
      if (filters.search) params.search = filters.search;
      const data = await questionsApi.list(params);
      setQuestions(data);
    } catch (error) {
      console.error('加载题目失败:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingQuestion) {
        await questionsApi.update(editingQuestion.id, formData);
      } else {
        await questionsApi.create(formData);
      }
      setShowModal(false);
      setEditingQuestion(null);
      loadQuestions();
    } catch (error: any) {
      alert(error.response?.data?.detail || '操作失败');
    }
  };

  const handleEdit = (q: Question) => {
    setEditingQuestion(q);
    setFormData({
      course_id: q.course_id,
      chapter_id: q.chapter_id,
      question_type: q.question_type,
      content: q.content,
      options: q.options || {},
      correct_answer: q.correct_answer || '',
      explanation: q.explanation || '',
      difficulty: q.difficulty,
      tag_ids: q.tags.map(t => t.id),
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这道题吗？')) return;
    try {
      await questionsApi.delete(id);
      loadQuestions();
    } catch (error: any) {
      alert(error.response?.data?.detail || '删除失败');
    }
  };

  const canEdit = hasRole(['admin', 'teacher']);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">题库管理</h1>
        {canEdit && (
          <button
            onClick={() => {
              setEditingQuestion(null);
              setFormData({
                course_id: courses[0]?.id || 0,
                chapter_id: undefined,
                question_type: 'single_choice',
                content: '',
                options: {},
                correct_answer: '',
                explanation: '',
                difficulty: 2,
                tag_ids: [],
              });
              setShowModal(true);
            }}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
          >
            + 新建题目
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200 flex flex-wrap gap-3">
          <select
            value={filters.course_id}
            onChange={(e) => setFilters({ ...filters, course_id: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
          >
            <option value="">全部课程</option>
            {courses.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <select
            value={filters.question_type}
            onChange={(e) => setFilters({ ...filters, question_type: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
          >
            <option value="">全部题型</option>
            {Object.entries(typeLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <select
            value={filters.difficulty}
            onChange={(e) => setFilters({ ...filters, difficulty: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
          >
            <option value="">全部难度</option>
            <option value="1">简单</option>
            <option value="2">中等</option>
            <option value="3">困难</option>
            <option value="4">较难</option>
            <option value="5">极难</option>
          </select>
          <input
            type="text"
            placeholder="搜索题目内容..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="flex-1 min-w-48 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
          />
        </div>

        <div className="divide-y divide-gray-100">
          {questions.map(q => (
            <div key={q.id} className="p-4 hover:bg-gray-50 transition">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 bg-primary-100 text-primary-700 text-xs rounded">
                      {typeLabels[q.question_type]}
                    </span>
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                      难度 {q.difficulty}
                    </span>
                    {q.tags.map(tag => (
                      <span
                        key={tag.id}
                        className="px-2 py-0.5 text-xs rounded text-white"
                        style={{ backgroundColor: tag.color }}
                      >
                        {tag.name}
                      </span>
                    ))}
                  </div>
                  <p className="text-gray-800 line-clamp-2">{q.content}</p>
                </div>
                {canEdit && (
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => handleEdit(q)}
                      className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition"
                    >
                      编辑
                    </button>
                    <button
                      onClick={() => handleDelete(q.id)}
                      className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition"
                    >
                      删除
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
          {questions.length === 0 && (
            <div className="p-12 text-center text-gray-400">
              暂无题目数据
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-auto">
            <h2 className="text-lg font-semibold mb-4">
              {editingQuestion ? '编辑题目' : '新建题目'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">所属课程</label>
                  <select
                    value={formData.course_id}
                    onChange={(e) => setFormData({ ...formData, course_id: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                    required
                  >
                    <option value={0}>请选择课程</option>
                    {courses.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">题型</label>
                  <select
                    value={formData.question_type}
                    onChange={(e) => setFormData({ ...formData, question_type: e.target.value as QuestionType })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  >
                    {Object.entries(typeLabels).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">题目内容</label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  rows={4}
                  required
                />
              </div>
              {(formData.question_type === 'single_choice' || formData.question_type === 'multiple_choice') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">选项</label>
                  <div className="space-y-2">
                    {['A', 'B', 'C', 'D'].map(key => (
                      <div key={key} className="flex items-center gap-2">
                        <span className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center text-sm font-medium">
                          {key}
                        </span>
                        <input
                          type="text"
                          value={formData.options?.[key] || ''}
                          onChange={(e) => setFormData({
                            ...formData,
                            options: { ...formData.options, [key]: e.target.value }
                          })}
                          className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                          placeholder={`选项 ${key} 的内容`}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">正确答案</label>
                <input
                  type="text"
                  value={formData.correct_answer}
                  onChange={(e) => setFormData({ ...formData, correct_answer: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">答案解析</label>
                <textarea
                  value={formData.explanation}
                  onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">难度等级 (1-5)</label>
                <input
                  type="number"
                  min={1}
                  max={5}
                  value={formData.difficulty}
                  onChange={(e) => setFormData({ ...formData, difficulty: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">标签</label>
                <div className="flex flex-wrap gap-2">
                  {tags.map(tag => (
                    <label
                      key={tag.id}
                      className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50"
                    >
                      <input
                        type="checkbox"
                        checked={formData.tag_ids.includes(tag.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({ ...formData, tag_ids: [...formData.tag_ids, tag.id] });
                          } else {
                            setFormData({ ...formData, tag_ids: formData.tag_ids.filter(id => id !== tag.id) });
                          }
                        }}
                        className="rounded"
                      />
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: tag.color }}
                      />
                      <span className="text-sm">{tag.name}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
                >
                  保存
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
