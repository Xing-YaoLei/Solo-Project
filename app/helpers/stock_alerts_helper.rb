module StockAlertsHelper
  def stock_alert_status_options
    StockAlert::STATUSES.map do |status|
      [stock_alert_status_name(status), status]
    end
  end

  def stock_alert_status_name(status)
    {
      'pending' => '待处理',
      'processing' => '处理中',
      'resolved' => '已解决'
    }[status] || status
  end

  def stock_alert_status_class(status)
    {
      'pending' => 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'processing' => 'bg-blue-100 text-blue-800 border-blue-200',
      'resolved' => 'bg-green-100 text-green-800 border-green-200'
    }[status] || 'bg-gray-100 text-gray-800 border-gray-200'
  end

  def render_stock_alert_status_badge(status)
    content_tag(:span, class: "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border #{stock_alert_status_class(status)}") do
      stock_alert_status_name(status)
    end
  end

  def stock_alert_tr_class(stock_alert)
    case stock_alert.status
    when 'resolved'
      'bg-green-50'
    when 'pending'
      'bg-yellow-50'
    else
      ''
    end
  end

  def format_stock_alert_created_at(stock_alert)
    stock_alert.created_at.strftime('%Y-%m-%d %H:%M')
  end

  def format_stock_alert_resolved_at(stock_alert)
    return '-' unless stock_alert.resolved_at

    stock_alert.resolved_at.strftime('%Y-%m-%d %H:%M')
  end

  def stock_alert_handler_name(stock_alert)
    stock_alert.handler&.name || '未指派'
  end

  def stock_alert_part_info(stock_alert)
    if stock_alert.part
      "#{stock_alert.part.name} (#{stock_alert.part.sku})"
    else
      '-'
    end
  end

  def stock_alert_work_order_link(stock_alert)
    if stock_alert.work_order
      link_to stock_alert.work_order.work_order_no, work_order_path(stock_alert.work_order), class: 'text-blue-600 hover:text-blue-900'
    else
      '-'
    end
  end
end
