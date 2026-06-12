import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import 'antd/dist/reset.css';
import App from './App';

// 全局样式 - 基础设置
const globalStyle = {
  height: '100%',
  margin: 0,
  padding: 0,
};

// 应用根组件
const Root = () => {
  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: '#1677ff',
          borderRadius: 6,
        },
      }}
    >
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ConfigProvider>
  );
};

// 创建根节点并渲染
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<Root />);
