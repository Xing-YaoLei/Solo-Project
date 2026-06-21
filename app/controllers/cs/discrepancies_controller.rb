module Cs
  class DiscrepanciesController < BaseController
    before_action :set_discrepancy, only: [ :show, :update, :resolve, :escalate ]

    def index
      authorize Discrepancy, :index?

      @q = policy_scope(Discrepancy).ransack(params[:q])
      scope = @q.result.includes(:settlement, :supplement_materials, :todo_items).recent
      @pagy, @discrepancies = pagy(scope)

      @pending_count = policy_scope(Discrepancy).pending.count
      @investigating_count = policy_scope(Discrepancy).investigating.count
      @resolved_count = policy_scope(Discrepancy).resolved.count
    end

    def show
      authorize @discrepancy, :show?

      @supplement_materials = @discrepancy.supplement_materials.includes(:uploader).recent
      @todo_items = policy_scope(@discrepancy.todo_items).includes(:assignee, :assigner)
    end

    def update
      authorize @discrepancy, :update?

      if @discrepancy.update(discrepancy_params)
        redirect_to cs_discrepancy_path(@discrepancy), notice: "差异信息已更新。"
      else
        render :show
      end
    end

    def resolve
      authorize @discrepancy, :resolve?

      resolution_type = params[:resolution_type] || 'agreed'
      new_amount = params[:new_amount]&.to_d || @discrepancy.settlement.system_amount
      comment = params[:comment]

      service = DiscrepancyResolutionService.new(@discrepancy, current_user)
      begin
        service.resolve(resolution_type, new_amount, comment)
        redirect_to cs_discrepancy_path(@discrepancy), notice: "差异已解决。"
      rescue StandardError => e
        redirect_to cs_discrepancy_path(@discrepancy), alert: "解决失败: #{e.message}"
      end
    end

    def escalate
      authorize @discrepancy, :escalate?

      service = DiscrepancyResolutionService.new(@discrepancy, current_user)
      begin
        service.escalate(params[:comment])
        redirect_to cs_discrepancy_path(@discrepancy), notice: "差异已升级，已通知经理处理。"
      rescue StandardError => e
        redirect_to cs_discrepancy_path(@discrepancy), alert: "升级失败: #{e.message}"
      end
    end

    private

    def set_discrepancy
      @discrepancy = policy_scope(Discrepancy).find(params[:id])
    end

    def discrepancy_params
      params.require(:discrepancy).permit(policy(Discrepancy).permitted_attributes)
    end
  end
end
