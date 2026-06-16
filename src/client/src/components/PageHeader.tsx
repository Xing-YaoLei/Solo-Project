import React from 'react';
import { Breadcrumb, Button, Space, Typography } from 'antd';
import type { BreadcrumbProps, ButtonProps } from 'antd';

const { Title } = Typography;

export interface ActionButton extends ButtonProps {
  key: string;
  label: string;
  onClick?: () => void;
}

interface PageHeaderProps {
  title: string;
  breadcrumb?: BreadcrumbProps['items'];
  subtitle?: string;
  actions?: ActionButton[];
  extra?: React.ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  breadcrumb,
  subtitle,
  actions,
  extra,
}) => {
  return (
    <div style={{ marginBottom: 24 }}>
      {breadcrumb && <Breadcrumb style={{ marginBottom: 16 }} items={breadcrumb} />}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap' as const,
          gap: 16,
        }}
      >
        <div>
          <Title level={4} style={{ margin: 0, marginBottom: subtitle ? 8 : 0 }}>
            {title}
          </Title>
          {subtitle && (
            <Typography.Text type="secondary">{subtitle}</Typography.Text>
          )}
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
          }}
        >
          {extra}
          {actions && actions.length > 0 && (
            <Space>
              {actions.map((action) => {
                const { key, label, onClick, ...rest } = action;
                return (
                  <Button key={key} onClick={onClick} {...rest}>
                    {label}
                  </Button>
                );
              })}
            </Space>
          )}
        </div>
      </div>
    </div>
  );
};

export default PageHeader;
