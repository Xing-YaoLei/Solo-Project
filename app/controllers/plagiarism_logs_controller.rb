class PlagiarismLogsController < ApplicationController
  before_action :set_log, only: [:show, :resolve, :close]

  def index
    @logs = PlagiarismLog.all
    @logs = @logs.by_status(params[:status])
    @logs = @logs.by_student(params[:student_id])
    @logs = @logs.by_responsible(params[:responsible_user_id])
    if params[:min_similarity].present?
      @logs = @logs.where("similarity_score >= ?", params[:min_similarity].to_f)
    end
    if params[:start_date].present? && params[:end_date].present?
      @logs = @logs.where(created_at: params[:start_date]..params[:end_date])
    end
    @logs = @logs.includes(:student, :assignment, :assignment_submission, :responsible_user, :handler, :source_submission).order(created_at: :desc).page(params[:page]).per(20)

    @status_stats = PlagiarismLog.group(:status).count
    @unresolved_count = PlagiarismLog.unresolved.count
  end

  def show
    @submission = @log.assignment_submission
    @source_submission = @log.source_submission
  end

  def resolve
    action = params[:action_taken]
    notes = params[:resolution_notes]

    if @log.resolve(action, notes, current_user)
      log_operation(
        "update",
        target: @log,
        reason: "作业抄袭处理",
        details: "采取措施: #{action}; 处理人: #{current_user&.name}; 备注: #{notes}"
      )
      redirect_to plagiarism_logs_path, notice: "已处理抄袭记录"
    else
      redirect_to @log, alert: "处理失败"
    end
  end

  def close
    notes = params[:resolution_notes]
    close_type = params[:close_type] || "close"

    if close_type == "dismiss"
      if @log.dismiss(notes, current_user)
        log_operation("update", target: @log, reason: "抄袭记录撤销", details: "备注: #{notes}")
        redirect_to plagiarism_logs_path, notice: "已撤销抄袭记录"
      else
        redirect_to @log, alert: "操作失败"
      end
    else
      if @log.close(notes, current_user)
        log_operation("update", target: @log, reason: "抄袭记录关闭", details: "备注: #{notes}")
        redirect_to plagiarism_logs_path, notice: "已关闭抄袭记录"
      else
        redirect_to @log, alert: "关闭失败"
      end
    end
  end

  private

  def set_log
    @log = PlagiarismLog.find(params[:id])
  end
end
