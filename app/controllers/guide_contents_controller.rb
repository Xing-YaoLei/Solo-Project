class GuideContentsController < ApplicationController
  before_action :set_guide_content, only: [:show, :edit, :update, :destroy]

  def index
    @q = GuideContent.ransack(params[:q])
    @guide_contents = @q.result.order(order_index: :asc).page(params[:page]).per(20)
  end

  def show
    @processing_records = @guide_content.processing_records.recent.page(params[:page]).per(10)
  end

  def new
    @guide_content = GuideContent.new
  end

  def edit
  end

  def create
    @guide_content = GuideContent.new(guide_content_params)

    if @guide_content.save
      ProcessingRecord.create!(
        recordable: @guide_content,
        handler: current_user,
        action_type: "创建",
        status: :completed,
        notes: "创建导览内容"
      )
      redirect_to @guide_content, notice: "导览内容创建成功。"
    else
      render :new, status: :unprocessable_entity
    end
  end

  def update
    if @guide_content.update(guide_content_params)
      ProcessingRecord.create!(
        recordable: @guide_content,
        handler: current_user,
        action_type: "更新",
        status: :completed,
        notes: "更新导览内容信息"
      )
      redirect_to @guide_content, notice: "导览内容更新成功。"
    else
      render :edit, status: :unprocessable_entity
    end
  end

  def destroy
    @guide_content.destroy
    redirect_to guide_contents_url, notice: "导览内容已删除。", status: :see_other
  end

  private

  def set_guide_content
    @guide_content = GuideContent.find(params[:id])
  end

  def guide_content_params
    params.require(:guide_content).permit(:title, :content, :duration_minutes, :order_index, :category, :status, :point_of_interest, :audio_url, :cover_image)
  end
end
