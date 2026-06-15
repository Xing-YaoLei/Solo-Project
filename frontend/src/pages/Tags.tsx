import { useState, useEffect } from 'react';
import { tagsApi } from '@/api';
import { useAuthStore } from '@/store/auth';
import type { Tag } from '@/types';

const presetColors = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1',
];

export default function TagsPage() {
  const { hasRole } = useAuthStore();
  const [tags, setTags] = useState<Tag[]>([]);
  const [category, setCategory] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [formData, setFormData] = useState({ name: '', category: '', color: '#3b82f6' });

  useEffect(() => {
    loadTags();
  }, [category]);

  const loadTags = async () => {
    try {
      const data = await tagsApi.list(category || undefined);
      setTags(data);
    } catch (error) {
      console.error('加载标签失败:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTag) {
        await tagsApi.update(editingTag.id, formData);
      } else {
        await tagsApi.create(formData);
      }
      setShowModal(false);
      setEditingTag(null);
      setFormData({ name: '', category: '', color: '#3b82f6' });
      loadTags();
    } catch (error: any) {
      alert(error.response?.data?.detail || '操作失败');
    }
  };

  const handleEdit = (tag: Tag) => {
    setEditingTag(tag);
    setFormData({ name: tag.name, category: tag.category || '', color: tag.color });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这个标签吗？')) return;
    try {
      await tagsApi.delete(id);
      loadTags();
    } catch (error: any) {
      alert(error.response?.data?.detail || '删除失败');
    }
  };

  const categories = Array.from(new Set(tags.map(t => t.category).filter(Boolean)));
  const canEdit = hasRole(['admin', 'teacher']);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">标签管理</h1>
        {canEdit && (
          <button
            onClick={() => { setEditingTag(null); setFormData({ name: '', category: '', color: '#3b82f6' }); setShowModal(true); }}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
          >
            + 新建标签
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200 flex gap-2 flex-wrap">
          <button
            onClick={() => setCategory('')}
            className={`px-3 py-1.5 text-sm rounded-lg transition ${
              !category ? 'bg-primary-100 text-primary-700' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            全部
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat!)}
              className={`px-3 py-1.5 text-sm rounded-lg transition ${
                category === cat ? 'bg-primary-100 text-primary-700' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="p-4">
          <div className="flex flex-wrap gap-3">
            {tags.map(tag => (
              <div
                key={tag.id}
                className="group flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
              >
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: tag.color }}
                />
                <span className="text-sm font-medium text-gray-700">{tag.name}</span>
                {tag.category && (
                  <span className="text-xs text-gray-400">({tag.category})</span>
                )}
                {canEdit && (
                  <div className="opacity-0 group-hover:opacity-100 transition flex gap-1 ml-1">
                    <button
                      onClick={() => handleEdit(tag)}
                      className="text-xs text-gray-500 hover:text-primary-600"
                    >
                      编辑
                    </button>
                    <button
                      onClick={() => handleDelete(tag.id)}
                      className="text-xs text-gray-500 hover:text-red-600"
                    >
                      删除
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
          {tags.length === 0 && (
            <div className="text-center text-gray-400 py-12">
              暂无标签数据
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold mb-4">
              {editingTag ? '编辑标签' : '新建标签'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">标签名称</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">分类</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  placeholder="例如：知识点、难度、章节"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">颜色</label>
                <div className="flex flex-wrap gap-2">
                  {presetColors.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormData({ ...formData, color })}
                      className={`w-8 h-8 rounded-full transition ${
                        formData.color === color ? 'ring-2 ring-offset-2 ring-gray-400' : ''
                      }`}
                      style={{ backgroundColor: color }}
                    />
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
