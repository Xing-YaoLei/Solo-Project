import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Shield, AlertTriangle, Loader2 } from 'lucide-react';
import { api } from '../utils/api';
import { useAppStore } from '../store';
import type { UserRole } from '../../shared/types';

export default function ShareAccess() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const setUser = useAppStore((state) => state.setUser);
  const setDataScope = useAppStore((state) => state.setDataScope);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const validateShare = async () => {
      if (!token) {
        setError('无效的分享链接');
        setLoading(false);
        return;
      }

      try {
        const data = await api.getShareData(token);
        setUser(data.user);
        setDataScope(data.dataScope as { areas: string[]; roles: UserRole[] });
        navigate('/');
      } catch (err) {
        setError(err instanceof Error ? err.message : '分享链接验证失败');
      } finally {
        setLoading(false);
      }
    };

    validateShare();
  }, [token, navigate, setUser, setDataScope]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-indigo-400 animate-spin mx-auto mb-4" />
          <p className="text-indigo-200">正在验证分享链接...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 flex items-center justify-center p-6">
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 max-w-md text-center border border-white/10">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">链接无效</h2>
          <p className="text-indigo-200 mb-6">{error}</p>
          <button
            onClick={() => navigate('/login')}
            className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors"
          >
            返回登录
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 flex items-center justify-center p-6">
      <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 max-w-md text-center border border-white/10">
        <div className="w-16 h-16 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <Shield className="w-8 h-8 text-indigo-400" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">正在跳转</h2>
        <p className="text-indigo-200">请稍候...</p>
      </div>
    </div>
  );
}
