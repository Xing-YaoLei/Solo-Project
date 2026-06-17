import { useState } from 'react';
import { X, Trash2, ImagePlus, Image as ImageIcon } from 'lucide-react';
import { createWorkOrder } from '@/api/workOrders';
import type { WorkOrderCategory, WorkOrderPriority } from '@/types';
import { categoryLabels, priorityLabels } from '@/utils/constants';

interface PhotoItem {
  url: string;
  caption: string;
}

interface Props {
  onClose: () => void;
  onCreated: () => void;
}

export default function CreateWorkOrderModal({ onClose, onCreated }: Props) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    category: 'electrical' as WorkOrderCategory,
    priority: 'medium' as WorkOrderPriority,
    reporter_name: '',
    reporter_phone: '',
  });
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [showPreview, setShowPreview] = useState<string | null>(null);

  const addPhoto = () => {
    setPhotos([...photos, { url: '', caption: '' }]);
  };

  const updatePhoto = (
    index: number,
    field: 'url' | 'caption',
    value: string
  ) => {
    const newPhotos = [...photos];
    newPhotos[index][field] = value;
    setPhotos(newPhotos);
  };

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const validPhotos = photos.filter((p) => p.url.trim() !== '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.location.trim() || !formData.description.trim()) {
      return;
    }
    setLoading(true);
    try {
      const submitData: any = { ...formData };
      if (validPhotos.length > 0) {
        submitData.photos = validPhotos.map((p) => ({
          url: p.url.trim(),
          caption: p.caption.trim() || undefined,
          photo_type: 'scene',
        }));
      }
      await createWorkOrder(submitData);
      onCreated();
    } catch (err: any) {
      alert('创建失败：' + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-lg font-semibold text-gray-900">新建报修工单</h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              工单标题 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              placeholder="请简要描述故障问题"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                故障类别 <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.category}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    category: e.target.value as WorkOrderCategory,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              >
                {Object.entries(categoryLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                优先级 <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.priority}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    priority: e.target.value as WorkOrderPriority,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              >
                {Object.entries(priorityLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              故障位置 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) =>
                setFormData({ ...formData, location: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              placeholder="例如：A栋3层301室"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              详细描述 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-none"
              placeholder="请详细描述故障情况..."
              required
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                现场照片
                <span className="ml-2 text-xs text-gray-400">选填，可多张</span>
              </label>
              <button
                type="button"
                onClick={addPhoto}
                className="flex items-center px-2 py-1 text-xs text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded transition-colors"
              >
                <ImagePlus className="w-3.5 h-3.5 mr-1" />
                添加照片
              </button>
            </div>

            {photos.length === 0 && (
              <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center text-gray-400">
                <ImageIcon className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">点击上方「添加照片」按钮添加现场照片</p>
              </div>
            )}

            {photos.length > 0 && (
              <div className="space-y-3">
                {photos.map((photo, index) => (
                  <div
                    key={index}
                    className="p-3 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="flex items-start gap-3">
                      {photo.url ? (
                        <div
                          className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-200 cursor-pointer"
                          onClick={() => setShowPreview(photo.url)}
                        >
                          <img
                            src={photo.url}
                            alt="preview"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"%3E%3Crect fill="%23e5e7eb" width="80" height="80"/%3E%3Ctext fill="%239ca3af" font-size="12" text-anchor="middle" x="40" y="45"%3E无效%3C/text%3E%3C/svg%3E';
                            }}
                          />
                        </div>
                      ) : (
                        <div className="w-20 h-20 rounded-lg bg-gray-100 border border-dashed border-gray-300 flex items-center justify-center flex-shrink-0">
                          <ImageIcon className="w-6 h-6 text-gray-300" />
                        </div>
                      )}
                      <div className="flex-1 space-y-2">
                        <input
                          type="url"
                          value={photo.url}
                          onChange={(e) =>
                            updatePhoto(index, 'url', e.target.value)
                          }
                          placeholder="请输入图片 URL 地址"
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 focus:border-primary-500 outline-none"
                        />
                        <input
                          type="text"
                          value={photo.caption}
                          onChange={(e) =>
                            updatePhoto(index, 'caption', e.target.value)
                          }
                          placeholder="照片说明（选填）"
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 focus:border-primary-500 outline-none"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removePhoto(index)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors flex-shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                报修人姓名
              </label>
              <input
                type="text"
                value={formData.reporter_name}
                onChange={(e) =>
                  setFormData({ ...formData, reporter_name: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                placeholder="选填"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                联系电话
              </label>
              <input
                type="tel"
                value={formData.reporter_phone}
                onChange={(e) =>
                  setFormData({ ...formData, reporter_phone: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                placeholder="选填"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 -mx-5 -mb-5 p-5 mt-2 bg-gray-50">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
            >
              {loading ? '创建中...' : '创建工单'}
            </button>
          </div>
        </form>
      </div>

      {showPreview && (
        <div
          className="fixed inset-0 z-[60] bg-black/70 flex items-center justify-center p-8"
          onClick={() => setShowPreview(null)}
        >
          <img
            src={showPreview}
            alt="preview"
            className="max-w-full max-h-full rounded-lg shadow-2xl object-contain"
          />
        </div>
      )}
    </div>
  );
}
