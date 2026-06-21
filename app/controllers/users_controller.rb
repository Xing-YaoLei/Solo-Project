class UsersController < ApplicationController
  def index
    @q = User.ransack(params[:q])
    @pagy, @users = pagy(@q.result.order(created_at: :desc))
  end

  def show
    @user = User.find(params[:id])
  end
end
