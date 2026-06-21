class ReviewOpinionsController < ApplicationController
  before_action :set_document

  def create
    @review_opinion = @document.review_opinions.new(review_opinion_params)
    @review_opinion.reviewer = current_user
    @review_opinion.reviewed_at = Time.current

    if @review_opinion.save
      if @review_opinion.result == 'approved' && @document.may_approve?
        @document.approve!
        @document.record_status_history(current_user, 'reviewing', 'approved', "审核通过：#{@review_opinion.opinion}")
        @document.record_interaction(current_user, 'review_approve', @review_opinion.opinion)
      elsif @review_opinion.result == 'rejected' && @document.may_reject?
        @document.reject!
        @document.record_status_history(current_user, 'reviewing', 'rejected', "审核退回：#{@review_opinion.opinion}")
        @document.record_interaction(current_user, 'review_reject', @review_opinion.opinion)
        create_exception_order(@document, current_user, @review_opinion.opinion)
      end
      redirect_to @document, notice: '审核意见已提交'
    else
      redirect_to @document, alert: '审核意见提交失败'
    end
  end

  private

  def set_document
    @document = Document.find(params[:document_id])
  end

  def review_opinion_params
    params.require(:review_opinion).permit(:opinion, :result)
  end

  def create_exception_order(document, reviewer, opinion)
    ExceptionOrder.create!(
      document: document,
      impact_scope: "文书「#{document.title}」审核退回，可能影响发布排期和后续归档进度",
      responsibility: "审核员：#{reviewer.name}，退回原因：#{opinion}",
      status: 'pending',
      handler: nil
    )
  end
end
