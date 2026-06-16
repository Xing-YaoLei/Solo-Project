module ApplicationHelper
  def status_badge(status)
    case status.to_s
    when "completed"
      tag.span("已完成", class: "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#2DD4A8]/10 text-[#2DD4A8]")
    when "draft"
      tag.span("草稿", class: "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#F59E0B]/10 text-[#F59E0B]")
    when "cancelled"
      tag.span("已取消", class: "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#EF4444]/10 text-[#EF4444]")
    when "active"
      tag.span("启用", class: "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#2DD4A8]/10 text-[#2DD4A8]")
    else
      tag.span(status, class: "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500")
    end
  end
end
