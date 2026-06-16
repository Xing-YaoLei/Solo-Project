class AssessmentService
  def calculate_score(record)
    scale = record.scale
    item_scores = record.item_scores || {}
    return 0.0 if item_scores.empty?

    total = 0.0
    scale.scale_items.each do |item|
      score = item_scores[item.id.to_s].to_f
      total += score * item.weight
    end
    total.round(2)
  end

  def assign_grade(record)
    scoring_config = record.scale.scoring_config
    return nil unless scoring_config.present?

    total = record.total_score.to_f
    grades = scoring_config['grades'] || []

    matched = grades.find do |g|
      min = g['min'].to_f
      max = g['max'].to_f
      total >= min && total <= max
    end

    matched&.dig('label')
  end

  def build_record(patient_id, scale_id, assessor_id)
    scale = AssessmentScale.find(scale_id)
    record = AssessmentRecord.new(
      patient_id: patient_id,
      scale: scale,
      assessor_id: assessor_id,
      status: :draft,
      assessed_at: Date.current,
      item_scores: {}
    )
    scale.scale_items.order(:sort_order).each do |item|
      record.item_scores[item.id.to_s] = nil
    end
    record
  end
end
