class TodoItemComponent < ViewComponent::Base
  def initialize(todo_item:)
    @todo_item = todo_item
  end

  def priority_classes
    {
      low: 'bg-gray-100 text-gray-600',
      medium: 'bg-blue-100 text-blue-600',
      high: 'bg-orange-100 text-orange-600',
      urgent: 'bg-red-100 text-red-600'
    }[@todo_item.priority.to_sym]
  end

  def priority_label
    {
      low: '低',
      medium: '中',
      high: '高',
      urgent: '紧急'
    }[@todo_item.priority.to_sym]
  end

  def status_classes
    {
      pending: 'bg-gray-100 text-gray-600',
      in_progress: 'bg-blue-100 text-blue-600',
      completed: 'bg-green-100 text-green-600',
      cancelled: 'bg-red-100 text-red-600'
    }[@todo_item.status.to_sym]
  end

  def status_label
    {
      pending: '待处理',
      in_progress: '处理中',
      completed: '已完成',
      cancelled: '已取消'
    }[@todo_item.status.to_sym]
  end

  def overdue?
    @todo_item.due_date && @todo_item.due_date < Date.today && !@todo_item.completed?
  end

  def due_soon?
    @todo_item.due_date && @todo_item.due_date.between?(Date.today, 3.days.from_now)
  end
end
