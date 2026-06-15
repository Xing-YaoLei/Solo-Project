class AppealsController < ApplicationController
  before_action :set_appeal, only: [:show, :edit, :update, :process_appeal, :approve, :reject]

  def index
    scope = Appeal.includes(:enrollment, :user, enrollment: [:course])

    if params[:status].present?
      scope = scope.where(status: params[:status])
    end

    if params[:appeal_type].present?
      scope = scope.where(appeal_type: params[:appeal_type])
    end

    @appeals = scope.order(created_at: :desc).page(params[:page]).per(20)
  end

  def show
  end

  def edit
  end

  def update
    if @appeal.update(appeal_params)
      redirect_to @appeal, notice: "申诉已更新"
    else
      render :edit
    end
  end

  def process_appeal
    @appeal.process_appeal!
    redirect_to @appeal, notice: "已开始处理申诉"
  end

  def approve
    handler = User.find_by(role: :admin) || User.first
    @appeal.handle!(handler, params[:handle_result] || "申诉已通过", approved: true)
    redirect_to appeals_path, notice: "申诉已通过"
  end

  def reject
    handler = User.find_by(role: :admin) || User.first
    @appeal.handle!(handler, params[:handle_result] || "申诉已驳回", approved: false)
    redirect_to appeals_path, notice: "申诉已驳回"
  end

  private

  def set_appeal
    @appeal = Appeal.find(params[:id])
  end

  def appeal_params
    params.require(:appeal).permit(:title, :content, :appeal_type, :status, :handle_result)
  end
end
