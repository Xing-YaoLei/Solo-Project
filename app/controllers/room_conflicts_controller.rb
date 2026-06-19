class RoomConflictsController < ApplicationController
  before_action :set_conflict, only: %i[show acknowledge resolve close]

  def index
    @conflicts = RoomConflict.all
    @conflicts = @conflicts.where(status: params[:status]) if params[:status].present?
    @conflicts = @conflicts.order(created_at: :desc)
  end

  def show
    @conflict_actions = @conflict.conflict_actions.order(created_at: :desc)
  end

  def acknowledge
    @conflict.acknowledge!(current_user)
    redirect_to @conflict, notice: "冲突已确认受理"
  rescue ActiveRecord::RecordInvalid => e
    redirect_to @conflict, alert: "受理失败：#{e.message}"
  end

  def resolve
    @conflict.resolve!(current_user, params[:action_note])
    redirect_to @conflict, notice: "冲突已解决"
  rescue ActiveRecord::RecordInvalid => e
    redirect_to @conflict, alert: "解决失败：#{e.message}"
  end

  def close
    @conflict.close!(current_user)
    redirect_to room_conflicts_path, notice: "冲突已关闭"
  rescue ActiveRecord::RecordInvalid => e
    redirect_to @conflict, alert: "关闭失败：#{e.message}"
  end

  private

  def set_conflict
    @conflict = RoomConflict.find(params[:id])
  end
end
