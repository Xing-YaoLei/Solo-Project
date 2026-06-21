module ApplicationHelper
  def role_label(role)
    labels = {
      'merchant' => { text: '商户', class: 'bg-[#10b981]/10 text-[#10b981]' },
      'rider' => { text: '骑手', class: 'bg-[#f59e0b]/10 text-[#f59e0b]' },
      'cs' => { text: '客服', class: 'bg-[#1e3a5f]/10 text-[#1e3a5f]' },
      'city_manager' => { text: '经理', class: 'bg-[#8b5cf6]/10 text-[#8b5cf6]' }
    }
    labels[role.to_s] || { text: role.to_s, class: 'bg-gray-100 text-gray-600' }
  end

  def status_label(status)
    labels = {
      'pending' => { text: '待处理', class: 'bg-[#f59e0b]/10 text-[#f59e0b]' },
      'approved' => { text: '已通过', class: 'bg-[#10b981]/10 text-[#10b981]' },
      'rejected' => { text: '已拒绝', class: 'bg-[#ef4444]/10 text-[#ef4444]' },
      'processing' => { text: '处理中', class: 'bg-[#1e3a5f]/10 text-[#1e3a5f]' },
      'completed' => { text: '已完成', class: 'bg-[#10b981]/10 text-[#10b981]' },
      'cancelled' => { text: '已取消', class: 'bg-gray-100 text-gray-500' }
    }
    labels[status.to_s] || { text: status.to_s, class: 'bg-gray-100 text-gray-600' }
  end

  def priority_label(priority)
    labels = {
      'urgent' => { text: '紧急', class: 'bg-[#ef4444]/10 text-[#ef4444]' },
      'high' => { text: '高', class: 'bg-[#f59e0b]/10 text-[#f59e0b]' },
      'medium' => { text: '中', class: 'bg-[#1e3a5f]/10 text-[#1e3a5f]' },
      'low' => { text: '低', class: 'bg-gray-100 text-gray-500' }
    }
    labels[priority.to_s] || { text: priority.to_s, class: 'bg-gray-100 text-gray-600' }
  end

  def format_amount(amount, currency: 'CNY')
    number_to_currency(amount, unit: '¥', precision: 2, delimiter: ',')
  end

  def format_date(date)
    return '-' unless date
    date.strftime('%Y年%m月%d日')
  end

  def format_datetime(datetime)
    return '-' unless datetime
    datetime.strftime('%Y年%m月%d日 %H:%M')
  end

  def format_percentage(value)
    number_to_percentage(value, precision: 1)
  end

  def page_title(title = nil)
    if title
      content_for(:page_title, title)
      content_for(:title, "#{title} - 结算管理系统")
    else
      content_for(:page_title)
    end
  end

  def active_nav_class(path)
    request.path.start_with?(path) ? 'bg-[#1e3a5f]/10 text-[#1e3a5f]' : 'text-gray-600 hover:bg-gray-50'
  end
end
