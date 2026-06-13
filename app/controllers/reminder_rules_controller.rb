class ReminderRulesController < ApplicationController
  before_action :set_course_consumption
  before_action :set_reminder_rule, only: [:update, :destroy]

  def create
    @reminder_rule = @course_consumption.reminder_rules.build(reminder_rule_params)
    if @reminder_rule.save
      respond_to do |format|
        format.html { redirect_to @course_consumption }
        format.turbo_stream
      end
    else
      redirect_to @course_consumption, alert: "提醒规则创建失败"
    end
  end

  def update
    if @reminder_rule.update(reminder_rule_params)
      respond_to do |format|
        format.html { redirect_to @course_consumption }
        format.turbo_stream
      end
    else
      redirect_to @course_consumption, alert: "提醒规则更新失败"
    end
  end

  def destroy
    @reminder_rule.destroy
    respond_to do |format|
      format.html { redirect_to @course_consumption }
      format.turbo_stream
    end
  end

  private

  def set_course_consumption
    @course_consumption = CourseConsumption.find(params[:course_consumption_id])
  end

  def set_reminder_rule
    @reminder_rule = @course_consumption.reminder_rules.find(params[:id])
  end

  def reminder_rule_params
    params.require(:reminder_rule).permit(:rule_type, :threshold_value, :threshold_unit,
                                           :notification_method, :message_template, :enabled)
  end
end
