class AuditLogComponent < ViewComponent::Base
  def initialize(audit_logs:, limit: 10)
    @audit_logs = audit_logs.limit(limit)
  end

  def action_classes(action)
    {
      'create' => 'bg-green-100 text-green-600',
      'update' => 'bg-blue-100 text-blue-600',
      'delete' => 'bg-red-100 text-red-600',
      'approve' => 'bg-emerald-100 text-emerald-600',
      'reject' => 'bg-red-100 text-red-600'
    }[action] || 'bg-gray-100 text-gray-600'
  end

  def action_label(action)
    {
      'create' => '创建',
      'update' => '更新',
      'delete' => '删除',
      'approve' => '审批通过',
      'reject' => '审批拒绝'
    }[action] || action
  end

  def action_icon(action)
    {
      'create' => 'plus-circle',
      'update' => 'edit-2',
      'delete' => 'trash-2',
      'approve' => 'check-circle',
      'reject' => 'x-circle'
    }[action] || 'activity'
  end
end
