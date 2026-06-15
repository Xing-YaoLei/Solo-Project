class FollowUpsController < ApplicationController
  before_action :set_follow_up, only: [:show, :edit, :update, :contact, :resolve, :close]

  def index
    scope = FollowUp.includes(enrollment: [:user, :course])

    if params[:status].present?
      scope = scope.where(status: params[:status])
    end

    if params[:overdue].present?
      scope = scope.where("next_follow_up_at < ?", Date.current.beginning_of_day)
    end

    @follow_ups = scope.order(next_follow_up_at: :asc).page(params[:page]).per(20)
  end

  def show
  end

  def edit
  end

  def update
    if @follow_up.update(follow_up_params)
      redirect_to @follow_up, notice: "跟进记录已更新"
    else
      render :edit
    end
  end

  def generate
    FollowUpGenerationJob.perform_later
    redirect_to follow_ups_path, notice: "正在生成跟进名单，请稍后刷新查看"
  end

  def contact
    @follow_up.update(status: :contacted, last_contact_at: Time.current)
    redirect_to @follow_up, notice: "已标记为已联系"
  end

  def resolve
    @follow_up.update(status: :resolved)
    redirect_to @follow_up, notice: "已标记为已解决"
  end

  def close
    @follow_up.update(status: :closed)
    redirect_to follow_ups_path, notice: "跟进已关闭"
  end

  private

  def set_follow_up
    @follow_up = FollowUp.find(params[:id])
  end

  def follow_up_params
    params.require(:follow_up).permit(:reason, :description, :next_follow_up_at, :status)
  end
end
