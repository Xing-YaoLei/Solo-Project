module ApplicationHelper
  STATUS_COLORS = {
    "pending"    => "bg-yellow-100 text-yellow-800",
    "paid"       => "bg-blue-100 text-blue-800",
    "confirmed"  => "bg-green-100 text-green-800",
    "cancelled"  => "bg-gray-100 text-gray-800",
    "refunded"   => "bg-purple-100 text-purple-800",
    "draft"      => "bg-gray-100 text-gray-800",
    "published"  => "bg-blue-100 text-blue-800",
    "ongoing"    => "bg-green-100 text-green-800",
    "finished"   => "bg-indigo-100 text-indigo-800",
    "reserved"   => "bg-yellow-100 text-yellow-800",
    "issued"     => "bg-blue-100 text-blue-800",
    "checked_in" => "bg-green-100 text-green-800",
    "expired"    => "bg-gray-100 text-gray-800",
    "open"       => "bg-red-100 text-red-800",
    "assigned"   => "bg-yellow-100 text-yellow-800",
    "resolving"  => "bg-blue-100 text-blue-800",
    "closed"     => "bg-gray-100 text-gray-800",
    "active"     => "bg-green-100 text-green-800",
    "inactive"   => "bg-gray-100 text-gray-800",
    "used"       => "bg-indigo-100 text-indigo-800",
    "available"  => "bg-green-100 text-green-800",
    "occupied"   => "bg-red-100 text-red-800",
    "disabled"   => "bg-gray-100 text-gray-800",
    "prospective" => "bg-yellow-100 text-yellow-800",
    "sold_out"   => "bg-red-100 text-red-800",
    "suspended"  => "bg-orange-100 text-orange-800",
    "verified"   => "bg-teal-100 text-teal-800",
    "completed"  => "bg-indigo-100 text-indigo-800",
    "terminated" => "bg-red-100 text-red-800",
  }.freeze

  STATUS_LABELS = {
    "pending"    => "待支付",
    "paid"       => "已支付",
    "confirmed"  => "已确认",
    "cancelled"  => "已取消",
    "refunded"   => "已退款",
    "draft"      => "草稿",
    "published"  => "已发布",
    "ongoing"    => "进行中",
    "finished"   => "已结束",
    "reserved"   => "已预留",
    "issued"     => "已出票",
    "checked_in" => "已签到",
    "expired"    => "已过期",
    "open"       => "待处理",
    "assigned"   => "已指派",
    "resolving"  => "处理中",
    "closed"     => "已关闭",
    "active"     => "有效",
    "inactive"   => "无效",
    "used"       => "已使用",
    "available"  => "可用",
    "occupied"   => "已占用",
    "disabled"   => "停用",
    "prospective" => "潜在客户",
    "sold_out"   => "售罄",
    "suspended"  => "已暂停",
    "verified"   => "已验证",
    "completed"  => "已完成",
    "terminated" => "已终止",
  }.freeze

  def status_badge(model)
    status = model.status
    color_class = STATUS_COLORS[status] || "bg-gray-100 text-gray-800"
    label = STATUS_LABELS[status] || status.humanize
    tag.span(label, class: "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium #{color_class}")
  end

  def format_currency(amount)
    return "¥0.00" if amount.nil?
    "¥#{ActiveSupport::NumberHelper.number_to_currency(amount, unit: '', precision: 2)}"
  end

  def format_datetime(datetime)
    return "-" if datetime.nil?
    l(datetime, format: :short)
  end

  def pagination_links(info)
    return "" if info.nil? || info.total_pages <= 1

    nav = tag.nav(class: "flex items-center gap-1 mt-4", "aria-label": "Pagination") do
      prev_btn = if info.prev_page
        link_to "上一页", request.params.merge(page: info.prev_page), class: "px-3 py-1 text-sm rounded border border-gray-300 hover:bg-gray-50"
      else
        tag.span "上一页", class: "px-3 py-1 text-sm rounded border border-gray-200 text-gray-400"
      end

      page_btns = (1..info.total_pages).map do |p|
        if p == info.page
          tag.span p, class: "px-3 py-1 text-sm rounded bg-indigo-600 text-white"
        else
          link_to p, request.params.merge(page: p), class: "px-3 py-1 text-sm rounded border border-gray-300 hover:bg-gray-50"
        end
      end

      next_btn = if info.next_page
        link_to "下一页", request.params.merge(page: info.next_page), class: "px-3 py-1 text-sm rounded border border-gray-300 hover:bg-gray-50"
      else
        tag.span "下一页", class: "px-3 py-1 text-sm rounded border border-gray-200 text-gray-400"
      end

      safe_join([prev_btn, *page_btns, next_btn])
    end
    nav
  end
end
