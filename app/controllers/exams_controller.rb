class ExamsController < ApplicationController
  before_action :set_exam, only: [:show, :edit, :update, :destroy]

  def index
    @exams = Exam.all
    @exams = @exams.by_community(params[:community_id])
    @exams = @exams.by_type(params[:exam_type])
    if params[:start_date].present? && params[:end_date].present?
      @exams = @exams.by_date_range(params[:start_date], params[:end_date])
    end
    @exams = @exams.includes(:community, :exam_results).order(exam_date: :desc).page(params[:page]).per(20)
  end

  def show
    @exam_results = @exam.exam_results.includes(:student, :reviewer).order(score: :desc)
    @pass_rate = @exam.pass_rate
    @average_score = @exam.average_score
  end

  def monthly_review
    @year = (params[:year] || Date.current.year).to_i
    @month = (params[:month] || Date.current.month).to_i

    start_date = Date.new(@year, @month, 1)
    end_date = start_date.end_of_month

    @filter_params = {
      year: @year,
      month: @month,
      community_id: params[:community_id],
      exam_type: params[:exam_type]
    }

    exams = Exam.where(exam_date: start_date..end_date)
    exams = exams.where(community_id: params[:community_id]) if params[:community_id].present?
    exams = exams.where(exam_type: params[:exam_type]) if params[:exam_type].present?

    @exams_with_stats = exams.includes(:community, :exam_results).order(exam_date: :asc).map do |exam|
      {
        exam: exam,
        total: exam.total_participants,
        passed: exam.passed_count,
        failed: exam.failed_count,
        pass_rate: exam.pass_rate,
        avg_score: exam.average_score
      }
    end

    total_participants = @exams_with_stats.sum { |s| s[:total] }
    total_passed = @exams_with_stats.sum { |s| s[:passed] }
    @overall_pass_rate = total_participants > 0 ? (total_passed.to_f / total_participants * 100).round(2) : 0
    @total_participants = total_participants
    @total_passed = total_passed
    @total_failed = total_participants - total_passed
    @overall_avg_score = if total_participants > 0
                           (@exams_with_stats.sum { |s| s[:avg_score] * s[:total] } / total_participants).round(2)
                         else
                           0
                         end

    @communities = Community.all
  end

  def export_pass_rates
    @year = (params[:year] || Date.current.year).to_i
    @month = (params[:month] || Date.current.month).to_i

    filter_conditions = {
      year: @year,
      month: @month,
      community_id: params[:community_id],
      exam_type: params[:exam_type]
    }

    export_record = ExportRecord.create!(
      export_type: "exam_pass_rates",
      operator: current_user,
      filter_conditions: filter_conditions,
      status: "processing"
    )

    ExportReportJob.perform_later(export_record.id)

    redirect_to export_record_status_path(export_record), notice: "正在生成考试通过率报表，请稍后..."
  rescue => e
    redirect_to monthly_review_exams_path, alert: "导出失败: #{e.message}"
  end

  def new
    @exam = Exam.new
    @communities = Community.all
  end

  def create
    @exam = Exam.new(exam_params)
    if @exam.save
      log_operation("create", target: @exam, details: "创建考试：#{@exam.name}")
      redirect_to @exam, notice: "考试创建成功"
    else
      @communities = Community.all
      render :new
    end
  end

  def edit
    @communities = Community.all
  end

  def update
    before_data = @exam.attributes.slice("name", "exam_type", "community_id", "exam_date", "passing_score", "total_score")
    if @exam.update(exam_params)
      after_data = @exam.attributes.slice("name", "exam_type", "community_id", "exam_date", "passing_score", "total_score")
      log_operation("update", target: @exam, before_data: before_data, after_data: after_data, details: "更新考试信息")
      redirect_to @exam, notice: "考试更新成功"
    else
      @communities = Community.all
      render :edit
    end
  end

  def destroy
    log_operation("delete", target: @exam, details: "删除考试：#{@exam.name}")
    @exam.destroy
    redirect_to exams_path, notice: "考试已删除"
  end

  private

  def set_exam
    @exam = Exam.find(params[:id])
  end

  def exam_params
    params.require(:exam).permit(
      :name, :exam_type, :community_id, :exam_date,
      :duration_minutes, :passing_score, :total_score, :description
    )
  end

  def export_record_status_path(record)
    "/export_records/#{record.id}"
  end
end
