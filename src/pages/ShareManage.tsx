import React, { useState, useEffect } from 'react';
import {
  Share2,
  Plus,
  Copy,
  Check,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Clock,
  Users,
  Eye,
  Download,
  Shield,
  Link2,
  AlertCircle,
  Calendar,
} from 'lucide-react';
import {
  Card,
  CardContent,
} from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Loading } from '@/components/ui/Loading';
import { Empty } from '@/components/ui/Empty';
import {
  PageHeader,
  ContentCard,
} from '@/components/layout/Layout';
import { usePermission } from '@/hooks/usePermission';
import { shareApi } from '@/api/endpoints/share';
import {
  formatDate,
  getRoleLabel,
  getRoleColor,
} from '@/utils/format';
import type {
  ShareLink,
  ShareLinkCreate,
  ShareLinkListItem,
  UserRole,
} from '@/types';

const mockShareLinks: ShareLinkListItem[] = [
  {
    id: 'share-001',
    token: 'a1b2c3d4e5f6',
    resource_type: 'dashboard',
    expires_at: '2024-07-22T23:59:59',
    access_count: 156,
    is_active: true,
    created_at: '2024-06-22T10:30:00',
  },
  {
    id: 'share-002',
    token: 'g7h8i9j0k1l2',
    resource_type: 'case',
    resource_id: 'case-001',
    expires_at: '2024-06-30T23:59:59',
    access_count: 42,
    is_active: true,
    created_at: '2024-06-15T14:20:00',
  },
  {
    id: 'share-003',
    token: 'm3n4o5p6q7r8',
    resource_type: 'dashboard',
    expires_at: '2024-06-25T23:59:59',
    access_count: 0,
    is_active: false,
    created_at: '2024-05-20T09:15:00',
  },
  {
    id: 'share-004',
    token: 's9t0u1v2w3x4',
    resource_type: 'report',
    resource_id: 'report-001',
    expires_at: '2024-08-01T23:59:59',
    access_count: 89,
    is_active: true,
    created_at: '2024-06-01T16:45:00',
  },
];

const resourceTypeOptions = [
  { value: 'dashboard', label: '报表看板' },
  { value: 'case', label: '案件详情' },
  { value: 'report', label: '特定报表' },
];

const validityOptions = [
  { value: 24, label: '24小时' },
  { value: 72, label: '3天' },
  { value: 168, label: '7天' },
  { value: 720, label: '30天' },
  { value: -1, label: '永久有效' },
];

