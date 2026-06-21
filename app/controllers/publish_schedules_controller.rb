class PublishSchedulesController < ApplicationController
  before_action :set_document

  def create
    @publish_schedule = @document.publish_schedules.new(publish_schedule_params)

    if @publish_schedule.save
      if @document.may_schedule?
        @document.schedule!
        @document.record_status_history(current_user, 'approved', 'scheduled', "排期发布：#{@publish_schedule.planned_publish_at.strftime('%Y-%m-%d %H:%M')}")
      end
      @document.record_interaction(current_user, 'schedule', "排期：#{@publish_schedule.channel_name} #{@publish_schedule.planned_publish_at.strftime('%Y-%m-%d %H:%M')}")
      redirect_to @document, notice: '发布排期已创建'
    else
      redirect_to @document, alert: '发布排期创建失败'
    end
  end

  private

  def set_document
    @document = Document.find(params[:document_id])
  end

  def publish_schedule_params
    params.require(:publish_schedule).permit(:planned_publish_at, :channel, :note)
  end
end
