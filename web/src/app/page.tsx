export default function Home() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">活动票务座位分配任务分派台</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-2">管理端</h2>
          <p className="text-gray-600 mb-4">配置核销记录字典、退款材料规则、座位图阈值</p>
          <ul className="space-y-2 text-sm text-blue-600">
            <li><a href="/admin/check-in-dicts">核销字典管理</a></li>
            <li><a href="/admin/refund-rules">退款规则配置</a></li>
            <li><a href="/admin/seat-maps">座位图阈值</a></li>
            <li><a href="/admin/events">活动管理</a></li>
          </ul>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-2">业务侧</h2>
          <p className="text-gray-600 mb-4">购票订单管理、票种规则、退票争议处理</p>
          <ul className="space-y-2 text-sm text-green-600">
            <li><a href="/biz/orders">购票订单</a></li>
            <li><a href="/biz/ticket-types">票种规则</a></li>
            <li><a href="/biz/disputes">退票争议</a></li>
            <li><a href="/biz/operation-logs">操作记录</a></li>
          </ul>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-2">数据复盘</h2>
          <p className="text-gray-600 mb-4">上座率统计、趋势分析、收入概览</p>
          <ul className="space-y-2 text-sm text-purple-600">
            <li><a href="/biz/statistics">上座率复盘</a></li>
          </ul>
        </div>
      </div>
    </div>
  );
}
