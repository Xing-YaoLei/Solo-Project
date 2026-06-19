module ApplicationHelper
  def render_work_order_status_badge(status)
    status_classes = {
      'pending' => 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'quoted' => 'bg-blue-100 text-blue-800 border-blue-200',
      'in_progress' => 'bg-purple-100 text-purple-800 border-purple-200',
      'completed' => 'bg-green-100 text-green-800 border-green-200',
      'cancelled' => 'bg-gray-100 text-gray-800 border-gray-200'
    }
    status_names = {
      'pending' => '待处理',
      'quoted' => '已报价',
      'in_progress' => '处理中',
      'completed' => '已完成',
      'cancelled' => '已取消'
    }
    content_tag(:span, class: "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border #{status_classes[status] || 'bg-gray-100 text-gray-800'}") do
      status_names[status] || status
    end
  end

  def render_work_order_priority_badge(priority)
    priority_classes = {
      'low' => 'bg-gray-100 text-gray-800 border-gray-200',
      'normal' => 'bg-blue-100 text-blue-800 border-blue-200',
      'high' => 'bg-orange-100 text-orange-800 border-orange-200',
      'urgent' => 'bg-red-100 text-red-800 border-red-200'
    }
    priority_names = {
      'low' => '低',
      'normal' => '普通',
      'high' => '高',
      'urgent' => '紧急'
    }
    content_tag(:span, class: "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border #{priority_classes[priority] || 'bg-gray-100 text-gray-800'}") do
      priority_names[priority] || priority
    end
  end

  def render_work_order_item_status_badge(status)
    status_classes = {
      'pending' => 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'in_progress' => 'bg-purple-100 text-purple-800 border-purple-200',
      'completed' => 'bg-green-100 text-green-800 border-green-200'
    }
    status_names = {
      'pending' => '待处理',
      'in_progress' => '进行中',
      'completed' => '已完成'
    }
    content_tag(:span, class: "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border #{status_classes[status] || 'bg-gray-100 text-gray-800'}") do
      status_names[status] || status
    end
  end

  def format_money(amount)
    number_to_currency(amount, unit: '¥', precision: 2)
  end
end
