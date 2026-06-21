class SidebarComponent < ViewComponent::Base
  def initialize(current_user:, current_path: nil)
    @current_user = current_user
    @current_path = current_path
  end

  def menu_items
    case @current_user.role
    when 'cs'
      cs_menu_items
    when 'merchant'
      merchant_menu_items
    when 'rider'
      rider_menu_items
    when 'city_manager'
      manager_menu_items
    else
      []
    end
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

  private

  def cs_menu_items
    [
      { name: '结算台', icon: 'layout-dashboard', path: '/cs/dashboard', active: current_path?('/cs/dashboard') },
      { name: '结算单', icon: 'file-text', path: '/cs/settlements', active: current_path?('/cs/settlements') },
      { name: '差异处理', icon: 'alert-triangle', path: '/cs/discrepancies', active: current_path?('/cs/discrepancies') },
      { name: '合同附件', icon: 'paperclip', path: '/cs/contract_attachments', active: current_path?('/cs/contract_attachments') },
      { name: '文档管理', icon: 'folder', path: '/cs/documents', active: current_path?('/cs/documents') },
      { name: '待办事项', icon: 'check-square', path: '/cs/todo_items', active: current_path?('/cs/todo_items') }
    ]
  end

  def merchant_menu_items
    [
      { name: '首页', icon: 'layout-dashboard', path: '/merchants/dashboard', active: current_path?('/merchants/dashboard') },
      { name: '结算单', icon: 'file-text', path: '/merchants/settlements', active: current_path?('/merchants/settlements') }
    ]
  end

  def rider_menu_items
    [
      { name: '首页', icon: 'layout-dashboard', path: '/rider/dashboard', active: current_path?('/rider/dashboard') },
      { name: '配送订单', icon: 'truck', path: '/rider/delivery_orders', active: current_path?('/rider/delivery_orders') }
    ]
  end

  def manager_menu_items
    [
      { name: '首页', icon: 'layout-dashboard', path: '/manager/dashboard', active: current_path?('/manager/dashboard') },
      { name: '审批管理', icon: 'check-circle', path: '/manager/approvals', active: current_path?('/manager/approvals') },
      { name: '数据总览', icon: 'bar-chart-3', path: '/manager/reports/overview', active: current_path?('/manager/reports/overview') },
      { name: '付款周期', icon: 'clock', path: '/manager/reports/payment_cycle', active: current_path?('/manager/reports/payment_cycle') }
    ]
  end

  def current_path?(path)
    @current_path&.start_with?(path)
  end
end
