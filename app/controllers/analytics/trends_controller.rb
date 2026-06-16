class Analytics::TrendsController < ApplicationController
  def index
    @start_date = params[:start_date].presence&.to_date || 30.days.ago.to_date
    @end_date = params[:end_date].presence&.to_date || Date.current
    @interval = (params[:interval].presence || "week").to_sym

    calculator = CompletionRateCalculator.new

    @trend_data = calculator.trend_data(@start_date, @end_date, @interval)
    @area_comparison = calculator.by_area_breakdown(@start_date, @end_date)
    @anomalies = calculator.anomalies(@start_date, @end_date)
      .includes(prescription: { assessment_record: :patient })
      .limit(50)

    @trend_chart_data = @trend_data.map { |d| [d[:period], d[:rate]] }
    @area_chart_data = @area_comparison.map { |d| [d[:area].name, d[:rate]] }
  end
end
