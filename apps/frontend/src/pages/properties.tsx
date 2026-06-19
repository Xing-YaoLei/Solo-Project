import { useEffect, useState } from 'react';
import { Search, Plus, Building, BedDouble, ChevronRight, Home } from 'lucide-react';
import api from '@/lib/api';
import { cn } from '@/lib/utils';

interface Property {
  id: number;
  name: string;
  address: string;
  city: string;
  district: string;
  totalRooms: number;
  description: string;
  isActive: boolean;
  createdAt: string;
  _count?: { rooms: number; orders: number };
}

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [rooms, setRooms] = useState<any[]>([]);
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [newRoom, setNewRoom] = useState({
    roomNumber: '',
    roomType: '',
    floor: '',
    pricePerNight: '',
    description: '',
  });

  useEffect(() => {
    fetchProperties();
  }, [page, keyword]);

  const fetchProperties = async () => {
    setLoading(true);
    try {
      const params: any = { page, pageSize };
      if (keyword) params.keyword = keyword;

      const res = await api.get('/properties', { params });
      setProperties(res.data.list || []);
      setTotal(res.data.total || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const viewRooms = async (property: Property) => {
    setSelectedProperty(property);
    setShowRoomModal(true);
    try {
      const res = await api.get(`/properties/${property.id}/rooms?pageSize=100`);
      setRooms(res.data.list || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddRoom = async () => {
    if (!selectedProperty) return;
    try {
      await api.post(`/properties/${selectedProperty.id}/rooms`, {
        ...newRoom,
        floor: newRoom.floor ? parseInt(newRoom.floor) : null,
        pricePerNight: newRoom.pricePerNight ? parseFloat(newRoom.pricePerNight) : 0,
      });
      setNewRoom({
        roomNumber: '',
        roomType: '',
        floor: '',
        pricePerNight: '',
        description: '',
      });
      if (selectedProperty) {
        const res = await api.get(`/properties/${selectedProperty.id}/rooms?pageSize=100`);
        setRooms(res.data.list || []);
      }
    } catch (e: any) {
      alert(e.response?.data?.message || '添加失败');
    }
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜索房源名称、城市、地址..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="input pl-10 w-72"
            />
          </div>
        </div>
        <button className="btn btn-primary flex items-center gap-1">
          <Plus className="w-4 h-4" />
          新增房源
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="card p-4">
          <div className="text-sm text-gray-500">总房源数</div>
          <div className="text-2xl font-bold text-gray-800 mt-1 flex items-center gap-2">
            <Building className="w-6 h-6 text-blue-500" />
            {total}
          </div>
        </div>
        <div className="card p-4">
          <div className="text-sm text-gray-500">总房间数</div>
          <div className="text-2xl font-bold text-green-600 mt-1 flex items-center gap-2">
            <BedDouble className="w-6 h-6 text-green-500" />
            {properties.reduce((sum, p) => sum + (p._count?.rooms || 0), 0)}
          </div>
        </div>
        <div className="card p-4">
          <div className="text-sm text-gray-500">运营中</div>
          <div className="text-2xl font-bold text-primary-600 mt-1">
            {properties.filter(p => p.isActive).length}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full p-8 text-center text-gray-500">加载中...</div>
        ) : properties.length === 0 ? (
          <div className="col-span-full p-12 text-center text-gray-400">
            暂无房源数据
          </div>
        ) : (
          properties.map((property) => (
            <div
              key={property.id}
              onClick={() => viewRooms(property)}
              className="card p-5 cursor-pointer hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                    <Home className="w-6 h-6 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">{property.name}</h3>
                    <p className="text-xs text-gray-500">
                      {property.city} · {property.district}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
              <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                {property.address}
              </p>
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <BedDouble className="w-4 h-4" />
                    {property._count?.rooms || property.totalRooms} 间房
                  </span>
                </div>
                <span className={cn(
                  'badge',
                  property.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                )}>
                  {property.isActive ? '运营中' : '已停业'}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            共 {total} 条，第 {page}/{totalPages} 页
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50"
            >
              上一页
            </button>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50"
            >
              下一页
            </button>
          </div>
        </div>
      )}

      {showRoomModal && selectedProperty && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">
                  {selectedProperty.name} - 房间列表
                </h3>
                <p className="text-sm text-gray-500">{selectedProperty.address}</p>
              </div>
              <button
                onClick={() => setShowRoomModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-gray-600">共 {rooms.length} 间房</span>
                <button
                  onClick={() => {
                    /* 显示添加房间表单 */
                  }}
                  className="btn btn-primary text-sm flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  添加房间
                </button>
              </div>

              <div className="space-y-2">
                {rooms.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">暂无房间数据</div>
                ) : (
                  rooms.map((room) => (
                    <div
                      key={room.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded border border-gray-200 flex items-center justify-center">
                          <BedDouble className="w-5 h-5 text-gray-500" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-800">
                            {room.roomNumber}
                          </div>
                          <div className="text-xs text-gray-500">
                            {room.roomType || '未设置房型'}
                            {room.floor ? ` · ${room.floor}楼` : ''}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold text-primary-600">
                          ¥{room.pricePerNight}
                        </div>
                        <div className="text-xs text-gray-500">/晚</div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-gray-200">
                <h4 className="font-medium text-gray-800 mb-3">添加房间</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm text-gray-600">房间号</label>
                    <input
                      type="text"
                      value={newRoom.roomNumber}
                      onChange={(e) => setNewRoom({ ...newRoom, roomNumber: e.target.value })}
                      className="input mt-1 text-sm"
                      placeholder="如：101"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">房型</label>
                    <input
                      type="text"
                      value={newRoom.roomType}
                      onChange={(e) => setNewRoom({ ...newRoom, roomType: e.target.value })}
                      className="input mt-1 text-sm"
                      placeholder="如：标准大床房"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">楼层</label>
                    <input
                      type="number"
                      value={newRoom.floor}
                      onChange={(e) => setNewRoom({ ...newRoom, floor: e.target.value })}
                      className="input mt-1 text-sm"
                      placeholder="楼层"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">价格/晚</label>
                    <input
                      type="number"
                      value={newRoom.pricePerNight}
                      onChange={(e) => setNewRoom({ ...newRoom, pricePerNight: e.target.value })}
                      className="input mt-1 text-sm"
                      placeholder="价格"
                    />
                  </div>
                </div>
                <div className="mt-3">
                  <label className="text-sm text-gray-600">描述</label>
                  <input
                    type="text"
                    value={newRoom.description}
                    onChange={(e) => setNewRoom({ ...newRoom, description: e.target.value })}
                    className="input mt-1 text-sm"
                    placeholder="房间描述（可选）"
                  />
                </div>
                <button
                  onClick={handleAddRoom}
                  className="btn btn-primary w-full mt-3 text-sm"
                >
                  添加房间
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
