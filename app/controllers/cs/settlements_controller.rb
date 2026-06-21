module Cs
  class SettlementsController < BaseController
    before_action :set_settlement, only: [ :show, :submit_for_approval, :reject, :reassign, :supplement_material ]

    def index
      authorize Settlement, :index?

      @q = policy_scope(Settlement).ransack(params[:q])
      @settlements = @q.result.includes(:merchant, :handler, :discrepancies, :approval_records)
                       .recent.page(params[:page])

      @sensitive_fields = sensitive_fields_for(:cs)
    end

    def show
      authorize @settlement, :show?

      @discrepancies = policy_scope(@settlement.discrepancies)
      @settlement_items = @settlement.settlement_items.includes(:delivery_order)
      @approval_records = policy_scope(@settlement.approval_records).includes(:approver, :approval_node).recent
      @todo_items = policy_scope(@settlement.todo_items).includes(:assignee, :assigner)

      @sensitive_fields = sensitive_fields_for(:cs)
    end

    def submit_for_approval
      authorize @settlement, :submit_for_approval?

      if @settlement.update(status: :processing, handler: current_user)
        create_approval_records_for(@settlement)
        redirect_to cs_settlement_path(@settlement), notice: "结算单已提交审批。"
      else
        redirect_to cs_settlement_path(@settlement), alert: "提交失败，请重试。"
      end
    end

    def reject
      authorize @settlement, :reject?

      if @settlement.update(status: :rejected, handler: current_user)
        redirect_to cs_settlement_path(@settlement), notice: "结算单已驳回。"
      else
        redirect_to cs_settlement_path(@settlement), alert: "驳回失败，请重试。"
      end
    end

    def reassign
      authorize @settlement, :reassign?

      new_handler = User.cs.find(params[:new_handler_id])
      if @settlement.update(handler: new_handler)
        TodoItem.create!(
          title: "结算单 #{@settlement.period} 已重新分配给您",
          description: @settlement.remarks,
          assignee: new_handler,
          assigner: current_user,
          settlement: @settlement,
          priority: :high,
          status: :pending,
          due_date: 3.days.from_now
        )
        redirect_to cs_settlement_path(@settlement), notice: "结算单已重新分配。"
      else
        redirect_to cs_settlement_path(@settlement), alert: "重新分配失败，请重试。"
      end
    end

    def supplement_material
      authorize @settlement, :supplement_material?

      @supplement_material = @settlement.supplement_materials.new(
        uploader: current_user,
        description: params[:description],
        file: params[:file]
      )

      if @supplement_material.save
        redirect_to cs_settlement_path(@settlement), notice: "补充材料已上传。"
      else
        redirect_to cs_settlement_path(@settlement), alert: "上传失败，请重试。"
      end
    end

    private

    def set_settlement
      @settlement = policy_scope(Settlement).find(params[:id])
    end

    def create_approval_records_for(settlement)
      nodes = ApprovalNode.active.by_order.by_threshold(settlement.difference_amount.abs)
      nodes.each do |node|
        ApprovalRecord.create!(
          settlement: settlement,
          approval_node: node,
          approver: User.by_role(node.approver_role).first,
          decision: :pending
        )
      end
    end
  end
end
