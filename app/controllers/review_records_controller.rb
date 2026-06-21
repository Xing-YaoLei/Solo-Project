class ReviewRecordsController < ApplicationController
  before_action :set_legal_case

  def create
    @review = @legal_case.review_records.new(review_record_params)
    if @review.save
      redirect_to case_path(@legal_case), notice: "复盘记录已添加"
    else
      redirect_to case_path(@legal_case), alert: "复盘记录添加失败"
    end
  end

  def update
    @review = @legal_case.review_records.find(params[:id])
    if @review.update(review_record_params)
      redirect_to case_path(@legal_case), notice: "复盘记录已更新"
    else
      redirect_to case_path(@legal_case), alert: "复盘记录更新失败"
    end
  end

  def destroy
    @review = @legal_case.review_records.find(params[:id])
    @review.destroy
    redirect_to case_path(@legal_case), notice: "复盘记录已删除"
  end

  private

  def set_legal_case
    @legal_case = LegalCase.find(params[:case_id])
  end

  def review_record_params
    params.require(:review_record).permit(:content, :result, :lessons, :review_date, :operator)
  end
end
