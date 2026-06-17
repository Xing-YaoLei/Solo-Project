"use client";

import { useState } from "react";
import {
  Upload,
  Search,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
  User,
  Clock,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { AcceptanceStatus } from "@/types";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { cn } from "@/lib/utils";

const mockPhotos = [
  {
    id: "1",
    photoUrl: "https://picsum.photos/800/600?random=1",
    thumbnailUrl: "https://picsum.photos/400/300?random=1",
    changeOrderNo: "CO-2024-001",
    changeOrderTitle: "水电改造方案调整",
    project: "阳光花园 3 栋 201",
    phase: "水电改造",
    uploader: "李工长",
    uploadTime: "2024-01-15 10:30",
    status: AcceptanceStatus.PASSED,
    description: "水电布线完成照片，线管排布整齐，符合规范要求",
    reviewRemark: "验收通过，施工质量良好",
    reviewer: "张监理",
    reviewTime: "2024-01-15 14:00",
  },
  {
    id: "2",
    photoUrl: "https://picsum.photos/800/600?random=2",
    thumbnailUrl: "https://picsum.photos/400/300?random=2",
    changeOrderNo: "CO-2024-001",
    changeOrderTitle: "水电改造方案调整",
    project: "阳光花园 3 栋 201",
    phase: "防水工程",
    uploader: "李工长",
    uploadTime: "2024-01-16 14:00",
    status: AcceptanceStatus.PENDING,
    description: "卫生间防水施工照片，已做两遍防水",
    reviewRemark: null,
    reviewer: null,
    reviewTime: null,
  },
  {
    id: "3",
    photoUrl: "https://picsum.photos/800/600?random=3",
    thumbnailUrl: "https://picsum.photos/400/300?random=3",
    changeOrderNo: "CO-2024-002",
    changeOrderTitle: "厨房布局优化",
    project: "阳光花园 5 栋 101",
    phase: "瓦工铺贴",
    uploader: "王工长",
    uploadTime: "2024-01-14 09:00",
    status: AcceptanceStatus.FAILED,
    description: "厨房瓷砖铺贴，墙面砖平整度待检查",
    reviewRemark: "瓷砖缝隙不均匀，需要返工处理",
    reviewer: "张监理",
    reviewTime: "2024-01-14 15:30",
  },
  {
    id: "4",
    photoUrl: "https://picsum.photos/800/600?random=4",
    thumbnailUrl: "https://picsum.photos/400/300?random=4",
    changeOrderNo: "CO-2024-003",
    changeOrderTitle: "客厅吊顶造型变更",
    project: "中央公园 1 栋 502",
    phase: "木工吊顶",
    uploader: "张工长",
    uploadTime: "2024-01-13 15:30",
    status: AcceptanceStatus.PASSED,
    description: "客厅吊顶龙骨安装，龙骨间距符合要求",
    reviewRemark: "龙骨安装牢固，间距规范，通过验收",
    reviewer: "李监理",
    reviewTime: "2024-01-13 17:00",
  },
  {
    id: "5",
    photoUrl: "https://picsum.photos/800/600?random=5",
    thumbnailUrl: "https://picsum.photos/400/300?random=5",
    changeOrderNo: "CO-2024-002",
    changeOrderTitle: "厨房布局优化",
    project: "阳光花园 5 栋 101",
    phase: "瓦工铺贴",
    uploader: "王工长",
    uploadTime: "2024-01-17 11:00",
    status: AcceptanceStatus.RE_INSPECTED,
    description: "厨房瓷砖复检，已按要求返工",
    reviewRemark: null,
    reviewer: null,
    reviewTime: null,
  },
  {
    id: "6",
    photoUrl: "https://picsum.photos/800/600?random=6",
    thumbnailUrl: "https://picsum.photos/400/300?random=6",
    changeOrderNo: "CO-2024-004",
    changeOrderTitle: "墙面配色变更",
    project: "中央公园 2 栋 303",
    phase: "油漆工程",
    uploader: "李工长",
    uploadTime: "2024-01-12 16:00",
    status: AcceptanceStatus.PENDING,
    description: "墙面腻子施工，第一遍腻子已完成",
    reviewRemark: null,
    reviewer: null,
    reviewTime: null,
  },
  {
    id: "7",
    photoUrl: "https://picsum.photos/800/600?random=7",
    thumbnailUrl: "https://picsum.photos/400/300?random=7",
    changeOrderNo: "CO-2024-001",
    changeOrderTitle: "水电改造方案调整",
    project: "阳光花园 3 栋 201",
    phase: "水电改造",
    uploader: "李工长",
    uploadTime: "2024-01-15 11:00",
    status: AcceptanceStatus.PASSED,
    description: "开关插座点位确认照片",
    reviewRemark: "点位正确，符合设计要求",
    reviewer: "张监理",
    reviewTime: "2024-01-15 14:30",
  },
  {
    id: "8",
    photoUrl: "https://picsum.photos/800/600?random=8",
    thumbnailUrl: "https://picsum.photos/400/300?random=8",
    changeOrderNo: "CO-2024-003",
    changeOrderTitle: "客厅吊顶造型变更",
    project: "中央公园 1 栋 502",
    phase: "木工吊顶",
    uploader: "张工长",
    uploadTime: "2024-01-14 10:00",
    status: AcceptanceStatus.PASSED,
    description: "石膏板封板完成照片",
    reviewRemark: "封板平整，螺丝间距规范",
    reviewer: "李监理",
    reviewTime: "2024-01-14 16:00",
  },
];

const projects = [
  { id: "all", name: "全部项目" },
  { id: "1", name: "阳光花园 3 栋 201" },
  { id: "2", name: "阳光花园 5 栋 101" },
  { id: "3", name: "中央公园 1 栋 502" },
  { id: "4", name: "中央公园 2 栋 303" },
];

const changeOrders = [
  { id: "all", name: "全部变更单" },
  { id: "CO-2024-001", name: "CO-2024-001 水电改造方案调整" },
  { id: "CO-2024-002", name: "CO-2024-002 厨房布局优化" },
  { id: "CO-2024-003", name: "CO-2024-003 客厅吊顶造型变更" },
  { id: "CO-2024-004", name: "CO-2024-004 墙面配色变更" },
];

const statusFilters = [
  { value: "all", label: "全部状态" },
  { value: AcceptanceStatus.PENDING, label: "待审核" },
  { value: AcceptanceStatus.PASSED, label: "已通过" },
  { value: AcceptanceStatus.FAILED, label: "未通过" },
  { value: AcceptanceStatus.RE_INSPECTED, label: "待复检" },
];

export default function AcceptancePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProject, setSelectedProject] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedChangeOrder, setSelectedChangeOrder] = useState("all");
  const [selectedPhoto, setSelectedPhoto] = useState<typeof mockPhotos[0] | null>(null);

  const filteredPhotos = mockPhotos.filter((photo) => {
    const matchesSearch =
      photo.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      photo.phase.toLowerCase().includes(searchQuery.toLowerCase()) ||
      photo.changeOrderNo.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesProject =
      selectedProject === "all" || photo.project === projects.find((p) => p.id === selectedProject)?.name;
    const matchesStatus = selectedStatus === "all" || photo.status === selectedStatus;
    const matchesChangeOrder =
      selectedChangeOrder === "all" || photo.changeOrderNo === selectedChangeOrder;
    return matchesSearch && matchesProject && matchesStatus && matchesChangeOrder;
  });

  const stats = [
    { label: "全部照片", value: mockPhotos.length, status: "all" },
    { label: "待审核", value: mockPhotos.filter((p) => p.status === AcceptanceStatus.PENDING).length, status: AcceptanceStatus.PENDING },
    { label: "已通过", value: mockPhotos.filter((p) => p.status === AcceptanceStatus.PASSED).length, status: AcceptanceStatus.PASSED },
    { label: "未通过", value: mockPhotos.filter((p) => p.status === AcceptanceStatus.FAILED).length, status: AcceptanceStatus.FAILED },
    { label: "待复检", value: mockPhotos.filter((p) => p.status === AcceptanceStatus.RE_INSPECTED).length, status: AcceptanceStatus.RE_INSPECTED },
  ];

  const currentIndex = selectedPhoto
    ? filteredPhotos.findIndex((p) => p.id === selectedPhoto.id)
    : -1;

  const handlePrev = () => {
    if (currentIndex > 0) {
      setSelectedPhoto(filteredPhotos[currentIndex - 1]);
    }
  };

  const handleNext = () => {
    if (currentIndex < filteredPhotos.length - 1) {
      setSelectedPhoto(filteredPhotos[currentIndex + 1]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">验收照片</h1>
          <p className="text-muted-foreground mt-1">管理和审核工程验收照片</p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
          <Upload className="h-4 w-4" />
          上传照片
        </button>
      </div>

      <div className="grid gap-4 grid-cols-2 md:grid-cols-5">
        {stats.map((stat) => (
          <button
            key={stat.status}
            onClick={() => setSelectedStatus(stat.status)}
            className={cn(
              "rounded-lg border p-4 text-left transition-all hover:shadow-md",
              selectedStatus === stat.status
                ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                : "bg-card hover:border-primary/50"
            )}
          >
            <p className="text-sm text-muted-foreground">{stat.label}</p>
            <p className="text-2xl font-bold mt-1">{stat.value}</p>
          </button>
        ))}
      </div>

      <div className="rounded-lg border bg-card">
        <div className="p-4 border-b space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                placeholder="搜索照片描述、阶段、变更单号..."
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

            <select
              value={selectedChangeOrder}
              onChange={(e) => setSelectedChangeOrder(e.target.value)}
              className="h-9 rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {changeOrders.map((co) => (
                <option key={co.id} value={co.id}>
                  {co.name}
                </option>
              ))}
            </select>

            <div className="flex items-center gap-1">
              {statusFilters.map((filter) => (
                <button
                  key={filter.value}
                  onClick={() => setSelectedStatus(filter.value)}
                  className={cn(
                    "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium transition-colors",
                    selectedStatus === filter.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            {(selectedProject !== "all" ||
              selectedStatus !== "all" ||
              selectedChangeOrder !== "all" ||
              searchQuery) && (
              <button
                onClick={() => {
                  setSelectedProject("all");
                  setSelectedStatus("all");
                  setSelectedChangeOrder("all");
                  setSearchQuery("");
                }}
                className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-3 w-3" />
                清除筛选
              </button>
            )}
          </div>
        </div>

        <div className="p-4 grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {filteredPhotos.map((photo) => (
            <div
              key={photo.id}
              onClick={() => setSelectedPhoto(photo)}
              className="group rounded-lg border overflow-hidden hover:shadow-md transition-all cursor-pointer hover:-translate-y-0.5"
            >
              <div className="aspect-[4/3] relative bg-muted overflow-hidden">
                <img
                  src={photo.thumbnailUrl || photo.photoUrl}
                  alt={photo.description}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                />
                <div className="absolute top-2 right-2">
                  <StatusBadge status={photo.status} type="acceptance" />
                </div>
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <span className="bg-white/90 text-foreground px-3 py-1.5 rounded-lg text-sm font-medium">
                    查看详情
                  </span>
                </div>
              </div>
              <div className="p-3">
                <p className="font-medium text-sm line-clamp-1">{photo.description}</p>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                  {photo.project}
                </p>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <FileText className="h-3 w-3" />
                    <span className="truncate">{photo.changeOrderNo}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{photo.uploadTime.split(" ")[0]}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredPhotos.length === 0 && (
          <div className="p-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Search className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-sm font-semibold">没有找到照片</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              尝试调整筛选条件或搜索关键词
            </p>
          </div>
        )}
      </div>

      {selectedPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="relative flex w-full max-w-5xl max-h-[90vh] overflow-hidden rounded-lg bg-card">
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute right-4 top-4 z-10 rounded-full bg-black/50 p-2 text-white hover:bg-black/70 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex-1 flex items-center justify-center bg-black/50 relative">
              <img
                src={selectedPhoto.photoUrl}
                alt={selectedPhoto.description}
                className="max-h-[90vh] max-w-full object-contain"
              />

              {currentIndex > 0 && (
                <button
                  onClick={handlePrev}
                  className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white hover:bg-black/70 transition-colors"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
              )}
              {currentIndex < filteredPhotos.length - 1 && (
                <button
                  onClick={handleNext}
                  className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white hover:bg-black/70 transition-colors"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              )}

              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-sm text-white">
                {currentIndex + 1} / {filteredPhotos.length}
              </div>
            </div>

            <div className="w-80 flex flex-col border-l">
              <div className="p-4 border-b">
                <StatusBadge status={selectedPhoto.status} type="acceptance" />
                <h3 className="mt-3 font-semibold">{selectedPhoto.description}</h3>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">基本信息</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">项目</span>
                      <span className="font-medium">{selectedPhoto.project}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">阶段</span>
                      <span className="font-medium">{selectedPhoto.phase}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">变更单</span>
                      <span className="font-medium font-mono">{selectedPhoto.changeOrderNo}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">上传人</span>
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        <span>{selectedPhoto.uploader}</span>
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">上传时间</span>
                      <span>{selectedPhoto.uploadTime}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">审核详情</h4>
                  {selectedPhoto.reviewer ? (
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">审核人</span>
                        <span className="font-medium">{selectedPhoto.reviewer}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">审核时间</span>
                        <span>{selectedPhoto.reviewTime}</span>
                      </div>
                      <div className="mt-2 p-3 rounded-lg bg-muted">
                        <p className="text-xs text-muted-foreground mb-1">审核意见</p>
                        <p className="text-sm">{selectedPhoto.reviewRemark}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-lg bg-muted/50 text-center">
                      <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">暂无审核记录</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-4 border-t space-y-2">
                {selectedPhoto.status === AcceptanceStatus.PENDING && (
                  <div className="grid grid-cols-2 gap-2">
                    <button className="inline-flex items-center justify-center gap-2 rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700 transition-colors">
                      <CheckCircle className="h-4 w-4" />
                      通过
                    </button>
                    <button className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors">
                      <XCircle className="h-4 w-4" />
                      驳回
                    </button>
                  </div>
                )}
                {selectedPhoto.status === AcceptanceStatus.FAILED && (
                  <button className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
                    <AlertCircle className="h-4 w-4" />
                    申请复检
                  </button>
                )}
                {selectedPhoto.status === AcceptanceStatus.RE_INSPECTED && (
                  <div className="grid grid-cols-2 gap-2">
                    <button className="inline-flex items-center justify-center gap-2 rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700 transition-colors">
                      <CheckCircle className="h-4 w-4" />
                      通过
                    </button>
                    <button className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors">
                      <XCircle className="h-4 w-4" />
                      驳回
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
