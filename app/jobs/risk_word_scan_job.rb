class RiskWordScanJob < ApplicationJob
  queue_as :default

  def perform(document_id)
    document = Document.find_by(id: document_id)
    return unless document

    document.scan_risk_words
  end
end
