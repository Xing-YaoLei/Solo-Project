// @ts-nocheck
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Textarea, Select } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { apiEndpoints } from '@/lib/api';
import { cn } from '@/lib/utils';
import { CreateRefundOrderDto } from '@solo/shared';

export default function NewOrderPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [regions, setRegions] = useState<string[]>([]);
  const [problemTags, setProblemTags] = useState<any[]>([]);
  const [operators, setOperators] = useState<any[]>([]);
  const [formData, setFormData] = useState<Partial<CreateRefundOrderDto>>({
    quantity: 1,
    unitPrice: 0,
    refundAmount: 0,
    problemTags: [],
    isUrgent: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [regionsRes, configRes, opsRes] = await Promise.all([
          apiEndpoints.users.regions(),
          apiEndpoints.config.getAll(),
          apiEndpoints.users.operators(),
        ]);
        setRegions(regionsRes as string[]);
        setProblemTags(configRes.problemTags as any[]);
        setOperators(opsRes as any[]);
      } catch (error) {
        console.error('Failed to fetch options:', error);
      }
    };
    fetchOptions();
  }, []);

  const toggleTag = (tag: string) => {
    const current = formData.problemTags || [];
    const next = current.includes(tag)
      ? current.filter((t) => t !== tag)
      : [...current, tag];
    setFormData({ ...formData, problemTags: next });
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.orderNo) newErrors.orderNo = '请输入售后单号';
    if (!formData.customerName) newErrors.customerName = '请输入客户姓名';
    if (!formData.customerPhone) newErrors.customerPhone = '请输入联系电话';
    if (!formData.region) newErrors.region = '请选择区域';
    if (!formData.community) newErrors.community = '请输入小区';
    if (!formData.productName) newErrors.productName = '请输入商品名称';
    if (!formData.quantity || formData.quantity < 1) newErrors.quantity = '请输入正确数量';
    if (!formData.refundAmount || formData.refundAmount < 0) newErrors.refundAmount = '请输入退款金额';
    if (!formData.reason) newErrors.reason = '请输入售后原因';
    if (!formData.deadline) newErrors.deadline = '请选择处理时限';
    if (formData.deadline && new Date(formData.deadline) <= new Date()) {
      newErrors.deadline = '处理时限必须晚于当前时间';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const res: any = await apiEndpoints.refundOrders.create(formData);
      router.push(`/orders/${res.id}`);
    } catch (error: any) {
      console.error('Failed to create order:', error);
      alert(error.response?.data?.message || '创建失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/orders" className="text-gray-500 hover:text-gray-700">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">新建售后单</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>基本信息</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input
              label="售后单号"
              value={formData.orderNo || ''}
              onChange={(e) => setFormData({ ...formData, orderNo: e.target.value })}
              placeholder="如：SO202606130001"
              error={errors.orderNo}
            />
            <Select
              label="区域"
              value={formData.region || ''}
              onChange={(e) => setFormData({ ...formData, region: e.target.value })}
              options={regions.map((r) => ({ value: r, label: r }))}
              error={errors.region}
            />
            <Input
              label="客户姓名"
              value={formData.customerName || ''}
              onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
              error={errors.customerName}
            />
            <Input
              label="联系电话"
              value={formData.customerPhone || ''}
              onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
              error={errors.customerPhone}
            />
            <Input
              label="小区/社区"
              value={formData.community || ''}
              onChange={(e) => setFormData({ ...formData, community: e.target.value })}
              error={errors.community}
            />
            <Input
              label="团长（可选）"
              value={formData.groupLeader || ''}
              onChange={(e) => setFormData({ ...formData, groupLeader: e.target.value })}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>商品信息</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Input
              label="商品名称"
              value={formData.productName || ''}
              onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
              error={errors.productName}
            />
            <Input
              label="SKU（可选）"
              value={formData.productSku || ''}
              onChange={(e) => setFormData({ ...formData, productSku: e.target.value })}
            />
            <Input
              type="number"
              label="数量"
              value={formData.quantity || 1}
              onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
              min={1}
              error={errors.quantity}
            />
            <Input
              type="number"
              label="单价（元）"
              value={formData.unitPrice || 0}
              onChange={(e) => setFormData({ ...formData, unitPrice: Number(e.target.value) })}
              min={0}
              step="0.01"
            />
            <Input
              type="number"
              label="申请退款金额（元）"
              value={formData.refundAmount || 0}
              onChange={(e) => setFormData({ ...formData, refundAmount: Number(e.target.value) })}
              min={0}
              step="0.01"
              error={errors.refundAmount}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>售后原因</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              label="详细描述"
              value={formData.reason || ''}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              rows={4}
              placeholder="请详细描述售后原因和客户诉求..."
              error={errors.reason}
            />

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                问题标签（可多选）
              </label>
              <div className="flex flex-wrap gap-2">
                {problemTags.map((tag) => {
                  const isSelected = formData.problemTags?.includes(tag.name);
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => toggleTag(tag.name)}
                      className={cn(
                        'px-3 py-1.5 rounded-full text-xs font-medium transition-colors border',
                        isSelected
                          ? 'border-transparent text-white'
                          : 'border-gray-200 text-gray-600 hover:bg-gray-50',
                      )}
                      style={isSelected ? { backgroundColor: tag.color } : {}}
                    >
                      {tag.name}
                      {tag.thresholdDays && ` (${tag.thresholdDays}天)`}
                    </button>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>处理配置</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input
              type="datetime-local"
              label="处理时限"
              value={formData.deadline ? new Date(formData.deadline).toISOString().slice(0, 16) : ''}
              onChange={(e) => setFormData({ ...formData, deadline: e.target.value ? new Date(e.target.value) : undefined })}
              error={errors.deadline}
            />
            <div className="flex items-center gap-3 pt-6">
              <input
                type="checkbox"
                id="isUrgent"
                checked={formData.isUrgent}
                onChange={(e) => setFormData({ ...formData, isUrgent: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <label htmlFor="isUrgent" className="text-sm font-medium text-gray-700">
                标记为紧急
              </label>
              {formData.isUrgent && (
                <Badge variant="danger">
                  <X className="h-3 w-3 mr-1" />
                  紧急
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>备注（可选）</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="其他需要说明的信息..."
              value={formData.note || ''}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              rows={2}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Link href="/orders">
            <Button variant="ghost" type="button">取消</Button>
          </Link>
          <Button variant="primary" type="submit" loading={loading}>
            <Plus className="mr-2 h-4 w-4" />
            创建售后单
          </Button>
        </div>
      </form>
    </div>
  );
}
