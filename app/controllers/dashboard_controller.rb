class DashboardController < ApplicationController
  def index
    @stats = {
      total: Document.count,
      draft: Document.where(status: 'draft').count,
      pending_review: Document.where(status: 'pending_review').count,
      reviewing: Document.where(status: 'reviewing').count,
      approved: Document.where(status: 'approved').count,
      rejected: Document.where(status: 'rejected').count,
      published: Document.where(status: 'published').count,
      archived: Document.where(status: 'archived').count,
      pending_exceptions: ExceptionOrder.where(status: 'pending').count,
      processing_exceptions: ExceptionOrder.where(status: 'processing').count
    }

    @recent_documents = Document.order(created_at: :desc).limit(10)
    @recent_exceptions = ExceptionOrder.order(created_at: :desc).limit(5)
    @high_risk_documents = Document.joins(:risk_word_hits)
                                    .where(risk_word_hits: { risk_words: { risk_level: 'high' } })
                                    .distinct
                                    .limit(5)
  end
end
