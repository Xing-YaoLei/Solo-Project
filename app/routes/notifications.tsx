import { useState, useEffect } from "react";
import { useLoaderData } from "@remix-run/react";
import { json } from "@remix-run/node";
import type { LoaderFunctionArgs } from "@remix-run/node";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const status = url.searchParams.get("status") || "active";

  const apiBase =
    process.env.API_BASE_URL ||
    `${url.protocol}//${url.host}/api`;

  try {
    const res = await fetch(`${apiBase}/notifications?status=${status}&pageSize=50`);
    const data = await res.json();
    return json({ notifications: data, status });
  } catch (error) {
    return json({ notifications: { list: [], unreadCount: 0 }, status });
  }
}

export default function Notifications() {
  const { notifications, status: initialStatus } = useLoaderData<typeof loader>();
  const [status, setStatus] = useState(initialStatus);
  const [notifList, setNotifList] = useState(notifications?.list || []);
  const [unreadCount, setUnreadCount] = useState(notifications?.unreadCount || 0);

  const fetchNotifications = async (s: string) => {
    try {
      const res = await fetch(`/api/notifications?status=${s}&pageSize=50`);
      const data = await res.json();
      setNotifList(data.list || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (error) {
      console.error(error);
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}/read`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      setNotifList(
        notifList.map((n: any) =>
          n._id === id ? { ...n, read: true } : n
        )
      );
      setUnreadCount(Math.max(0, unreadCount - 1));
    } catch (error) {
      console.error(error);
    }
  };

  const handleResolve = async (id: string) => {
    const remark = prompt("请输入处理备注（可选）");
    if (remark === null) return;
    try {
      await fetch(`/api/notifications/${id}/resolve`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ remark }),
      });
      fetchNotifications(status);
    } catch (error) {
      console.error(error);
    }
  };

  const getTypeIcon = (type: string) => {
    const map: Record<string, string> = {
      "material-missing": "📋",
      "material-urgent": "⚠️",
      "finance-change": "💰",
      "transfer-status": "🚗",
      "system-alert": "🔔",
      "task-assign": "📝",
      other: "📬",
    };
    return map[type] || "📬";
  };

  const getPriorityBadge = (priority: string) => {
    const map: Record<string, { label: string; className: string }> = {
      low: { label: "低", className: "badge badge-info" },
      medium: { label: "中", className: "badge badge-warning" },
      high: { label: "高", className: "badge badge-warning" },
      urgent: { label: "紧急", className: "badge badge-danger" },
    };
    const p = map[priority] || map.medium;
    return <span className={p.className}>{p.label}</span>;
  };

  const getStatusBadge = (s: string) => {
    const map: Record<string, { label: string; className: string }> = {
      active: { label: "进行中", className: "badge badge-warning" },
      resolved: { label: "已处理", className: "badge badge-success" },
      dismissed: { label: "已忽略", className: "badge badge-info" },
    };
    const st = map[s] || map.active;
    return <span className={st.className}>{st.label}</span>;
  };

  const formatDateTime = (date: string) => {
    if (!date) return "-";
    return new Date(date).toLocaleString("zh-CN");
  };

  const isRead = (n: any) => {
    return n.readBy?.some((r: any) => r.userId) || false;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">消息通知</h2>
          <p className="mt-1 text-sm text-gray-500">
            资料缺失提醒、系统通知等，共 {unreadCount} 条未读
          </p>
        </div>
        <div className="flex space-x-2">
          <button
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              status === "active"
                ? "bg-primary-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
            onClick={() => {
              setStatus("active");
              fetchNotifications("active");
            }}
          >
            进行中 ({unreadCount})
          </button>
          <button
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              status === "resolved"
                ? "bg-primary-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
            onClick={() => {
              setStatus("resolved");
              fetchNotifications("resolved");
            }}
          >
            已处理
          </button>
          <button
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              status === "all"
                ? "bg-primary-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
            onClick={() => {
              setStatus("all");
              fetchNotifications("all");
            }}
          >
            全部
          </button>
        </div>
      </div>

      <div className="card">
        {notifList.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-5xl mb-4">📭</p>
            <p className="text-gray-500">暂无消息通知</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifList.map((notif: any) => (
              <div
                key={notif._id}
                className={`p-4 rounded-lg border transition-colors ${
                  !isRead(notif) && notif.status === "active"
                    ? "bg-blue-50 border-blue-200"
                    : "bg-white border-gray-200 hover:bg-gray-50"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="text-3xl">{getTypeIcon(notif.type)}</div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-gray-900">
                            {notif.title}
                          </h4>
                          {getPriorityBadge(notif.priority)}
                          {getStatusBadge(notif.status)}
                          {!isRead(notif) && notif.status === "active" && (
                            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          {formatDateTime(notif.createdAt)}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {notif.status === "active" && (
                          <>
                            {!isRead(notif) && (
                              <button
                                className="btn-secondary text-sm"
                                onClick={() => handleMarkRead(notif._id)}
                              >
                                标记已读
                              </button>
                            )}
                            <button
                              className="btn-primary text-sm"
                              onClick={() => handleResolve(notif._id)}
                            >
                              处理
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                    <p className="mt-2 text-gray-700">{notif.content}</p>
                    {notif.resolvedBy && (
                      <div className="mt-3 pt-3 border-t text-sm text-gray-500">
                        <p>
                          处理人：{notif.resolvedBy} | 处理时间：
                          {formatDateTime(notif.resolvedAt)}
                        </p>
                        {notif.resolvedRemark && (
                          <p className="mt-1">处理备注：{notif.resolvedRemark}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
