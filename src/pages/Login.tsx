import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, User, Shield, Users } from 'lucide-react';
import { api, roleLabels } from '../utils/api';
import { useAppStore } from '../store';
import type { User as UserType } from '../../shared/types';

export default function Login() {
  const navigate = useNavigate();
  const setUser = useAppStore((state) => state.setUser);
  const [users, setUsers] = useState<UserType[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const data = await api.getUsers();
        setUsers(data);
        if (data.length > 0) {
          setSelectedUserId(data[0].id);
        }
      } catch (error) {
        console.error('Failed to load users:', error);
      }
    };
    loadUsers();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) return;

    setLoading(true);
    try {
      const user = await api.login(selectedUserId);
      setUser(user);
      navigate('/');
    } catch (error) {
      console.error('Login failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 flex items-center justify-center p-6">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl mb-4 shadow-2xl shadow-indigo-500/30">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">
            长租公寓退租验房
          </h1>
          <p className="text-indigo-200 text-sm">风险监测平台</p>
        </div>

        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/10">
          <div className="flex items-center gap-2 mb-6">
            <Users className="w-5 h-5 text-indigo-300" />
            <h2 className="text-lg font-semibold text-white">选择登录角色</h2>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              {users.map((user) => (
                <label
                  key={user.id}
                  className={`flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all duration-200 border-2 ${
                    selectedUserId === user.id
                      ? 'bg-indigo-600/30 border-indigo-500'
                      : 'bg-white/5 border-transparent hover:bg-white/10'
                  }`}
                >
                  <input
                    type="radio"
                    name="userId"
                    value={user.id}
                    checked={selectedUserId === user.id}
                    onChange={() => setSelectedUserId(user.id)}
                    className="sr-only"
                  />
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    selectedUserId === user.id
                      ? 'bg-indigo-500'
                      : 'bg-white/10'
                  }`}>
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-medium">{user.name}</p>
                    <p className="text-indigo-200 text-sm">{roleLabels[user.role]}</p>
                    {user.area && (
                      <p className="text-indigo-300 text-xs mt-1">
                        管辖区域：{user.area}
                      </p>
                    )}
                  </div>
                  <Shield className={`w-5 h-5 ${
                    selectedUserId === user.id ? 'text-indigo-300' : 'text-indigo-400/50'
                  }`} />
                </label>
              ))}
            </div>

            <button
              type="submit"
              disabled={loading || !selectedUserId}
              className="w-full py-4 px-6 bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-semibold rounded-xl shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '登录中...' : '进入平台'}
            </button>
          </form>

          <p className="text-indigo-200/60 text-xs text-center mt-6">
            不同角色登录后可见的数据范围不同
          </p>
        </div>
      </div>
    </div>
  );
}
