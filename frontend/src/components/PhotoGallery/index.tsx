import { useState } from 'react';
import { Card, Tabs, Upload, List, Image, Button, message, Modal } from 'antd';
import { 
  CameraOutlined, UploadOutlined, EyeOutlined, 
  DeleteOutlined 
} from '@ant-design/icons';
import type { UploadFile, UploadProps } from 'antd/es/upload/interface';
import type { PhotoRecord, PhotoType } from '@/types';

interface PhotoGalleryProps {
  photos?: PhotoRecord[];
  onUpload?: (photoType: PhotoType, file: File) => void;
  onDelete?: (id: number) => void;
  loading?: boolean;
}

const tabItems = [
  { key: 'CheckIn', label: '进厂照片' },
  { key: 'InService', label: '维修中' },
  { key: 'Completed', label: '完工照片' },
];

export default function PhotoGallery({ 
  photos = [], 
  onUpload, 
  onDelete,
  loading 
}: PhotoGalleryProps) {
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [activeTab, setActiveTab] = useState<PhotoType>('CheckIn');

  const handlePreview = (url: string) => {
    setPreviewImage(url);
    setPreviewVisible(true);
  };

  const getPhotosByType = (photoType: PhotoType) => {
    return photos.filter(p => p.photoType === photoType);
  };

  const uploadProps: UploadProps = {
    beforeUpload: (file) => {
      if (onUpload) {
        onUpload(activeTab, file);
      }
      message.success('照片上传成功');
      return false;
    },
    showUploadList: false,
    accept: 'image/*',
    multiple: true,
  };

  const renderPhotoList = (photoType: PhotoType) => {
    const typePhotos = getPhotosByType(photoType);
    
    return (
      <div>
        {typePhotos.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            color: '#999', 
            padding: '30px 0',
            border: '1px dashed #d9d9d9',
            borderRadius: 8,
          }}>
            <CameraOutlined style={{ fontSize: 32, marginBottom: 8 }} />
            <p>暂无照片</p>
          </div>
        ) : (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(2, 1fr)', 
            gap: 8 
          }}>
            {typePhotos.map((photo) => (
              <div
                key={photo.id}
                style={{
                  position: 'relative',
                  borderRadius: 6,
                  overflow: 'hidden',
                  border: '1px solid #f0f0f0',
                  aspectRatio: '1',
                  background: '#f5f5f5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {photo.photoUrl ? (
                  <Image
                    src={photo.photoUrl}
                    alt={photo.remarks || '照片'}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    preview={{ visible: false }}
                  />
                ) : (
                  <div style={{ textAlign: 'center', color: '#999' }}>
                    <CameraOutlined style={{ fontSize: 24 }} />
                    <p style={{ fontSize: 12, marginTop: 4 }}>{photo.remarks || '照片'}</p>
                  </div>
                )}
                <div
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    background: 'rgba(0,0,0,0.6)',
                    color: 'white',
                    fontSize: 11,
                    padding: '4px 6px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span style={{ fontSize: 10 }}>{photo.uploader}</span>
                  <span style={{ fontSize: 10 }}>{photo.uploadTime.slice(11, 16)}</span>
                </div>
                {onDelete && (
                  <Button
                    type="text"
                    danger
                    size="small"
                    icon={<DeleteOutlined />}
                    style={{
                      position: 'absolute',
                      top: 2,
                      right: 2,
                      background: 'rgba(255,255,255,0.9)',
                      padding: '0 4px',
                      height: 20,
                      fontSize: 12,
                    }}
                    onClick={() => onDelete(photo.id)}
                  />
                )}
              </div>
            ))}
          </div>
        )}
        
        {onUpload && (
          <Upload {...uploadProps}>
            <Button
              type="dashed"
              icon={<UploadOutlined />}
              style={{ width: '100%', marginTop: 12 }}
              size="small"
            >
              上传照片
            </Button>
          </Upload>
        )}
      </div>
    );
  };

  return (
    <Card
      title={
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <CameraOutlined />
          质检照片
        </span>
      }
      loading={loading}
      style={{ height: '100%' }}
      size="small"
      extra={<span style={{ fontSize: 12, color: '#999' }}>共 {photos.length} 张</span>}
    >
      <Tabs
        defaultActiveKey="CheckIn"
        size="small"
        items={tabItems.map(item => ({
          ...item,
          children: renderPhotoList(item.key as PhotoType),
        }))}
        onChange={(key) => setActiveTab(key as PhotoType)}
      />
      
      <Modal
        open={previewVisible}
        footer={null}
        onCancel={() => setPreviewVisible(false)}
      >
        <img alt="preview" style={{ width: '100%' }} src={previewImage} />
      </Modal>
    </Card>
  );
}
