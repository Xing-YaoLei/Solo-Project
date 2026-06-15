module ApplicationHelper
  def status_badge(status)
    case status.to_s
    when "completed", "paid", "active", "approved", "closed", "resolved"
      content_tag(:span, status_text(status), class: "badge-green")
    when "pending", "investigating", "unpaid"
      content_tag(:span, status_text(status), class: "badge-yellow")
    when "rejected", "cancelled", "expired", "inactive", "suspended"
      content_tag(:span, status_text(status), class: "badge-red")
    when "dismissed"
      content_tag(:span, "已撤销", class: "badge-gray")
    else
      content_tag(:span, status_text(status), class: "badge-blue")
    end
  end

  def refund_status_badge(status)
    status_badge(status)
  end

  def payment_status_badge(status)
    case status.to_s
    when "paid" then content_tag(:span, "已付款", class: "badge-green")
    when "unpaid" then content_tag(:span, "未付款", class: "badge-red")
    when "partially_paid" then content_tag(:span, "部分付款", class: "badge-yellow")
    when "refunded" then content_tag(:span, "已退款", class: "badge-gray")
    else status_badge(status)
    end
  end

  def member_level_badge(level)
    case level.to_s
    when "vip" then content_tag(:span, "👑 VIP", class: "badge bg-purple-100 text-purple-800")
    when "premium" then content_tag(:span, "⭐ 高级", class: "badge bg-blue-100 text-blue-800")
    when "basic" then content_tag(:span, "普通", class: "badge bg-gray-100 text-gray-800")
    when "all" then content_tag(:span, "全部", class: "badge bg-green-100 text-green-800")
    else content_tag(:span, level.to_s, class: "badge-gray")
    end
  end

  def status_text(status)
    I18n.t("status.#{status}", default: status.to_s.humanize)
  end

  def action_text(action)
    I18n.t("actions.#{action}", default: action.to_s.humanize)
  end

  def pagination_info(collection)
    if collection.respond_to?(:total_pages) && collection.total_pages > 1
      "第 #{collection.current_page} / #{collection.total_pages} 页 (共 #{collection.total_count} 条)"
    else
      "共 #{collection.respond_to?(:count) ? collection.count : 0} 条"
    end
  end

  def simple_pagination(collection)
    return "" unless collection.respond_to?(:total_pages) && collection.total_pages > 1
    prev_disabled = collection.first_page?
    next_disabled = collection.last_page?

    content_tag(:div, class: "flex items-center justify-between px-4 py-3 bg-gray-50 border-t border-gray-200") do
      concat content_tag(:span, pagination_info(collection), class: "text-sm text-gray-700")
      concat (
        content_tag(:div, class: "flex space-x-2") do
          if collection.current_page > 1
            concat link_to("上一页", url_for(page: collection.prev_page), class: "btn-secondary text-xs py-1 px-3")
          else
            concat content_tag(:span, "上一页", class: "btn-secondary text-xs py-1 px-3 opacity-50 cursor-not-allowed")
          end
          (1..[collection.total_pages, 5].min).each do |page_num|
            concat link_to(page_num.to_s, url_for(page: page_num), class: (page_num == collection.current_page ? "btn-primary text-xs py-1 px-3" : "btn-secondary text-xs py-1 px-3"))
          end
          unless collection.last_page?
            concat link_to("下一页", url_for(page: collection.next_page), class: "btn-secondary text-xs py-1 px-3")
          else
            concat content_tag(:span, "下一页", class: "btn-secondary text-xs py-1 px-3 opacity-50 cursor-not-allowed")
          end
        end
      )
    end
  end
end
