class DiscrepancyComponent < ViewComponent::Base
  def initialize(discrepancy:)
    @discrepancy = discrepancy
  end

  def status_classes
    {
      pending: 'bg-orange-100 text-orange-600 border-orange-200',
      resolved: 'bg-green-100 text-green-600 border-green-200',
      rejected: 'bg-red-100 text-red-600 border-red-200',
      investigating: 'bg-blue-100 text-blue-600 border-blue-200'
    }[@discrepancy.status.to_sym]
  end

  def status_label
    {
      pending: '待处理',
      resolved: '已解决',
      rejected: '已拒绝',
      investigating: '调查中'
    }[@discrepancy.status.to_sym]
  end

  def amount_color
    @discrepancy.difference_amount > 0 ? 'text-red-600' : 'text-green-600'
  end

  def amount_prefix
    @discrepancy.difference_amount > 0 ? '+' : ''
  end
end
