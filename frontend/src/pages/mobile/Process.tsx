import { useState } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Button,
  TextArea,
  ImageUploader,
  Card,
  Tag,
  Toast,
} from 'antd-mobile';
import { ArrowLeftOutline, CheckCircleOutline } from 'antd-mobile-icons';
import { orderAPI, uploadAPI } from '@/services/api';
import { OrderStatus, OrderStatusText } from '@/types';
import dayjs from 'dayjs';

export default function MobileProcess() {
  const params = useParams({ from: '/m/process/$orderId' });
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [remark, setRemark] = useState('');
  const [files, setFiles] = useState<any[]>([]);
  const [orderDetail, setOrderDetail] = useState<any>(null);

  useState(() => {
    orderAPI.get(Number(params.orderId)).then((res) => setOrderDetail(res.data));
  });

  const processMutation = useMutation({
    mutationFn: (data: any) => orderAPI.process(Number(params.orderId), data),
    onSuccess: () => {
      Toast.show({ icon: 'success', content: '处理成功' });
      queryClient.invalidateQueries({ queryKey: ['mobileOrder', params.orderId] });
      queryClient.invalidateQueries({ queryKey: ['mobileOrders'] });
      setTimeout(() => {
        navigate({ to: '/m/orders/$orderId', params: { orderId: params.orderId } });
      }, 1000);
    },
    onError: () => {
      Toast.show({ icon: 'fail', content: '处理失败' });
    },
  });

  const getNextStatus = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.ASSIGNED:
        return { status: OrderStatus.PROCESSING, action: '开始处理' };
      case OrderStatus.PROCESSING:
        return { status: OrderStatus.COMPLETED, action: '处理完成' };
      case OrderStatus.COMPLETED:
        return { status: OrderStatus.REVIEWING, action: '提交复核' };
      case OrderStatus.REVIEW_FAILED:
        return { status: OrderStatus.PROCESSING, action: '重新处理' };
      default:
        return null;
    }
  };

  const handleUpload = async (file: any) => {
    try {
      const formData = new FormData();
      formData.append('file', file.file);
      const response = await uploadAPI.uploadFile(file.file);
      return {
        url: response.data.url,
        name: file.file.name,
      };
    } catch (error) {
      Toast.show({ icon: 'fail', content: '上传失败' });
      return null;
    }
  };

  const handleSubmit = async () => {
    if (!orderDetail) return;
    const next = getNextStatus(orderDetail.status);
    if (!next) return;

    const uploadedFiles = files.filter((f) => f.url);
    processMutation.mutate({
      action: next.action,
      new_status: next.status,
      remark: remark || undefined,
    });
  };

  const next = orderDetail ? getNextStatus(orderDetail.status) : null;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="sticky top-0 bg-white z-10 border-b">
        <div className="flex items-center px-4 py-3 gap-3">
          <button
            onClick={() =>
              navigate({ to: '/m/orders/$orderId', params: { orderId: params.orderId } })
            }
            className="text-gray-600"
          >
            <ArrowLeftOutline fontSize={20} />
          </button>
          <h1 className="flex-1 font-medium">快速处理</h1>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {orderDetail && (
          <Card>
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="text-xs text-gray-500">{orderDetail.order_no}</div>
                <div className="font-medium text-gray-800">{orderDetail.title}</div>
              </div>
              <Tag color={['default', 'blue', 'orange', 'red'][orderDetail.priority]}>
                P{orderDetail.priority}
              </Tag>
            </div>
            {next && (
              <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                <div className="text-sm text-blue-600 font-medium">
                  当前状态: {OrderStatusText[orderDetail.status]}
                </div>
                <div className="text-sm text-blue-500 mt-1">
                  下一步操作: {next.action} → {OrderStatusText[next.status]}
                </div>
              </div>
            )}
          </Card>
        )}

        <Card title="处理备注">
          <TextArea
            placeholder="请输入处理说明（可选）"
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
            rows={4}
            showCount
            maxLength={500}
          />
        </Card>

        <Card title="上传凭证">
          <ImageUploader
            value={files}
            onChange={setFiles}
            upload={handleUpload}
            maxCount={9}
            multiple
            capture={['camera']}
          />
          <div className="text-xs text-gray-400 mt-2">
            点击相机图标可直接拍照上传，支持多张图片
          </div>
        </Card>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4">
        <div className="flex gap-3">
          <Button
            block
            onClick={() =>
              navigate({ to: '/m/orders/$orderId', params: { orderId: params.orderId } })
            }
          >
            取消
          </Button>
          <Button
            block
            type="primary"
            color="primary"
            size="large"
            onClick={handleSubmit}
            loading={processMutation.isPending}
            icon={<CheckCircleOutline />}
          >
            {next?.action || '确认处理'}
          </Button>
        </div>
      </div>
    </div>
  );
}
