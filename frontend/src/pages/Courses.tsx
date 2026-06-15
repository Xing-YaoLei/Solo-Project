import { useState, useEffect } from 'react';
import { coursesApi } from '@/api';
import { useAuthStore } from '@/store/auth';
import type { Course, Chapter } from '@/types';

export default function CoursesPage() {
  const { hasRole } = useAuthStore();
  const [courses, setCourses] = useState<Course[]>([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [formData, setFormData] = useState({ name: '', code: '', description: '' });
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [showChapterModal, setShowChapterModal] = useState(false);
  const [chapterForm, setChapterForm] = useState({ name: '', order_index: 0, description: '' });

  useEffect(() => {
    loadCourses();
  }, [search]);

  const loadCourses = async () => {
    try {
      const data = await coursesApi.list(search || undefined);
      setCourses(data);
    } catch (error) {
      console.error('加载课程失败:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCourse) {
        await coursesApi.update(editingCourse.id, formData);
      } else {
        await coursesApi.create(formData);
      }
      setShowModal(false);
      setEditingCourse(null);
      setFormData({ name: '', code: '', description: '' });
      loadCourses();
    } catch (error: any) {
      alert(error.response?.data?.detail || '操作失败');
    }
  };

  const handleEdit = (course: Course) => {
    setEditingCourse(course);
    setFormData({ name: course.name, code: course.code, description: course.description || '' });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这个课程吗？')) return;
    try {
      await coursesApi.delete(id);
      loadCourses();
    } catch (error: any) {
      alert(error.response?.data?.detail || '删除失败');
    }
  };

  const handleViewChapters = async (course: Course) => {
    const data = await coursesApi.get(course.id);
    setSelectedCourse(data);
  };

  const handleAddChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse) return;
    try {
      await coursesApi.createChapter(selectedCourse.id, chapterForm);
      setShowChapterModal(false);
      setChapterForm({ name: '', order_index: 0, description: '' });
      handleViewChapters(selectedCourse);
    } catch (error: any) {
      alert(error.response?.data?.detail || '添加章节失败');
    }
  };

  const canEdit = hasRole(['admin']);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">课程管理</h1>
        {canEdit && (
          <button
            onClick={() => { setEditingCourse(null); setFormData({ name: '', code: '', description: '' }); setShowModal(true); }}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
          >
            + 新建课程
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <input
            type="text"
            placeholder="搜索课程名称或编码..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
          />
        </div>

        <div className="divide-y divide-gray-100">
          {courses.map(course => (
            <div key={course.id} className="p-4 hover:bg-gray-50 transition">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-medium text-gray-900">{course.name}</h3>
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                      {course.code}
                    </span>
                  </div>
                  {course.description && (
                    <p className="text-sm text-gray-500 mt-1">{course.description}</p>
                  )}
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                    <span>题目数: {course.total_questions}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleViewChapters(course)}
                    className="px-3 py-1.5 text-sm text-primary-600 hover:bg-primary-50 rounded-lg transition"
                  >
                    查看章节
                  </button>
                  {canEdit && (
                    <>
                      <button
                        onClick={() => handleEdit(course)}
                        className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition"
                      >
                        编辑
                      </button>
                      <button
                        onClick={() => handleDelete(course.id)}
                        className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition"
                      >
                        删除
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
          {courses.length === 0 && (
            <div className="p-12 text-center text-gray-400">
              暂无课程数据
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold mb-4">
              {editingCourse ? '编辑课程' : '新建课程'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">课程名称</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">课程编码</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  rows={3}
                />
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

      {selectedCourse && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-2xl p-6 max-h-[80vh] overflow-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">课程章节 - {selectedCourse.name}</h2>
              <button
                onClick={() => setSelectedCourse(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="space-y-3 mb-4">
              {selectedCourse.chapters?.map((chapter, index) => (
                <div key={chapter.id} className="p-3 bg-gray-50 rounded-lg flex items-center justify-between">
                  <div>
                    <span className="font-medium">{chapter.name}</span>
                    <span className="text-sm text-gray-500 ml-2">第 {index + 1} 章</span>
                  </div>
                  <span className="text-sm text-gray-500">{chapter.question_count} 题</span>
                </div>
              ))}
              {(!selectedCourse.chapters || selectedCourse.chapters.length === 0) && (
                <p className="text-center text-gray-400 py-6">暂无章节</p>
              )}
            </div>
            {canEdit && (
              <button
                onClick={() => setShowChapterModal(true)}
                className="w-full py-2 border-2 border-dashed border-gray-300 text-gray-500 rounded-lg hover:border-primary-500 hover:text-primary-600 transition"
              >
                + 添加章节
              </button>
            )}
          </div>
        </div>
      )}

      {showChapterModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold mb-4">添加章节</h2>
            <form onSubmit={handleAddChapter} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">章节名称</label>
                <input
                  type="text"
                  value={chapterForm.name}
                  onChange={(e) => setChapterForm({ ...chapterForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">排序</label>
                <input
                  type="number"
                  value={chapterForm.order_index}
                  onChange={(e) => setChapterForm({ ...chapterForm, order_index: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowChapterModal(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
                >
                  添加
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
