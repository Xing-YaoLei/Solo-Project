class BenefitRuleVersionsController < ApplicationController
  def index
    @rule = BenefitRule.find(params[:benefit_rule_id])
    @versions = @rule.versions.order(created_at: :desc)
  end

  def show
    @rule = BenefitRule.find(params[:benefit_rule_id])
    @version = @rule.versions.find(params[:id])
    @changes = parse_changes(@version)
  end

  private

  def parse_changes(version)
    return {} unless version.object_changes
    YAML.safe_load(version.object_changes, permitted_classes: [Date, Time, DateTime]) rescue {}
  end
end
