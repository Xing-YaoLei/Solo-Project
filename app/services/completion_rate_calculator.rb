class CompletionRateCalculator
  def overall_rate(start_date = nil, end_date = nil)
    sessions = filtered_sessions(start_date, end_date)
    calculate_rate(sessions)
  end

  def by_area(area_id, start_date = nil, end_date = nil)
    sessions = filtered_sessions(start_date, end_date)
      .joins(prescription: { assessment_record: :patient })
      .where(patients: { area_id: area_id })
    calculate_rate(sessions)
  end

  def by_therapist(therapist_id, start_date = nil, end_date = nil)
    sessions = filtered_sessions(start_date, end_date)
      .joins(:prescription)
      .where(training_prescriptions: { therapist_id: therapist_id })
    calculate_rate(sessions)
  end

  def by_area_breakdown(start_date = nil, end_date = nil)
    Area.all.map do |area|
      { area: area, rate: by_area(area.id, start_date, end_date) }
    end
  end

  def by_therapist_breakdown(start_date = nil, end_date = nil)
    User.by_role(:therapist).map do |therapist|
      { therapist: therapist, rate: by_therapist(therapist.id, start_date, end_date) }
    end
  end

  def trend_data(start_date, end_date, interval = :week)
    sessions = filtered_sessions(start_date, end_date)
    grouped = sessions.group_by_period(interval, :session_date)
    grouped.map do |period, group_sessions|
      { period: period, rate: calculate_rate(group_sessions) }
    end
  end

  def anomalies(start_date = nil, end_date = nil)
    sessions = filtered_sessions(start_date, end_date)
    sessions.where(status: :missed)
      .or(sessions.where(actual_duration: 0))
  end

  private

  def filtered_sessions(start_date, end_date)
    scope = TrainingSession.all
    scope = scope.where(session_date: start_date..end_date) if start_date && end_date
    scope
  end

  def calculate_rate(sessions)
    total = sessions.count
    return 0.0 if total.zero?

    completed = sessions.where(status: :completed).count
    (completed.to_f / total * 100).round(1)
  end
end
