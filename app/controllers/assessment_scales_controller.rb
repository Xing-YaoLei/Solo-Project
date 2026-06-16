class AssessmentScalesController < ApplicationController
  before_action :set_assessment_scale, only: [:show, :edit, :update, :destroy, :toggle_active]

  def index
    @assessment_scales = AssessmentScale.all
    @assessment_scales = @assessment_scales.where("name ILIKE ?", "%#{params[:search]}%") if params[:search].present?
    @assessment_scales = @assessment_scales.where(category: params[:category]) if params[:category].present?
    @assessment_scales = @assessment_scales.order(created_at: :desc).page(params[:page])
    @categories = AssessmentScale.distinct.pluck(:category).compact
  end

  def show
    @scale_items = @assessment_scale.scale_items.order(:sort_order)
  end

  def new
    @assessment_scale = AssessmentScale.new
  end

  def create
    @assessment_scale = AssessmentScale.new(assessment_scale_params)
    if @assessment_scale.save
      redirect_to assessment_scales_path, notice: "评估量表创建成功"
    else
      render :new, status: :unprocessable_entity
    end
  end

  def edit
  end

  def update
    if @assessment_scale.update(assessment_scale_params)
      redirect_to assessment_scales_path, notice: "评估量表更新成功"
    else
      render :edit, status: :unprocessable_entity
    end
  end

  def destroy
    @assessment_scale.destroy!
    redirect_to assessment_scales_path, notice: "评估量表已删除"
  end

  def toggle_active
    @assessment_scale.update!(active: !@assessment_scale.active)
    redirect_to assessment_scales_path, notice: @assessment_scale.active ? "量表已启用" : "量表已停用"
  end

  private

  def set_assessment_scale
    @assessment_scale = AssessmentScale.find(params[:id])
  end

  def assessment_scale_params
    params.require(:assessment_scale).permit(:name, :category, :version, :active, :scoring_config)
  end
end
