import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { createLazyFileRoute, useNavigate } from '@tanstack/react-router';
import { Form, Input, Button, Card, Typography, Space, Divider, message } from 'antd';
import { UserOutlined, LockOutlined, LoginOutlined, UserAddOutlined } from '@ant-design/icons';
import { useAuth } from '../store/auth';
import { ROLE_LABELS } from '../types';
import { useState } from 'react';
const { Title, Text } = Typography;
export const Route = createLazyFileRoute('/login')({
    component: LoginPage,
});
function LoginPage() {
    const navigate = useNavigate();
    const { login, register } = useAuth();
    const [mode, setMode] = useState('login');
    const [loading, setLoading] = useState(false);
    const [form] = Form.useForm();
    const handleSubmit = async (values) => {
        setLoading(true);
        try {
            if (mode === 'login') {
                await login(values.username, values.password);
                message.success('登录成功');
                navigate({ to: '/' });
            }
            else {
                await register({
                    username: values.username,
                    password: values.password,
                    full_name: values.full_name,
                    email: values.email,
                    phone: values.phone,
                    role: values.role || 'tourist',
                });
                message.success('注册成功，请登录');
                setMode('login');
                form.resetFields();
            }
        }
        catch {
            /* error handled in interceptor */
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsx("div", { style: {
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            padding: 24,
        }, children: _jsx(Card, { style: { width: 440, boxShadow: '0 8px 32px rgba(0,0,0,0.2)', borderRadius: 12 }, styles: { body: { padding: 40 } }, children: _jsxs(Space, { direction: "vertical", size: "large", style: { width: '100%' }, children: [_jsxs("div", { style: { textAlign: 'center' }, children: [_jsx(Title, { level: 2, style: { margin: 0, color: '#1677ff' }, children: "\uD83C\uDFA1 \u666F\u533A\u8FD0\u8425\u5BFC\u89C8\u8DDF\u8FDB\u53F0" }), _jsx(Text, { type: "secondary", children: mode === 'login' ? '整理导览流程 · 集中核对点位/内容/座位/合同' : '创建新账号' })] }), _jsxs(Form, { form: form, layout: "vertical", onFinish: handleSubmit, size: "large", children: [_jsx(Form.Item, { name: "username", rules: [{ required: true, message: '请输入用户名' }], children: _jsx(Input, { prefix: _jsx(UserOutlined, {}), placeholder: "\u7528\u6237\u540D", allowClear: true }) }), mode === 'register' && (_jsxs(_Fragment, { children: [_jsx(Form.Item, { name: "full_name", rules: [{ required: true, message: '请输入姓名' }], children: _jsx(Input, { placeholder: "\u771F\u5B9E\u59D3\u540D", allowClear: true }) }), _jsx(Form.Item, { name: "email", children: _jsx(Input, { placeholder: "\u90AE\u7BB1 (\u53EF\u9009)", allowClear: true }) }), _jsx(Form.Item, { name: "phone", children: _jsx(Input, { placeholder: "\u624B\u673A (\u53EF\u9009)", allowClear: true }) }), _jsx(Form.Item, { name: "role", initialValue: "tourist", children: _jsx(Input.Group, { compact: true, children: _jsx("select", { className: "ant-input", style: { width: '100%', height: 40, borderRadius: 6 }, defaultValue: "tourist", onChange: (e) => form.setFieldValue('role', e.target.value), children: Object.keys(ROLE_LABELS).map((r) => (_jsx("option", { value: r, children: ROLE_LABELS[r] }, r))) }) }) })] })), _jsx(Form.Item, { name: "password", rules: [
                                    { required: true, message: '请输入密码' },
                                    { min: 6, message: '密码至少 6 位' },
                                ], children: _jsx(Input.Password, { prefix: _jsx(LockOutlined, {}), placeholder: "\u5BC6\u7801", allowClear: true }) }), _jsx(Form.Item, { style: { marginBottom: 8 }, children: _jsx(Button, { type: "primary", htmlType: "submit", block: true, loading: loading, icon: mode === 'login' ? _jsx(LoginOutlined, {}) : _jsx(UserAddOutlined, {}), size: "large", children: mode === 'login' ? '登录' : '注册' }) }), _jsx(Divider, { style: { margin: '8px 0' } }), _jsx(Button, { type: "link", block: true, onClick: () => setMode(mode === 'login' ? 'register' : 'login'), children: mode === 'login' ? '没有账号？立即注册' : '已有账号？去登录' })] })] }) }) }));
}
