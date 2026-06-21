module Api
  module V1
    class DiscrepanciesController < BaseController
      def update
        @discrepancy = policy_scope(Discrepancy).find(params[:id])
        authorize @discrepancy, :update?

        if @discrepancy.update(discrepancy_params)
          render json: {
            discrepancy: @discrepancy.as_json(only: [ :id, :settlement_id, :description, :difference_amount, :status, :resolution, :created_at, :updated_at ]),
            message: "差异信息已更新。"
          }, status: :ok
        else
          render json: {
            errors: @discrepancy.errors.full_messages,
            message: "更新失败。"
          }, status: :unprocessable_entity
        end
      end

      private

      def discrepancy_params
        params.require(:discrepancy).permit(policy(Discrepancy).permitted_attributes)
      end
    end
  end
end
