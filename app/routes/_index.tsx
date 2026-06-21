import { Link } from "@remix-run/react";

export default function Index() {
  const stats = [
    { title: "在库车辆", value: "0", color: "bg-blue-500", href: "/records" },
    { title: "待过户车辆", value: "0", color: "bg-yellow-500", href: "/records" },
    { title: "本月成交", value: "0", color: "bg-green-500", href: "/review" },
    { title: "待处理通知", value: "0", color: "bg-red-500", href: "/notifications" },
  ];

  const modules = [
    {
      title: "记录页",
      description: "查看车辆整备清单、试驾记录和报价历史",
      icon: "📋",
      href: "/records",
    },
    {
      title: "金融资料",
      description: "管理车辆金融信息，追踪所有修改记录",
      icon: "💰",
      href: "/finance",
    },
    {
      title: "月底复盘",
      description: "库存周转分析、销售数据统计",
      icon: "📊",
      href: "/review",
    },
    {
      title: "消息通知",
      description: "接收资料缺失提醒和系统通知",
      icon: "🔔",
      href: "/notifications",
    },
    {
      title: "操作日志",
      description: "查看所有操作记录，包含原因、动作和关闭时间",
      icon: "📝",
      href: "/logs",
    },
    {
      title: "数据导出",
      description: "导出各类数据报表，带筛选条件和操作人信息",
      icon: "📤",
      href: "/export",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">工作台</h2>
        <p className="mt-1 text-sm text-gray-500">二手车门店过户材料结算台</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link
            key={stat.title}
            to={stat.href}
            className="card hover:shadow-md transition-shadow"
          >
            <div className="flex items-center">
              <div className={`w-3 h-12 ${stat.color} rounded mr-4`}></div>
              <div>
                <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">功能模块</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {modules.map((module) => (
            <Link
              key={module.title}
              to={module.href}
              className="card hover:shadow-md transition-shadow group"
            >
              <div className="text-4xl mb-3">{module.icon}</div>
              <h4 className="text-lg font-semibold text-gray-900 group-hover:text-primary-600">
                {module.title}
              </h4>
              <p className="mt-1 text-sm text-gray-500">{module.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
