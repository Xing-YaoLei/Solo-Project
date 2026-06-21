class CaseStagesController < ApplicationController
  before_action :set_legal_case

  def create
    @stage = @legal_case.case_stages.new(case_stage_params)
    @stage.status ||= "pending"
    @stage.order ||= (@legal_case.case_stages.maximum(:order) || 0) + 1

    if @stage.save
      redirect_to case_path(@legal_case), notice: "阶段已添加"
    else
      redirect_to case_path(@legal_case), alert: "阶段添加失败"
    end
  end

  def update
    @stage = @legal_case.case_stages.find(params[:id])
    if @stage.update(case_stage_params)
      redirect_to case_path(@legal_case), notice: "阶段已更新"
    else
      redirect_to case_path(@legal_case), alert: "阶段更新失败"
    end
  end

  def destroy
    @stage = @legal_case.case_stages.find(params[:id])
    @stage.destroy
    redirect_to case_path(@legal_case), notice: "阶段已删除"
  end

  private

  def set_legal_case
    @legal_case = LegalCase.find(params[:legal_case_id])
  end

  def case_stage_params
    params.require(:case_stage).permit(:name, :description, :start_date, :end_date, :status, :notes, :order)
  end
end
