module Api
  module V1
    class SettlementsController < BaseController
      def show
        @settlement = policy_scope(Settlement).find(params[:id])
        authorize @settlement, :show?

        sensitive_fields = sensitive_fields_for(current_user.role)

        settlement_data = @settlement.as_json(only: sensitive_fields).tap do |data|
          data[:discrepancies] = @settlement.discrepancies.as_json(only: [ :id, :description, :difference_amount, :status, :created_at ])
          data[:settlement_items] = @settlement.settlement_items.as_json(only: [ :id, :delivery_order_id, :amount, :description ])
          data[:approval_records] = @settlement.approval_records.as_json(only: [ :id, :decision, :comments, :created_at ], include: { approver: { only: [ :id, :name ] }, approval_node: { only: [ :id, :name ] } })
        end

        render json: { settlement: settlement_data }
      end
    end
  end
end
