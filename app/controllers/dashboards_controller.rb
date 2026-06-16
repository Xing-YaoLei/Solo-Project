class DashboardsController < ApplicationController
  def index
    @today_assessment_count = AssessmentRecord.where(assessed_at: Date.current).count
    @pending_denial_count = Settlement.where(status: :denied).count
    @equipment_alert_count = Equipment.where(status: [:maintenance, :retired]).count
    @completion_rate = CompletionRateCalculator.new.overall_rate

    @recent_records = AssessmentRecord.includes(:patient, :scale, :assessor)
      .order(assessed_at: :desc)
      .limit(5)
    @recent_notifications = Notification.order(created_at: :desc).limit(5)
  end
end
