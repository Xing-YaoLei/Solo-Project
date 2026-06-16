class TreatmentCalendarThreshold < ApplicationRecord
  belongs_to :area

  def assign_values(params)
    self.max_daily_treatments = params[:max_daily_treatments] if params[:max_daily_treatments].present?
    self.min_interval_minutes = params[:min_interval_minutes] if params[:min_interval_minutes].present?
    self.time_slots = params[:time_slots] if params[:time_slots].present?
  end
end
