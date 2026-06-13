class UsersController < ApplicationController
  before_action :require_user
  before_action :require_admin, except: [:show]

  def index
    @users = User.all.order(:name)
  end

  def show
    @user = User.find(params[:id])
    @operated_orders = @user.operated_orders.order(created_at: :desc).limit(50)
  end
end
