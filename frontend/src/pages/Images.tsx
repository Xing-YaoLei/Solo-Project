import { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Button,
  Upload,
  Select,
  Input,
  message,
  Modal,
  Image,
  Tag,
  Empty,
} from 'antd';
import {
  UploadOutlined,
  SearchOutlined,
  PictureOutlined,
  DeleteOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { imageApi } from '../services';
import type { ImageAttachment } from '../types';
import { formatFileSize, formatDateTime } from '../utils/format';

const { Option } = Select;

const Images = () => {
  const [images, setImages] = useState<ImageAttachment[]>([]);
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState<string | undefined>();
  const [searchText, setSearchText] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    loadImages();
  }, [category]);

  const loadImages = async () => {
    try {
      setLoading(true);
      const response = await imageApi.getImages({
        category,
        pageSize: 50,
      });
      setImages(response.data);
    } catch (error) {
      console.error('加载影像失败:', error);
      message.error('加载影像失败');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('patientId', '1');
      formData.append('category', category || '');

      await imageApi.uploadImage(formData);
      message.success('上传成功');
      loadImages();
    } catch (error) {
      message.error('上传失败');
    }
    return false;
  };

  const handleDelete = async (id: number) => {
    try {
      await imageApi.deleteImage(id);
      message.success('删除成功');
      loadImages();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const categories = ['口腔全景片', '头颅侧位片', 'CBCT', '口内照片', '治疗前', '治疗中', '治疗后'];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 className="page-title" style={{ margin: 0 }}>
          影像附件
        </h2>
        <Upload
          showUploadList={false}
          beforeUpload={handleUpload}
          accept="image/*"
        >
          <Button type="primary" icon={<UploadOutlined />}>
            上传影像
          </Button>
        </Upload>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={6}>
            <div style={{ marginBottom: 8, color: '#666' }}>分类</div>
            <Select
              placeholder="全部分类"
              allowClear
              style={{ width: '100%' }}
              value={category}
              onChange={setCategory}
            >
              {categories.map((cat) => (
                <Option key={cat} value={cat}>
                  {cat}
                </Option>
              ))}
            </Select>
          </Col>
          <Col span={12}>
            <div style={{ marginBottom: 8, color: '#666' }}>搜索</div>
            <Input
              placeholder="搜索文件名/描述"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </Col>
        </Row>
      </Card>

      {images.length > 0 ? (
        <Row gutter={[16, 16]}>
          {images.map((img) => (
            <Col span={6} key={img.id}>
              <Card
                hoverable
                loading={loading}
                cover={
                  <div
                    style={{
                      height: 160,
                      background: '#f5f5f5',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                    }}
                    onClick={() => setPreviewImage(img.filePath || '')}
                  >
                    <PictureOutlined style={{ fontSize: 48, color: '#ccc' }} />
                    <div style={{ fontSize: 12, color: '#999', marginTop: 8 }}>
                      点击预览
                    </div>
                  </div>
                }
                actions={[
                  <EyeOutlined
                    key="view"
                    onClick={() => setPreviewImage(img.filePath || '')}
                  />,
                  <DeleteOutlined
                    key="delete"
                    onClick={() => handleDelete(img.id)}
                  />,
                ]}
              >
                <Card.Meta
                  title={
                    <div
                      style={{
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {img.fileName}
                    </div>
                  }
                  description={
                    <div>
                      {img.category && (
                        <Tag color="blue" style={{ marginBottom: 4 }}>
                          {img.category}
                        </Tag>
                      )}
                      <div style={{ fontSize: 12, color: '#999' }}>
                        {formatFileSize(img.fileSize)}
                      </div>
                      <div style={{ fontSize: 12, color: '#999' }}>
                        {formatDateTime(img.uploadedAt)}
                      </div>
                    </div>
                  }
                />
              </Card>
            </Col>
          ))}
        </Row>
      ) : (
        <Card>
          <Empty description="暂无影像资料" />
        </Card>
      )}

      <Modal
        open={!!previewImage}
        footer={null}
        onCancel={() => setPreviewImage(null)}
        width={800}
        title="影像预览"
      >
        {previewImage && (
          <div style={{ textAlign: 'center' }}>
            <Image
              src={previewImage}
              alt="影像预览"
              style={{ maxWidth: '100%', maxHeight: '60vh' }}
              fallback="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23ccc'%3E%3Cpath d='M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z'/%3E%3C/svg%3E"
            />
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Images;
