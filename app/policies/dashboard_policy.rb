class DashboardPolicy < ApplicationPolicy
  def index?
    user.present?
  end

  def stats?
    user.present?
  end

  def rectification_report?
    user.auditor? || user.supervisor? || user.admin?
  end

  def export_data?
    user.supervisor? || user.admin?
  end

  def system_config?
    user.admin?
  end
end
