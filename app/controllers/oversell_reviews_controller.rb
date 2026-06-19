class OversellReviewsController < ApplicationController
  before_action :set_order

  def new
    @oversell_review = @order.oversell_reviews.build
    authorize @oversell_review
  end

  def create
    @oversell_review = @order.oversell_reviews.build(oversell_review_params)
    @oversell_review.reviewer = current_user
    @oversell_review.reviewed_at = Time.current
    authorize @oversell_review

    if @oversell_review.save
      redirect_to @order, notice: "复核意见已提交。"
    else
      render :new, status: :unprocessable_entity
    end
  end

  private

  def set_order
    @order = Order.find(params[:order_id])
  end

  def oversell_review_params
    params.require(:oversell_review).permit(:review_opinion, :resolution)
  end
end
