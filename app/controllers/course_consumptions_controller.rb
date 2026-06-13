class CourseConsumptionsController < ApplicationController
  before_action :set_course_consumption, only: [:show, :edit, :update, :destroy,
                                                  :submit_for_review, :approve, :reject,
                                                  :process_settlement, :complete, :request_more_info,
                                                  :escalate, :review_after_settlement, :close]

  def index
    @q = CourseConsumption.ransack(params[:q])
    @course_consumptions = @q.result
                              .includes(:member, :trainer, :course_package)
                              .order(created_at: :desc)
                              .page(params[:page])
  end

  def show
    @course_chapter = @course_consumption.course_chapters.build
    @performance_feedback = @course_consumption.performance_feedbacks.build
    @reminder_rule = @course_consumption.reminder_rules.build
    @available_tags = ReviewTag.all - @course_consumption.review_tags
  end

  def new
    @course_consumption = CourseConsumption.new(bill_no: generate_bill_no, consumption_date: Date.today)
    @course_consumption.course_chapters.build
    @course_consumption.performance_feedbacks.build
    @course_consumption.reminder_rules.build(rule_type: "progress_delay", threshold_value: 20, threshold_unit: "percent")
  end

  def edit; end

  def create
    @course_consumption = CourseConsumption.new(course_consumption_params)

    if @course_consumption.save
      @course_consumption.update_progress_rate!
      redirect_to @course_consumption, notice: "课程消耗单已创建"
    else
      render :new, status: :unprocessable_entity
    end
  end

  def update
    if @course_consumption.update(course_consumption_params)
      @course_consumption.update_progress_rate!
      respond_to do |format|
        format.html { redirect_to @course_consumption, notice: "课程消耗单已更新" }
        format.turbo_stream
      end
    else
      render :edit, status: :unprocessable_entity
    end
  end

  def destroy
    @course_consumption.destroy
    redirect_to course_consumptions_url, notice: "课程消耗单已删除"
  end

  def dashboard
    @stats = CourseConsumption.dashboard_stats
    @source_channel_stats = CourseConsumption.by_source_channel
    @responsible_stats = CourseConsumption.by_responsible_person
    @tag_stats = CourseConsumption.by_review_tag
    @recent_consumptions = CourseConsumption.includes(:member, :trainer).order(created_at: :desc).limit(10)
    @behind_schedule = CourseConsumption.all.select(&:behind_schedule?)
  end

  def reports
    @start_date = params[:start_date] ? Date.parse(params[:start_date]) : 30.days.ago.to_date
    @end_date = params[:end_date] ? Date.parse(params[:end_date]) : Date.today
    @completion_data = CourseConsumption.completion_rate_by_period(@start_date, @end_date)
    @source_channel_stats = CourseConsumption.by_source_channel
    @responsible_stats = CourseConsumption.by_responsible_person
    @tag_stats = CourseConsumption.by_review_tag
  end

  def submit_for_review
    @course_consumption.submit_for_review!
    redirect_to @course_consumption, notice: "已提交审核"
  end

  def approve
    @course_consumption.approve!
    redirect_to @course_consumption, notice: "审核已通过"
  end

  def reject
    @course_consumption.reject!
    redirect_to @course_consumption, alert: "已拒绝"
  end

  def process_settlement
    @course_consumption.process_settlement!
    redirect_to @course_consumption, notice: "进入结算处理"
  end

  def complete
    @course_consumption.complete!
    redirect_to @course_consumption, notice: "结算已完成"
  end

  def request_more_info
    @course_consumption.request_more_info!
    redirect_to @course_consumption, alert: "已要求补充资料"
  end

  def escalate
    @course_consumption.escalate!
    redirect_to @course_consumption, alert: "已升级复核"
  end

  def review_after_settlement
    @course_consumption.review_after_settlement!
    redirect_to @course_consumption, notice: "复盘已完成"
  end

  def close
    @course_consumption.close!
    redirect_to @course_consumption, notice: "单据已关闭"
  end

  private

  def set_course_consumption
    @course_consumption = CourseConsumption.find(params[:id])
  end

  def course_consumption_params
    params.require(:course_consumption).permit(
      :bill_no, :member_id, :trainer_id, :course_package_id,
      :consumption_date, :sessions_consumed, :sessions_remaining,
      :responsible_person, :source_channel, :review_notes,
      :settlement_notes, :review_summary,
      course_chapters_attributes: [:id, :title, :content, :position, :chapter_status, :_destroy],
      performance_feedbacks_attributes: [:id, :course_chapter_id, :score, :performance_level,
                                          :coach_feedback, :member_feedback, :improvement_points,
                                          :body_metrics, :_destroy],
      reminder_rules_attributes: [:id, :rule_type, :threshold_value, :threshold_unit,
                                   :notification_method, :message_template, :enabled, :_destroy]
    )
  end

  def generate_bill_no
    "CC#{Time.current.strftime('%Y%m%d%H%M%S')}#{rand(1000).to_s.rjust(3, '0')}"
  end
end
