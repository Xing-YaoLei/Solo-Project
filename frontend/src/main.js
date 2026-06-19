import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider, createRouter } from '@tanstack/react-router';
import { ConfigProvider, App as AntdApp, theme } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import 'dayjs/locale/zh-cn';
import './index.css';
import { routeTree } from './routeTree.gen';
const router = createRouter({
    routeTree,
    context: {},
    defaultPreload: 'intent',
    defaultStaleTime: 5000,
});
ReactDOM.createRoot(document.getElementById('root')).render(_jsx(React.StrictMode, { children: _jsx(ConfigProvider, { locale: zhCN, theme: {
            algorithm: theme.defaultAlgorithm,
            token: {
                colorPrimary: '#1677ff',
                borderRadius: 6,
            },
        }, children: _jsx(AntdApp, { children: _jsx(RouterProvider, { router: router }) }) }) }));