const ShareManage: React.FC = () => {
  const { getAccessibleRoles, isPartner } = usePermission();
  const [loading, setLoading] = useState(true);
  const [shareLinks, setShareLinks] = useState<ShareLinkListItem[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const [formData, setFormData] = useState<ShareLinkCreate>({
    resource_type: 'dashboard',
    resource_id: '',
    allowed_roles: ['client'],
    expires_in_hours: 168,
    allow_export: false,
    hide_sensitive: true,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadShareLinks();
  }, []);

  const loadShareLinks = async () => {
    setLoading(true);
    try {
      try {
        const response = await shareApi.getShareLinks({ page: 1, page_size: 50 });
        setShareLinks(response.items);
      } catch {
        await new Promise((resolve) => setTimeout(resolve, 600));
        setShareLinks(mockShareLinks);
      }
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (token: string, id: string) => {
    const url = `${window.location.origin}/share/${token}`;
    await navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleShareLink = async (id: string, currentStatus: boolean) => {
    setTogglingId(id);
    try {
      try {
        await shareApi.updateShareLink(id, { is_active: !currentStatus });
      } catch {
        await new Promise((resolve) => setTimeout(resolve, 300));
      }
      setShareLinks((prev) =>
        prev.map((link) =>
          link.id === id ? { ...link, is_active: !currentStatus } : link
        )
      );
    } finally {
      setTogglingId(null);
    }
  };

  const deleteShareLink = async (id: string) => {
    if (!window.confirm('确定要删除此分享链接吗？')) return;
    try {
      try {
        await shareApi.deleteShareLink(id);
      } catch {
        await new Promise((resolve) => setTimeout(resolve, 300));
      }
      setShareLinks((prev) => prev.filter((link) => link.id !== id));
    } catch {
      alert('删除失败，请重试');
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.resource_type) {
      errors.resource_type = '请选择资源类型';
    }
    if (formData.resource_type === 'case' && !formData.resource_id) {
      errors.resource_id = '请选择案件';
    }
    if (formData.allowed_roles.length === 0) {
      errors.allowed_roles = '请至少选择一个角色';
    }
    if (formData.expires_in_hours === 0) {
      errors.expires_in_hours = '请选择有效期';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const submitData = { ...formData };
      if (submitData.expires_in_hours === -1) {
        submitData.expires_in_hours = 87600;
      }

      let newLink: ShareLink;
      try {
        newLink = await shareApi.createShareLink(submitData);
      } catch {
        await new Promise((resolve) => setTimeout(resolve, 800));
        newLink = {
          id: `share-${Date.now()}`,
          token: Math.random().toString(36).substring(2, 14),
          resource_type: submitData.resource_type,
          resource_id: submitData.resource_id,
          allowed_roles: submitData.allowed_roles,
          expires_at: new Date(Date.now() + submitData.expires_in_hours * 3600000).toISOString(),
          allow_export: submitData.allow_export,
          hide_sensitive: submitData.hide_sensitive,
          access_count: 0,
          is_active: true,
          created_at: new Date().toISOString(),
          share_url: `${window.location.origin}/share/${Math.random().toString(36).substring(2, 14)}`,
        };
      }

      const listItem: ShareLinkListItem = {
        id: newLink.id,
        token: newLink.token,
        resource_type: newLink.resource_type,
        resource_id: newLink.resource_id,
        expires_at: newLink.expires_at,
        access_count: newLink.access_count,
        is_active: newLink.is_active,
        created_at: newLink.created_at,
      };

      setShareLinks((prev) => [listItem, ...prev]);
      setShowCreateModal(false);
      resetForm();
    } catch {
      setFormErrors({ submit: '创建失败，请重试' });
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      resource_type: 'dashboard',
      resource_id: '',
      allowed_roles: ['client'],
      expires_in_hours: 168,
      allow_export: false,
      hide_sensitive: true,
    });
    setFormErrors({});
  };

  const toggleRole = (role: UserRole) => {
    setFormData((prev) => ({
      ...prev,
      allowed_roles: prev.allowed_roles.includes(role)
        ? prev.allowed_roles.filter((r) => r !== role)
        : [...prev.allowed_roles, role],
    }));
    if (formErrors.allowed_roles) {
      setFormErrors((prev) => ({ ...prev, allowed_roles: undefined }));
    }
  };

  const getResourceTypeLabel = (type: string) => {
    const option = resourceTypeOptions.find((o) => o.value === type);
    return option?.label || type;
  };

  const accessibleRoles = getAccessibleRoles();

  if (loading) {
    return <Loading fullScreen />;
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="分享管理"
        description="管理数据分享链接，控制访问权限"
        action={
          <Button
            className="btn-gold"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            新建分享链接
          </Button>
        }
      />

      <ContentCard className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
        {shareLinks.length === 0 ? (
          <Empty
            icon={<Share2 className="w-12 h-12 text-muted-foreground" />}
            title="暂无分享链接"
            description="点击右上角按钮创建新的分享链接"
          />
        ) : (
          <div className="space-y-4">
            {shareLinks.map((link, index) => (
              <Card
                key={link.id}
                className={`card-hover transition-all duration-300 animate-fade-in ${
                  !link.is_active ? 'opacity-60' : ''
                }`}
                style={{ animationDelay: `${0.1 + index * 0.05}s` }}
              >
                <CardContent className="p-5">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          link.is_active ? 'bg-gold/10' : 'bg-gray-100'
                        }`}>
                          <Link2 className={`w-5 h-5 ${
                            link.is_active ? 'text-gold' : 'text-gray-400'
                          }`} />
                        </div>
                        <div>
                          <h4 className="font-semibold text-foreground flex items-center gap-2">
                            {getResourceTypeLabel(link.resource_type)}
                            {!link.is_active && (
                              <Badge variant="secondary" className="text-xs">
                                已禁用
                              </Badge>
                            )}
                          </h4>
                          <p className="text-sm text-muted-foreground font-mono">
                            {link.token}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 mt-3 text-sm">
                        <span className="flex items-center gap-1.5 text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          有效期至 {formatDate(link.expires_at)}
                        </span>
                        <span className="flex items-center gap-1.5 text-muted-foreground">
                          <Eye className="w-4 h-4" />
                          {link.access_count} 次访问
                        </span>
                        <span className="flex items-center gap-1.5 text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          创建于 {formatDate(link.created_at)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 lg:gap-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(link.token, link.id)}
                        className="gap-2"
                      >
                        {copiedId === link.id ? (
                          <><Check className="w-4 h-4 text-green-500" /> 已复制</>
                        ) : (
                          <><Copy className="w-4 h-4" /> 复制链接</>
                        )}
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleShareLink(link.id, link.is_active)}
                        disabled={togglingId === link.id}
                        className="gap-2"
                      >
                        {link.is_active ? (
                          <><ToggleRight className="w-5 h-5 text-green-500" /> 启用</>
                        ) : (
                          <><ToggleLeft className="w-5 h-5 text-gray-400" /> 禁用</>
                        )}
                      </Button>

                      {isPartner && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteShareLink(link.id)}
                          className="text-red-500 hover:text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </ContentCard>

      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="新建分享链接"
        description="配置分享链接的访问权限和有效期"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              资源类型
            </label>
            <div className="grid grid-cols-3 gap-3">
              {resourceTypeOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      resource_type: option.value as ShareLinkCreate['resource_type'],
                    }))
                  }
                  className={`p-3 rounded-xl border-2 text-center transition-all duration-200 ${
                    formData.resource_type === option.value
                      ? 'border-gold bg-gold-50'
                      : 'border-border hover:border-primary/30'
                  }`}
                >
                  <div className={`font-medium text-sm ${
                    formData.resource_type === option.value ? 'text-gold-700' : 'text-foreground'
                  }`}>
                    {option.label}
                  </div>
                </button>
              ))}
            </div>
            {formErrors.resource_type && (
              <p className="mt-1.5 text-sm text-red-500">{formErrors.resource_type}</p>
            )}
          </div>

          {formData.resource_type === 'case' && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                选择案件
              </label>
              <select
                value={formData.resource_id}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, resource_id: e.target.value }))
                }
                className="input-field"
              >
                <option value="">请选择案件</option>
                <option value="case-001">北京某科技公司股权纠纷案</option>
                <option value="case-002">张三诉李四合同纠纷案</option>
                <option value="case-003">王五与赵六离婚纠纷案</option>
              </select>
              {formErrors.resource_id && (
                <p className="mt-1.5 text-sm text-red-500">{formErrors.resource_id}</p>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              <Users className="w-4 h-4 inline mr-1.5" />
              允许访问的角色
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {accessibleRoles.map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => toggleRole(role)}
                  className={`p-3 rounded-xl border-2 text-center transition-all duration-200 ${
                    formData.allowed_roles.includes(role)
                      ? 'border-primary bg-primary-50'
                      : 'border-border hover:border-primary/30'
                  }`}
                >
                  <Badge className={getRoleColor(role)}>
                    {getRoleLabel(role)}
                  </Badge>
                </button>
              ))}
            </div>
            {formErrors.allowed_roles && (
              <p className="mt-1.5 text-sm text-red-500">{formErrors.allowed_roles}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              <Clock className="w-4 h-4 inline mr-1.5" />
              有效期
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
              {validityOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, expires_in_hours: option.value }))
                  }
                  className={`p-2.5 rounded-xl border-2 text-center transition-all duration-200 text-sm ${
                    formData.expires_in_hours === option.value
                      ? 'border-primary bg-primary-50 text-primary'
                      : 'border-border hover:border-primary/30'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            {formErrors.expires_in_hours && (
              <p className="mt-1.5 text-sm text-red-500">{formErrors.expires_in_hours}</p>
            )}
          </div>

          <div className="space-y-4 pt-4 border-t border-border">
            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <Download className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-foreground">允许导出数据</p>
                  <p className="text-sm text-muted-foreground">
                    授权用户可以导出分享的数据
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={formData.allow_export}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, allow_export: e.target.checked }))
                }
                className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="font-medium text-foreground">隐藏敏感信息</p>
                  <p className="text-sm text-muted-foreground">
                    对客户角色脱敏显示敏感数据
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={formData.hide_sensitive}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, hide_sensitive: e.target.checked }))
                }
                className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
              />
            </label>
          </div>

          {formData.hide_sensitive && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium mb-1">敏感信息脱敏说明</p>
                <p>
                  启用后，客户角色访问时将自动脱敏以下信息：客户名称、联系方式、
                  律师联系方式等敏感数据。
                </p>
              </div>
            </div>
          )}

          {formErrors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-600">
              {formErrors.submit}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowCreateModal(false);
                resetForm();
              }}
            >
              取消
            </Button>
            <Button type="submit" className="btn-gold" loading={submitting}>
              创建分享链接
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ShareManage;
