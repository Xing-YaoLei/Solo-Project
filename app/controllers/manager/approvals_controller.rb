module Manager
  class ApprovalsController < BaseController
    before_action :set_approval_record, only: [ :show, :approve, :reject ]

    def index
      authorize ApprovalRecord, :index?

      @q = policy_scope(ApprovalRecord).ransack(params[:q])
      @approval_records = @q.result.includes(:settlement, :approver, :approval_node)
                            .recent.page(params[:page])

      @pending_count = policy_scope(ApprovalRecord).pending.count
      @approved_count = policy_scope(ApprovalRecord).approved.count
      @rejected_count = policy_scope(ApprovalRecord).rejected.count
    end

    def show
      authorize @approval_record, :show?

      @settlement = @approval_record.settlement
      @approval_records = policy_scope(@settlement.approval_records).includes(:approver, :approval_node).recent
    end

    def approve
      authorize @approval_record, :approve?

      ApprovalRecord.transaction do
        if @approval_record.update(decision: :approved, comments: params[:comments])
          settlement = @approval_record.settlement
          next_node = ApprovalNode.active.by_order
                                 .where('"order" > ?', @approval_record.approval_node.order)
                                 .by_threshold(settlement.difference_amount.abs)
                                 .first

          if next_node
            ApprovalRecord.create!(
              settlement: settlement,
              approval_node: next_node,
              approver: User.by_role(next_node.approver_role).first,
              decision: :pending
            )
            redirect_to manager_approval_path(@approval_record), notice: "已批准，已提交下一节点审批。"
          else
            settlement.update!(status: :approved)
            redirect_to manager_approval_path(@approval_record), notice: "已批准，结算单已通过所有审批。"
          end
        else
          redirect_to manager_approval_path(@approval_record), alert: "批准失败，请重试。"
        end
      end
    rescue ActiveRecord::RecordInvalid
      redirect_to manager_approval_path(@approval_record), alert: "批准失败，请重试。"
    end

    def reject
      authorize @approval_record, :reject?

      if @approval_record.update(decision: :rejected, comments: params[:comments])
        @approval_record.settlement.update(status: :rejected)
        redirect_to manager_approval_path(@approval_record), notice: "已驳回，结算单已拒绝。"
      else
        redirect_to manager_approval_path(@approval_record), alert: "驳回失败，请重试。"
      end
    end

    private

    def set_approval_record
      @approval_record = policy_scope(ApprovalRecord).find(params[:id])
    end
  end
end
