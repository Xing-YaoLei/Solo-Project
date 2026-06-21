module Cs
  class SettlementsController < BaseController
    before_action :set_settlement, only: [ :show, :submit_for_approval, :reject, :resubmit, :reassign, :supplement_material ]

    def index
      authorize Settlement, :index?

      @q = policy_scope(Settlement).ransack(params[:q])
      scope = @q.result.includes(:merchant, :handler, :discrepancies, :approval_records).recent
      @pagy, @settlements = pagy(scope)

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

      service = SettlementRejectionService.new(@settlement, current_user, params[:reason])
      begin
        service.reject
        redirect_to cs_settlement_path(@settlement), notice: "结算单已驳回。"
      rescue StandardError => e
        redirect_to cs_settlement_path(@settlement), alert: "驳回失败: #{e.message}"
      end
    end

    def resubmit
      authorize @settlement, :resubmit?

      service = SettlementRejectionService.new(@settlement, current_user)
      begin
        service.resubmit(params[:updated_amount]&.to_d)
        redirect_to cs_settlement_path(@settlement), notice: "结算单已重新提交。"
      rescue StandardError => e
        redirect_to cs_settlement_path(@settlement), alert: "重新提交失败: #{e.message}"
      end
    end

    def reassign
      authorize @settlement, :reassign?

      new_handler = User.cs.find(params[:new_handler_id])
      service = SettlementReassignmentService.new(@settlement, current_user, new_handler)
      begin
        service.reassign
        redirect_to cs_settlement_path(@settlement), notice: "结算单已重新分配。"
      rescue StandardError => e
        redirect_to cs_settlement_path(@settlement), alert: "重新分配失败: #{e.message}"
      end
    end

    def supplement_material
      authorize @settlement, :supplement_material?

      discrepancy = @settlement.discrepancies.unresolved.first
      unless discrepancy
        redirect_to cs_settlement_path(@settlement), alert: "该结算单没有待处理的差异。"
        return
      end

      service = DiscrepancyResolutionService.new(discrepancy, current_user)
      begin
        service.supplement_material(params[:description], params[:file_url])
        redirect_to cs_settlement_path(@settlement), notice: "补充材料已上传。"
      rescue StandardError => e
        redirect_to cs_settlement_path(@settlement), alert: "上传失败: #{e.message}"
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
