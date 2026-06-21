module Merchants
  class SettlementsController < BaseController
    before_action :set_settlement, only: [ :show, :confirm, :raise_dispute ]

    def index
      authorize Settlement, :index?

      @q = policy_scope(Settlement).ransack(params[:q])
      scope = @q.result.includes(:discrepancies, :approval_records).recent
      @pagy, @settlements = pagy(scope)

      @sensitive_fields = sensitive_fields_for(:merchant)
    end

    def show
      authorize @settlement, :show?

      @discrepancies = policy_scope(@settlement.discrepancies)
      @settlement_items = @settlement.settlement_items.includes(:delivery_order)
      @approval_records = policy_scope(@settlement.approval_records).includes(:approver, :approval_node).recent

      @sensitive_fields = sensitive_fields_for(:merchant)
    end

    def confirm
      authorize @settlement, :confirm?

      if @settlement.pending? && @settlement.difference_amount.zero?
        if @settlement.update(status: :approved)
          redirect_to merchants_settlement_path(@settlement), notice: "结算单已确认。"
        else
          redirect_to merchants_settlement_path(@settlement), alert: "确认失败，请重试。"
        end
      else
        redirect_to merchants_settlement_path(@settlement), alert: "只有待处理且无差异的结算单可以确认。"
      end
    end

    def raise_dispute
      authorize @settlement, :raise_dispute?

      @discrepancy = @settlement.discrepancies.new(
        description: params[:description],
        difference_amount: params[:difference_amount],
        status: :pending
      )

      if @discrepancy.save
        TodoItem.create!(
          title: "商户提出异议: 结算单 #{@settlement.period}",
          description: @discrepancy.description,
          assignee: User.cs.first,
          assigner: current_user,
          settlement: @settlement,
          discrepancy: @discrepancy,
          priority: :high,
          status: :pending,
          due_date: 3.days.from_now
        )
        redirect_to merchants_settlement_path(@settlement), notice: "异议已提交，客服将尽快处理。"
      else
        redirect_to merchants_settlement_path(@settlement), alert: "提交失败，请重试。"
      end
    end

    private

    def set_settlement
      @settlement = policy_scope(Settlement).find(params[:id])
    end
  end
end
