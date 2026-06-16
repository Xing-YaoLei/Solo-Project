class PrescriptionRulesController < ApplicationController
  before_action :set_prescription_rule, only: [ :show, :edit, :update, :destroy, :toggle_active ]

  def index
    @prescription_rules = PrescriptionRule.order(created_at: :desc)
  end

  def show
  end

  def new
    @prescription_rule = PrescriptionRule.new(training_plan: [ { exercise_name: "", sets: 3, reps: 10, duration: 30, frequency: "daily" } ])
  end

  def create
    @prescription_rule = PrescriptionRule.new(prescription_rule_params)
    if @prescription_rule.save
      redirect_to prescription_rules_path, notice: "处方规则已创建"
    else
      render :new, status: :unprocessable_entity
    end
  end

  def edit
  end

  def update
    if @prescription_rule.update(prescription_rule_params)
      redirect_to prescription_rules_path, notice: "处方规则已更新"
    else
      render :edit, status: :unprocessable_entity
    end
  end

  def destroy
    @prescription_rule.destroy!
    redirect_to prescription_rules_path, notice: "处方规则已删除"
  end

  def toggle_active
    @prescription_rule.update!(active: !@prescription_rule.active)
  end

  private

  def set_prescription_rule
    @prescription_rule = PrescriptionRule.find(params[:id])
  end

  def prescription_rule_params
    params.require(:prescription_rule).permit(:name, :trigger_condition, :active, training_plan: [ :exercise_name, :sets, :reps, :duration, :frequency ])
  end
end
