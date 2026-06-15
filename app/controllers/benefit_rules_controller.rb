class BenefitRulesController < ApplicationController
  before_action :set_rule, only: [:show, :edit, :update, :destroy]

  def index
    @rules = BenefitRule.all
    @rules = @rules.where(is_active: ActiveModel::Type::Boolean.new.cast(params[:is_active])) unless params[:is_active].nil?
    @rules = @rules.by_type(params[:rule_type])
    @rules = @rules.for_level(params[:target_member_level])
    @rules = @rules.includes(:creator).order(created_at: :desc).page(params[:page]).per(20)
  end

  def show
    @versions = @rule.version_history
  end

  def new
    @rule = BenefitRule.new
  end

  def create
    @rule = BenefitRule.new(benefit_rule_params)
    @rule.creator = current_user
    if @rule.save
      log_operation("create", target: @rule, details: "创建权益规则：#{@rule.name}")
      redirect_to @rule, notice: "权益规则创建成功"
    else
      render :new
    end
  end

  def edit
  end

  def update
    before_data = {
      name: @rule.name,
      rule_type: @rule.rule_type,
      target_member_level: @rule.target_member_level,
      conditions: @rule.conditions,
      benefits: @rule.benefits,
      is_active: @rule.is_active,
      effective_date: @rule.effective_date,
      expiry_date: @rule.expiry_date
    }

    if @rule.update(benefit_rule_params)
      after_data = {
        name: @rule.name,
        rule_type: @rule.rule_type,
        target_member_level: @rule.target_member_level,
        conditions: @rule.conditions,
        benefits: @rule.benefits,
        is_active: @rule.is_active,
        effective_date: @rule.effective_date,
        expiry_date: @rule.expiry_date
      }
      changed_fields = before_data.each_with_object([]) do |(k, v), arr|
        arr << k.to_s if v != after_data[k]
      end
      log_operation(
        "update",
        target: @rule,
        reason: "权益规则改动",
        details: "改动字段: #{changed_fields.join(', ')}; 修改前值: #{before_data.to_json}; 修改后值: #{after_data.to_json}",
        before_data: before_data,
        after_data: after_data
      )
      redirect_to @rule, notice: "权益规则更新成功，已保留版本历史"
    else
      render :edit
    end
  end

  def destroy
    log_operation("delete", target: @rule, details: "删除权益规则：#{@rule.name}")
    @rule.destroy
    redirect_to benefit_rules_path, notice: "权益规则已删除"
  end

  private

  def set_rule
    @rule = BenefitRule.find(params[:id])
  end

  def benefit_rule_params
    params.require(:benefit_rule).permit(
      :name, :rule_type, :target_member_level, :is_active,
      :effective_date, :expiry_date, :description,
      conditions: {}, benefits: {}
    )
  end
end
