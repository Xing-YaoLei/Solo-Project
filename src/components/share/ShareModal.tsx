import * as React from 'react';
import { Copy, Check, Share2, Users, Clock, Eye, EyeOff, FileDown } from 'lucide-react';
import { Modal, ModalFooter } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { shareApi } from '@/api/endpoints/share';
import type { ShareLinkCreate, ShareLink, UserRole } from '@/types';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultResourceType?: string;
  defaultResourceId?: string;
}

const RESOURCE_TYPE_OPTIONS = [
  { value: 'dashboard', label: '看板' },
  { value: 'case', label: '案件' },
  { value: 'invoice', label: '单据' },
];

const ROLE_OPTIONS = [
  { value: 'partner', label: '合伙人' },
  { value: 'lawyer', label: '律师' },
  { value: 'assistant', label: '助理' },
  { value: 'client', label: '客户' },
];

const EXPIRY_OPTIONS = [
  { value: 'permanent', label: '永久', hours: -1 },
  { value: '7d', label: '7天', hours: 168 },
  { value: '30d', label: '30天', hours: 720 },
  { value: 'custom', label: '自定义', hours: 0 },
];

const formatDateTime = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  defaultResourceType = 'dashboard',
  defaultResourceId,
}) => {
  const [resourceType, setResourceType] = React.useState<string>(defaultResourceType);
  const [selectedRoles, setSelectedRoles] = React.useState<UserRole[]>(['partner', 'lawyer']);
  const [expiryType, setExpiryType] = React.useState<string>('7d');
  const [customDays, setCustomDays] = React.useState<number>(7);
  const [allowExport, setAllowExport] = React.useState<boolean>(false);
  const [hideSensitive, setHideSensitive] = React.useState<boolean>(true);
  const [generatedLink, setGeneratedLink] = React.useState<ShareLink | null>(null);
  const [copied, setCopied] = React.useState<boolean>(false);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      setResourceType(defaultResourceType);
      setGeneratedLink(null);
      setError(null);
    }
  }, [isOpen, defaultResourceType]);

  const handleRoleToggle = (role: UserRole) => {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const calculateExpiryHours = (): number => {
    if (expiryType === 'permanent') return 87600;
    if (expiryType === 'custom') return customDays * 24;
    const option = EXPIRY_OPTIONS.find((o) => o.value === expiryType);
    return option?.hours || 168;
  };

  const handleGenerateLink = async () => {
    if (selectedRoles.length === 0) {
      setError('请至少选择一个角色');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const shareData: ShareLinkCreate = {
        resource_type: resourceType,
        resource_id: defaultResourceId,
        allowed_roles: selectedRoles,
        expires_in_hours: calculateExpiryHours(),
        allow_export: allowExport,
        hide_sensitive: hideSensitive,
      };

      const result = await shareApi.createShareLink(shareData);
      setGeneratedLink(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : '生成分享链接失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async () => {
    if (!generatedLink?.share_url) return;

    try {
      await navigator.clipboard.writeText(generatedLink.share_url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('复制失败，请手动复制');
    }
  };

  const handleClose = () => {
    setGeneratedLink(null);
    setError(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="分享链接"
      description="生成可分享的链接，设置访问权限和有效期"
      className="max-w-xl"
    >
      <div className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center gap-2">
            <Share2 className="h-4 w-4 text-muted-foreground" />
            资源类型
          </label>
          <Select
            value={resourceType}
            onChange={(e) => setResourceType(e.target.value)}
            options={RESOURCE_TYPE_OPTIONS}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            角色权限（多选）
          </label>
          <div className="flex flex-wrap gap-2">
            {ROLE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleRoleToggle(option.value as UserRole)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors border ${
                  selectedRoles.includes(option.value as UserRole)
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background text-foreground border-input hover:bg-accent'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            有效期
          </label>
          <div className="flex gap-2 flex-wrap">
            {EXPIRY_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setExpiryType(option.value)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors border ${
                  expiryType === option.value
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background text-foreground border-input hover:bg-accent'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          {expiryType === 'custom' && (
            <div className="flex items-center gap-2 mt-2">
              <input
                type="number"
                min="1"
                max="365"
                value={customDays}
                onChange={(e) => setCustomDays(Math.max(1, parseInt(e.target.value) || 1))}
                className="h-9 w-20 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
              />
              <span className="text-sm text-muted-foreground">天</span>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileDown className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">允许导出</span>
            </div>
            <button
              type="button"
              onClick={() => setAllowExport(!allowExport)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                allowExport ? 'bg-primary' : 'bg-input'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-background shadow ring-0 transition-transform ${
                  allowExport ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {hideSensitive ? (
                <EyeOff className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Eye className="h-4 w-4 text-muted-foreground" />
              )}
              <span className="text-sm font-medium">隐藏敏感数据</span>
            </div>
            <button
              type="button"
              onClick={() => setHideSensitive(!hideSensitive)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                hideSensitive ? 'bg-primary' : 'bg-input'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-background shadow ring-0 transition-transform ${
                  hideSensitive ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
            {error}
          </div>
        )}

        {generatedLink && (
          <div className="p-4 rounded-lg border border-border bg-muted/30 space-y-3">
            <div className="text-sm font-medium">生成的链接</div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={generatedLink.share_url}
                className="flex-1 h-9 rounded-md border border-input bg-background px-3 py-1 text-sm font-mono focus:outline-none"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopyLink}
                title={copied ? '已复制' : '复制链接'}
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              <div>
                <span className="font-medium">创建时间：</span>
                {formatDateTime(generatedLink.created_at)}
              </div>
              <div>
                <span className="font-medium">过期时间：</span>
                {formatDateTime(generatedLink.expires_at)}
              </div>
              <div>
                <span className="font-medium">访问次数：</span>
                {generatedLink.access_count}
              </div>
              <div>
                <span className="font-medium">状态：</span>
                <span className={generatedLink.is_active ? 'text-green-500' : 'text-red-500'}>
                  {generatedLink.is_active ? '有效' : '已失效'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      <ModalFooter>
        <Button variant="outline" onClick={handleClose}>
          关闭
        </Button>
        {!generatedLink && (
          <Button onClick={handleGenerateLink} loading={loading}>
            <Share2 className="h-4 w-4" />
            生成链接
          </Button>
        )}
        {generatedLink && (
          <Button onClick={handleCopyLink}>
            {copied ? (
              <>
                <Check className="h-4 w-4" />
                已复制
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                复制链接
              </>
            )}
          </Button>
        )}
      </ModalFooter>
    </Modal>
  );
};

export { ShareModal };
export default ShareModal;
