class Analytics::CompletionRatesController < ApplicationController
  def index
    @start_date = params[:start_date].presence&.to_date
    @end_date = params[:end_date].presence&.to_date
    @area_id = params[:area_id].presence
    @therapist_id = params[:therapist_id].presence

    calculator = CompletionRateCalculator.new

    @overall_rate = if @area_id
      calculator.by_area(@area_id, @start_date, @end_date)
    elsif @therapist_id
      calculator.by_therapist(@therapist_id, @start_date, @end_date)
    else
      calculator.overall_rate(@start_date, @end_date)
    end

    @area_breakdown = calculator.by_area_breakdown(@start_date, @end_date)
    @therapist_breakdown = calculator.by_therapist_breakdown(@start_date, @end_date)

    @areas = Area.all
    @therapists = User.by_role(:therapist)
  end
end
