module WorkOrdersHelper
  def work_order_status_options
    WorkOrder::STATUSES.map do |status|
      [t("work_orders.statuses.#{status}", default: status.humanize), status]
    end
  end

  def work_order_priority_options
    WorkOrder::PRIORITIES.map do |priority|
      [t("work_orders.priorities.#{priority}", default: priority.humanize), priority]
    end
  end

  def format_work_order_created_at(work_order)
    work_order.created_at.strftime('%Y-%m-%d %H:%M')
  end

  def format_work_order_completed_at(work_order)
    return '-' unless work_order.completed_at

    work_order.completed_at.strftime('%Y-%m-%d %H:%M')
  end

  def work_order_tr_class(work_order)
    case work_order.status
    when 'completed'
      'bg-green-50'
    when 'cancelled'
      'bg-gray-50'
    when 'urgent'
      'bg-red-50'
    else
      ''
    end
  end

  def work_order_items_count(work_order)
    work_order.work_order_items.count
  end

  def work_order_parts_count(work_order)
    work_order.work_order_parts.count
  end

  def work_order_total_amount(work_order)
    format_money(work_order.total_amount || 0)
  end

  def work_order_assigned_to_name(work_order)
    work_order.assigned_to&.name || '未分配'
  end

  def work_order_vehicle_info(work_order)
    parts = [work_order.vehicle_brand, work_order.vehicle_model].compact
    parts.any? ? parts.join(' ') : '-'
  end
end
