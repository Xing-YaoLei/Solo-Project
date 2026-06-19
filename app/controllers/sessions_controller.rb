class SessionsController < ApplicationController
  def new
    @users = User.all.order(:name)
  end

  def create
    user = User.find_by(id: params[:user_id])
    if user
      session[:user_id] = user.id
    end
    redirect_back(fallback_location: root_path)
  end

  def destroy
    session[:user_id] = nil
    redirect_back(fallback_location: root_path)
  end
end
