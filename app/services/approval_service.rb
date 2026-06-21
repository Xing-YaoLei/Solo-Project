class ApprovalService
  def initialize(settlement, current_user)
    @settlement = settlement
    @current_user = current_user
  end

  def submit_for_approval
    ActiveRecord::Base.transaction do
      @settlement.update!(status: :processing)

      first_node = find_first_approval_node
      create_approval_record(first_node, :pending)
      create_approval_todo(first_node)

      @settlement
    end
  rescue StandardError => e
    Rails.logger.error "Submit for approval failed for settlement #{@settlement.id}: #{e.message}"
    raise e
  end

  def approve(approval_node, comment = nil)
    ActiveRecord::Base.transaction do
      approval_record = @settlement.approval_records
        .find_by(approval_node:, decision: :pending)
      raise "No pending approval record found" unless approval_record

      approval_record.update!(
        decision: :approved,
        comment:,
        approver: @current_user
      )

      next_node = find_next_approval_node(approval_node)
      if next_node
        create_approval_record(next_node, :pending)
        create_approval_todo(next_node)
      else
        @settlement.update!(status: :approved)
        NotificationWorker.perform_async(@settlement.merchant_id, :settlement_approved)
      end

      @settlement
    end
  rescue StandardError => e
    Rails.logger.error "Approve failed for settlement #{@settlement.id}: #{e.message}"
    raise e
  end

  def reject(approval_node, comment = nil)
    ActiveRecord::Base.transaction do
      approval_record = @settlement.approval_records
        .find_by(approval_node:, decision: :pending)
      raise "No pending approval record found" unless approval_record

      approval_record.update!(
        decision: :rejected,
        comment:,
        approver: @current_user
      )

      @settlement.update!(status: :rejected)
      create_reject_todo(approval_record)
      NotificationWorker.perform_async(@settlement.merchant_id, :settlement_rejected)

      @settlement
    end
  rescue StandardError => e
    Rails.logger.error "Reject failed for settlement #{@settlement.id}: #{e.message}"
    raise e
  end

  def reassign(approval_node, new_approver, comment = nil)
    ActiveRecord::Base.transaction do
      approval_record = @settlement.approval_records
        .find_by(approval_node:, decision: :pending)
      raise "No pending approval record found" unless approval_record

      old_approver = approval_record.approver
      approval_record.update!(
        approver: new_approver,
        comment:
      )

      TodoItem.create!(
        settlement: @settlement,
        assignee: new_approver,
        assigner: @current_user,
        title: "审批被重新分派 - 结算单 #{@settlement.id}",
        description: comment || "原审批人：#{old_approver&.name || '未指定'}，新审批人：#{new_approver.name}",
        priority: :high,
        status: :pending,
        due_date: 2.business_days.from_now
      )

      @settlement
    end
  rescue StandardError => e
    Rails.logger.error "Reassign failed for settlement #{@settlement.id}: #{e.message}"
    raise e
  end

  private

  def find_first_approval_node
    ApprovalNode.active.root_nodes.by_threshold(@settlement.system_amount).by_order.first
  end

  def find_next_approval_node(current_node)
    current_node.children.active.by_threshold(@settlement.system_amount).by_order.first
  end

  def create_approval_record(node, decision)
    approver = find_approver_for_node(node)
    @settlement.approval_records.create!(
      approval_node: node,
      approver:,
      decision:
    )
  end

  def find_approver_for_node(node)
    users = User.by_role(node.approver_role)
    users.first
  end

  def create_approval_todo(node)
    approver = find_approver_for_node(node)
    TodoItem.create!(
      settlement: @settlement,
      assignee: approver,
      title: "待审批 - 结算单 #{@settlement.id}",
      description: "#{@settlement.merchant.name} #{@settlement.period} 结算单待审批，金额：#{sprintf("%.2f", @settlement.system_amount)}元",
      priority: :high,
      status: :pending,
      due_date: 3.business_days.from_now
    )
  end

  def create_reject_todo(approval_record)
    handler = @settlement.handler || User.by_role(:cs).first
    TodoItem.create!(
      settlement: @settlement,
      assignee: handler,
      assigner: approval_record.approver,
      title: "审批被驳回 - 结算单 #{@settlement.id}",
      description: "驳回原因：#{approval_record.comment || '未填写'}",
      priority: :urgent,
      status: :pending,
      due_date: 1.business_day.from_now
    )
  end
end
