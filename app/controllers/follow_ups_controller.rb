class FollowUpsController < ApplicationController
  before_action :set_legal_case

  def create
    @follow_up = @legal_case.follow_ups.new(follow_up_params)
    if @follow_up.save
      redirect_to case_path(@legal_case), notice: "跟进记录已添加"
    else
      redirect_to case_path(@legal_case), alert: "跟进记录添加失败"
    end
  end

  def update
    @follow_up = @legal_case.follow_ups.find(params[:id])
    if @follow_up.update(follow_up_params)
      redirect_to case_path(@legal_case), notice: "跟进记录已更新"
    else
      redirect_to case_path(@legal_case), alert: "跟进记录更新失败"
    end
  end

  def destroy
    @follow_up = @legal_case.follow_ups.find(params[:id])
    @follow_up.destroy
    redirect_to case_path(@legal_case), notice: "跟进记录已删除"
  end

  private

  def set_legal_case
    @legal_case = LegalCase.find(params[:case_id])
  end

  def follow_up_params
    params.require(:follow_up).permit(:content, :follow_date, :operator, :next_step)
  end
end
