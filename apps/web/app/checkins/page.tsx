"use client";

import { useState } from "react";
import {
  Search,
  Filter,
  MapPin,
  Clock,
  User,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Users,
  Timer,
  Building2,
  X,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

const mockCheckins = [
  {
    id: "1",
    workerName: "张师傅",
    workType: "水电工",
    project: "阳光花园 3 栋 201",
    checkinTime: "2024-01-15 08:00",
    checkoutTime: null,
    location: "阳光花园小区 - 东门入口",
    duration: "进行中",
    status: "工作中",
    photoUrl: "https://picsum.photos/100/100?random=1",
    remark: "正常上班",
  },
  {
    id: "2",
    workerName: "李师傅",
    workType: "瓦工",
    project: "阳光花园 5 栋 101",
    checkinTime: "2024-01-15 07:30",
    checkoutTime: null,
    location: "阳光花园小区 - 西门入口",
    duration: "进行中",
    status: "工作中",
    photoUrl: "https://picsum.photos/100/100?random=2",
    remark: "提前到岗",
  },
  {
    id: "3",
    workerName: "王师傅",
    workType: "木工",
    project: "中央公园 1 栋 502",
    checkinTime: "2024-01-15 08:30",
    checkoutTime: null,
    location: "中央公园小区 - 南门入口",
    duration: "进行中",
    status: "工作中",
    photoUrl: "https://picsum.photos/100/100?random=3",
    remark: "",
  },
  {
    id: "4",
    workerName: "赵师傅",
    workType: "油漆工",
    project: "中央公园 2 栋 303",
    checkinTime: "2024-01-15 09:00",
    checkoutTime: "2024-01-15 17:30",
    location: "中央公园小区 - 北门入口",
    duration: "8.5小时",
    status: "已签退",
    photoUrl: "https://picsum.photos/100/100?random=4",
    remark: "有事提前走",
  },
  {
    id: "5",
    workerName: "孙师傅",
    workType: "水电工",
    project: "阳光花园 3 栋 401",
    checkinTime: "2024-01-15 08:00",
    checkoutTime: null,
    location: "阳光花园小区 - 东门入口",
    duration: "进行中",
    status: "工作中",
    photoUrl: "https://picsum.photos/100/100?random=5",
    remark: "",
  },
  {
    id: "6",
    workerName: "周师傅",
    workType: "泥工",
    project: "阳光花园 3 栋 201",
    checkinTime: "2024-01-15 08:00",
    checkoutTime: "2024-01-15 18:00",
    location: "阳光花园小区 - 东门入口",
    duration: "10小时",
    status: "已签退",
    photoUrl: "https://picsum.photos/100/100?random=6",
    remark: "加班完成任务",
  },
  {
    id: "7",
    workerName: "吴师傅",
    workType: "木工",
    project: "阳光花园 5 栋 101",
    checkinTime: "2024-01-15 08:15",
    checkoutTime: null,
    location: "阳光花园小区 - 西门入口",
    duration: "进行中",
    status: "工作中",
    photoUrl: "https://picsum.photos/100/100?random=7",
    remark: "",
  },
  {
    id: "8",
    workerName: "郑师傅",
    workType: "油漆工",
    project: "中央公园 1 栋 502",
    checkinTime: "2024-01-15 08:45",
    checkoutTime: null,
    location: "中央公园小区 - 南门入口",
    duration: "进行中",
    status: "工作中",
    photoUrl: "https://picsum.photos/100/100?random=8",
    remark: "",
  },
];

const projects = [
  { id: "all", name: "全部项目" },
  { id: "1", name: "阳光花园 3 栋 201" },
  { id: "2", name: "阳光花园 5 栋 101" },
  { id: "3", name: "阳光花园 3 栋 401" },
  { id: "4", name: "中央公园 1 栋 502" },
  { id: "5", name: "中央公园 2 栋 303" },
];

const dateOptions = [
  { value: "today", label: "今天" },
  { value: "yesterday", label: "昨天" },
  { value: "week", label: "本周" },
  { value: "month", label: "本月" },
];

const locations = [
  {
    name: "阳光花园小区",
    address: "朝阳区阳光路123号",
    workers: 5,
    checkins: ["张师傅", "李师傅", "孙师傅", "周师傅", "吴师傅"],
  },
  {
    name: "中央公园小区",
    address: "海淀区公园大道456号",
    workers: 3,
    checkins: ["王师傅", "赵师傅", "郑师傅"],
  },
];

export default function CheckinsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProject, setSelectedProject] = useState("all");
  const [selectedDate, setSelectedDate] = useState("today");
  const [customDate, setCustomDate] = useState("2024-01-15");
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  const filteredCheckins = mockCheckins.filter((checkin) => {
    const matchesSearch =
      checkin.workerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      checkin.workType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      checkin.project.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesProject =
      selectedProject === "all" || checkin.project === projects.find((p) => p.id === selectedProject)?.name;
    return matchesSearch && matchesProject;
  });

  const workingCount = filteredCheckins.filter((c) => c.status === "工作中").length;
  const checkedOutCount = filteredCheckins.filter((c) => c.status === "已签退").length;
  const totalHours = filteredCheckins.reduce((sum, c) => {
    if (c.duration === "进行中") return sum;
    const hours = parseFloat(c.duration.replace("小时", ""));
    return sum + hours;
  }, 0);

  const stats = [
    {
      label: "今日签到",
      value: filteredCheckins.length,
      icon: <Users className="h-5 w-5" />,
      color: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
    },
    {
      label: "工作中",
      value: workingCount,
      icon: <Timer className="h-5 w-5" />,
      color: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
    },
    {
      label: "已签退",
      value: checkedOutCount,
      icon: <Check className="h-5 w-5" />,
      color: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
    },
    {
      label: "工时总计",
      value: `${totalHours.toFixed(1)}h`,
      icon: <Clock className="h-5 w-5" />,
      color: "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">工人签到</h1>
          <p className="text-muted-foreground mt-1">查看和管理工人签到记录</p>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-lg border bg-card p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-bold mt-1">{stat.value}</p>
              </div>
              <div className={cn("p-3 rounded-lg", stat.color)}>
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-lg border bg-card">
          <div className="p-4 border-b space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="search"
                  placeholder="搜索工人、工种、项目..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-9 w-full rounded-lg border bg-background pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">筛选：</span>
              </div>

              <div className="relative">
                <button
                  onClick={() => setDatePickerOpen(!datePickerOpen)}
                  className="inline-flex items-center gap-2 h-9 rounded-lg border bg-background px-3 text-sm hover:bg-muted transition-colors"
                >
                  <Calendar className="h-4 w-4" />
                  <span>{customDate}</span>
                </button>
                {datePickerOpen && (
                  <div className="absolute top-full left-0 mt-1 z-10 rounded-lg border bg-card p-3 shadow-lg">
                    <div className="flex items-center justify-between mb-3">
                      <button className="p-1 hover:bg-muted rounded">
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <span className="text-sm font-medium">2024年1月</span>
                      <button className="p-1 hover:bg-muted rounded">
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-7 gap-1 text-center text-xs">
                      {["日", "一", "二", "三", "四", "五", "六"].map((day) => (
                        <div key={day} className="p-2 text-muted-foreground">
                          {day}
                        </div>
                      ))}
                      {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                        <button
                          key={day}
                          onClick={() => {
                            setCustomDate(`2024-01-${day.toString().padStart(2, "0")}`);
                            setDatePickerOpen(false);
                          }}
                          className={cn(
                            "p-2 rounded hover:bg-muted transition-colors",
                            day === 15 && "bg-primary text-primary-foreground hover:bg-primary/90"
                          )}
                        >
                          {day}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1">
                {dateOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setSelectedDate(option.value)}
                    className={cn(
                      "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium transition-colors",
                      selectedDate === option.value
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="h-9 rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>

              {(selectedProject !== "all" || searchQuery) && (
                <button
                  onClick={() => {
                    setSelectedProject("all");
                    setSearchQuery("");
                  }}
                  className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-3 w-3" />
                  清除
                </button>
              )}
            </div>
          </div>

          <div className="relative w-full overflow-auto">
            <table className="w-full caption-bottom text-sm">
              <thead className="[&_tr]:border-b bg-muted/50">
                <tr className="border-b transition-colors hover:bg-muted/50">
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                    工人
                  </th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                    工种
                  </th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                    项目
                  </th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                    签到时间
                  </th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                    签退时间
                  </th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                    工时
                  </th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                    状态
                  </th>
                </tr>
              </thead>
              <tbody className="[&_tr:last-child]:border-0">
                {filteredCheckins.map((checkin) => (
                  <tr
                    key={checkin.id}
                    className="border-b transition-colors hover:bg-muted/50"
                  >
                    <td className="p-4 align-middle">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted overflow-hidden">
                          {checkin.photoUrl ? (
                            <img
                              src={checkin.photoUrl}
                              alt={checkin.workerName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <User className="h-5 w-5" />
                          )}
                        </div>
                        <div>
                          <span className="font-medium">{checkin.workerName}</span>
                          {checkin.remark && (
                            <p className="text-xs text-muted-foreground">{checkin.remark}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-4 align-middle">{checkin.workType}</td>
                    <td className="p-4 align-middle">
                      <div className="flex items-center gap-1">
                        <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>{checkin.project}</span>
                      </div>
                    </td>
                    <td className="p-4 align-middle text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{checkin.checkinTime}</span>
                      </div>
                    </td>
                    <td className="p-4 align-middle text-muted-foreground">
                      {checkin.checkoutTime || "-"}
                    </td>
                    <td className="p-4 align-middle font-medium">
                      <span className={cn(
                        checkin.duration === "进行中" && "text-amber-600"
                      )}>
                        {checkin.duration}
                      </span>
                    </td>
                    <td className="p-4 align-middle">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                          checkin.status === "工作中"
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                        )}
                      >
                        <span
                          className={cn(
                            "mr-1.5 h-1.5 w-1.5 rounded-full",
                            checkin.status === "工作中" ? "bg-green-500 animate-pulse" : "bg-gray-400"
                          )}
                        />
                        {checkin.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredCheckins.length === 0 && (
            <div className="p-12 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Users className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="mt-4 text-sm font-semibold">没有签到记录</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                尝试调整筛选条件或日期
              </p>
            </div>
          )}
        </div>

        <div className="rounded-lg border bg-card">
          <div className="p-4 border-b">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-muted-foreground" />
              <h2 className="font-semibold">签到位置分布</h2>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              共 {locations.length} 个签到地点
            </p>
          </div>
          <div className="p-4 space-y-4">
            {locations.map((location) => (
              <div
                key={location.name}
                className="rounded-lg border p-4 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium">{location.name}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {location.address}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex -space-x-2">
                        {location.checkins.slice(0, 3).map((name, i) => (
                          <div
                            key={i}
                            className="flex h-6 w-6 items-center justify-center rounded-full bg-muted border-2 border-card text-xs font-medium"
                          >
                            {name.charAt(0)}
                          </div>
                        ))}
                        {location.checkins.length > 3 && (
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted border-2 border-card text-xs font-medium text-muted-foreground">
                            +{location.checkins.length - 3}
                          </div>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {location.workers} 人在岗
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 border-t">
            <div className="rounded-lg bg-muted/50 p-4">
              <h4 className="text-sm font-medium mb-2">位置说明</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                工人签到时会记录GPS位置信息。系统根据地理位置自动匹配到对应的项目工地。
                异常签到（位置偏离过远）会标记为异常并通知管理员。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
