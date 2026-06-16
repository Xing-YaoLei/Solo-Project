class AssessmentScales::ScaleItemsController < ApplicationController
  before_action :set_scale
  before_action :set_scale_item, only: [:update, :destroy]

  def create
    @scale_item = @scale.scale_items.build(scale_item_params)
    if @scale_item.save
      respond_to do |format|
        format.turbo_stream
        format.html { redirect_to @scale, notice: "评估项目添加成功" }
      end
    else
      respond_to do |format|
        format.turbo_stream { render turbo_stream: turbo_stream.replace("scale_item_form", partial: "assessment_scales/scale_items/form", locals: { scale: @scale, scale_item: @scale_item }) }
        format.html { redirect_to @scale, alert: "添加失败" }
      end
    end
  end

  def update
    if @scale_item.update(scale_item_params)
      respond_to do |format|
        format.turbo_stream
        format.html { redirect_to @scale, notice: "评估项目更新成功" }
      end
    else
      respond_to do |format|
        format.turbo_stream { render turbo_stream: turbo_stream.replace("scale_item_#{@scale_item.id}", partial: "assessment_scales/scale_items/scale_item", locals: { scale: @scale, scale_item: @scale_item }) }
        format.html { redirect_to @scale, alert: "更新失败" }
      end
    end
  end

  def destroy
    @scale_item.destroy!
    respond_to do |format|
      format.turbo_stream { render turbo_stream: turbo_stream.remove("scale_item_#{@scale_item.id}") }
      format.html { redirect_to @scale, notice: "评估项目已删除" }
    end
  end

  private

  def set_scale
    @scale = AssessmentScale.find(params[:assessment_scale_id])
  end

  def set_scale_item
    @scale_item = @scale.scale_items.find(params[:id])
  end

  def scale_item_params
    params.require(:scale_item).permit(:name, :category, :weight, :sort_order, :scoring_rule)
  end
end
