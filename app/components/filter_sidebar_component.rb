class FilterSidebarComponent < ViewComponent::Base
  def initialize(current_user:, context: nil)
    @current_user = current_user
    @context = context
  end

  def approval_nodes
    ApprovalNode.all
  end

  def amount_validation_rules
    [
      { id: 1, name: '单笔金额 > 10万', threshold: 100000, enabled: true },
      { id: 2, name: '差异比例 > 5%', threshold: 5, enabled: true },
      { id: 3, name: '累计金额 > 100万', threshold: 1000000, enabled: false }
    ]
  end

  def frequent_filters
    [
      { id: 1, name: '今日新增', icon: 'calendar', count: 12 },
      { id: 2, name: '待处理', icon: 'clock', count: 8 },
      { id: 3, name: '有差异', icon: 'alert-triangle', count: 5 },
      { id: 4, name: '高优先级', icon: 'flag', count: 3 }
    ]
  end
end
