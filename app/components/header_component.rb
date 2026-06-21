class HeaderComponent < ViewComponent::Base
  def initialize(current_user:, title: nil, breadcrumbs: [])
    @current_user = current_user
    @title = title
    @breadcrumbs = breadcrumbs
  end

  def notifications
    [
      { id: 1, type: 'info', message: '新的结算单待处理', time: '5分钟前' },
      { id: 2, type: 'warning', message: '差异处理超时提醒', time: '30分钟前' },
      { id: 3, type: 'success', message: '结算单 #10023 已完成审批', time: '1小时前' }
    ]
  end

  def unread_count
    notifications.count
  end

  def role_label(role)
    {
      'cs' => '客服',
      'merchant' => '商户',
      'rider' => '骑手',
      'city_manager' => '城市经理',
      'admin' => '管理员'
    }[role] || role
  end
end
