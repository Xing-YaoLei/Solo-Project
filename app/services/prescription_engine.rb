class PrescriptionEngine
  def self.match_rules(assessment_record)
    PrescriptionRule.active.select do |rule|
      condition = rule.trigger_condition.to_s.strip
      next false if condition.blank?

      matches_condition?(condition, assessment_record)
    end
  end

  def self.generate_prescription(assessment_record, rule, therapist_id)
    plan_detail = rule.training_plan
    start_date = Date.current
    frequency = extract_frequency(plan_detail)
    end_date = calculate_end_date(start_date, plan_detail, frequency)

    prescription = TrainingPrescription.create!(
      assessment_record: assessment_record,
      rule: rule,
      therapist_id: therapist_id,
      plan_detail: plan_detail,
      start_date: start_date,
      end_date: end_date,
      status: :active
    )

    generate_sessions(prescription, plan_detail, frequency)

    prescription
  end

  def self.calculate_completion_rate(prescription)
    total = prescription.training_sessions.count
    return 0.0 if total.zero?

    completed = prescription.training_sessions.where(status: :completed).count
    (completed.to_f / total * 100).round(1)
  end

  class << self
    private

    def matches_condition?(condition, record)
      grade = record.grade.to_s
      score = record.total_score.to_f

      condition.split(/\s+AND\s+/i).all? do |clause|
        clause = clause.strip
        if clause.match?(/^grade\s*[=~]\s*/i)
          expected = clause.sub(/^grade\s*[=~]\s*/i, "").strip
          grade == expected
        elsif clause.match?(/^score\s*(>=|<=|>|<|=)\s*/i)
          operator = $1
          value = clause.sub(/^score\s*(>=|<=|>|<|=)\s*/i, "").strip.to_f
          score.send(operator.to_sym, value)
        else
          false
        end
      end
    end

    def extract_frequency(plan_detail)
      items = Array(plan_detail)
      return "daily" if items.empty?

      items.first["frequency"].presence || "daily"
    end

    def calculate_end_date(start_date, plan_detail, frequency)
      items = Array(plan_detail)
      duration_weeks = items.sum { |i| (i["sets"].to_i * i["reps"].to_i > 0) ? 4 : 2 }

      case frequency
      when "daily"
        start_date + duration_weeks.weeks
      when "weekly"
        start_date + (duration_weeks * 7).days
      when "biweekly"
        start_date + (duration_weeks * 14).days
      when "monthly"
        start_date + (duration_weeks * 30).days
      else
        start_date + 4.weeks
      end
    end

    def generate_sessions(prescription, plan_detail, frequency)
      session_dates = calculate_session_dates(prescription.start_date, prescription.end_date, frequency)
      items = Array(plan_detail)
      default_equipment = Equipment.first

      session_dates.each do |date|
        items.each do |item|
          item["sets"].to_i.times do
            TrainingSession.create!(
              prescription: prescription,
              equipment: default_equipment,
              session_date: date,
              planned_duration: item["duration"].to_i,
              status: :planned
            )
          end
        end
      end
    end

    def calculate_session_dates(start_date, end_date, frequency)
      dates = []
      current = start_date

      while current <= end_date
        dates << current
        case frequency
        when "daily"
          current = current.next_day
        when "weekly"
          current = current + 7.days
        when "biweekly"
          current = current + 14.days
        when "monthly"
          current = current >> 1
        else
          current = current.next_day
        end
      end

      dates
    end
  end
end
