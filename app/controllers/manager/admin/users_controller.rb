module Manager
  module Admin
    class UsersController < BaseController
      before_action :set_user, only: [ :show, :edit, :update ]

      def index
        authorize User, :index?

        @q = User.ransack(params[:q])
        @users = @q.result.includes(:merchant)
                   .order(role: :asc, created_at: :desc)
                   .page(params[:page])
      end

      def show
        authorize @user, :show?
        @recent_activities = @user.approval_records.includes(:settlement).recent.limit(10)
      end

      def new
        @user = User.new
        authorize @user, :new?
      end

      def create
        @user = User.new(user_params)
        authorize @user, :create?

        @user.password = Devise.friendly_token[0, 20] unless user_params[:password].present?

        if @user.save
          redirect_to manager_admin_users_path, notice: "用户已创建。"
        else
          render :new
        end
      end

      def edit
        authorize @user, :edit?
      end

      def update
        authorize @user, :update?

        if user_params[:password].blank?
          filtered_params = user_params.except(:password, :password_confirmation)
        else
          filtered_params = user_params
        end

        if @user.update(filtered_params)
          redirect_to manager_admin_users_path, notice: "用户已更新。"
        else
          render :edit
        end
      end

      private

      def set_user
        @user = User.find(params[:id])
      end

      def user_params
        params.require(:user).permit(:name, :email, :phone, :role, :city_id, :merchant_id, :password, :password_confirmation)
      end
    end
  end
end
