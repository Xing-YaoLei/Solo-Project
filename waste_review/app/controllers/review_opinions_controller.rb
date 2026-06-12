class ReviewOpinionsController < ApplicationController
  def create
    @waste_report = WasteReport.find(params[:waste_report_id])
    @review_opinion = @waste_report.review_opinions.build(review_opinion_params)
    if @review_opinion.save
      transition_status!
      redirect_to @waste_report, notice: "复核意见已提交"
    else
      redirect_to @waste_report, alert: "复核意见提交失败"
    end
  end

  private

  def review_opinion_params
    params.require(:review_opinion).permit(:reviewer, :opinion, :result)
  end

  def transition_status!
    case @review_opinion.result
    when "approved"
      @waste_report.status = :approved
      @waste_report.save!
    when "rejected"
      @waste_report.status = :rejected
      @waste_report.save!
    end
  end
end
