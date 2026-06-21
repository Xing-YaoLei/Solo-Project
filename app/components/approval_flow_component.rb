class ApprovalFlowComponent < ViewComponent::Base
  def initialize(approval_records:, approval_nodes:)
    @approval_records = approval_records
    @approval_nodes = approval_nodes
  end

  def node_status(node, index)
    record = @approval_records.find_by(approval_node_id: node.id)
    if record&.approved?
      :approved
    elsif record&.rejected?
      :rejected
    elsif index == next_approval_index
      :current
    else
      :pending
    end
  end

  def next_approval_index
    @approval_records.where(status: :pending).order(:created_at).first&.approval_node&.sequence || 0
  end

  def status_classes(status)
    {
      approved: 'bg-[#10b981] text-white',
      rejected: 'bg-[#ef4444] text-white',
      current: 'bg-[#1e3a5f] text-white animate-pulse',
      pending: 'bg-gray-200 text-gray-500'
    }[status]
  end

  def line_classes(status)
    {
      approved: 'bg-[#10b981]',
      rejected: 'bg-[#ef4444]',
      current: 'bg-gray-200',
      pending: 'bg-gray-200'
    }[status]
  end
end
