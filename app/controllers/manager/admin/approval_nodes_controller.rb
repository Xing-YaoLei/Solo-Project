module Manager
  module Admin
    class ApprovalNodesController < BaseController
      before_action :set_approval_node, only: [ :show, :edit, :update, :destroy ]

      def index
        authorize ApprovalNode, :index?

        @q = policy_scope(ApprovalNode).ransack(params[:q])
        @approval_nodes = @q.result.includes(:parent, :children, :approval_records)
                            .by_order.page(params[:page])
      end

      def show
        authorize @approval_node, :show?
        @approval_records = policy_scope(@approval_node.approval_records).includes(:settlement, :approver).recent.limit(20)
      end

      def new
        @approval_node = ApprovalNode.new
        authorize @approval_node, :new?

        @parent_nodes = policy_scope(ApprovalNode).root_nodes
      end

      def create
        @approval_node = ApprovalNode.new(approval_node_params)
        authorize @approval_node, :create?

        if @approval_node.save
          redirect_to manager_admin_approval_nodes_path, notice: "审批节点已创建。"
        else
          @parent_nodes = policy_scope(ApprovalNode).root_nodes
          render :new
        end
      end

      def edit
        authorize @approval_node, :edit?
        @parent_nodes = policy_scope(ApprovalNode).root_nodes.where.not(id: @approval_node.id)
      end

      def update
        authorize @approval_node, :update?

        if @approval_node.update(approval_node_params)
          redirect_to manager_admin_approval_nodes_path, notice: "审批节点已更新。"
        else
          @parent_nodes = policy_scope(ApprovalNode).root_nodes.where.not(id: @approval_node.id)
          render :edit
        end
      end

      def destroy
        authorize @approval_node, :destroy?

        if @approval_node.children.exists?
          redirect_to manager_admin_approval_nodes_path, alert: "该节点存在子节点，无法删除。"
        elsif @approval_node.approval_records.exists?
          redirect_to manager_admin_approval_nodes_path, alert: "该节点存在审批记录，无法删除。"
        else
          @approval_node.destroy
          redirect_to manager_admin_approval_nodes_path, notice: "审批节点已删除。"
        end
      end

      private

      def set_approval_node
        @approval_node = policy_scope(ApprovalNode).find(params[:id])
      end

      def approval_node_params
        params.require(:approval_node).permit(policy(ApprovalNode).permitted_attributes)
      end
    end
  end
end
