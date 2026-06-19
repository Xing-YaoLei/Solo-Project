class AttachmentsController < ApplicationController
  before_action :authenticate_user!
  before_action :set_work_order
  before_action :set_attachment, only: %i[destroy]

  def create
    @attachment = @work_order.attachments.build(attachment_params)
    @attachment.uploaded_by = current_user if current_user

    respond_to do |format|
      if @attachment.save
        @work_order.timeline_events.create!(
          event_type: :note_added,
          user: current_user,
          content: "添加工单附件: #{@attachment.file.filename}"
        )
        format.html { redirect_to @work_order, notice: 'Attachment was successfully uploaded.' }
        format.turbo_stream
      else
        format.html { redirect_to @work_order, alert: 'Failed to upload attachment.' }
        format.turbo_stream { render :new, status: :unprocessable_entity }
      end
    end
  end

  def destroy
    @attachment.destroy
    respond_to do |format|
      format.html { redirect_to @work_order, notice: 'Attachment was successfully deleted.', status: :see_other }
      format.turbo_stream { redirect_to @work_order, notice: 'Attachment was successfully deleted.', status: :see_other }
    end
  end

  private

  def set_work_order
    @work_order = WorkOrder.find(params[:work_order_id])
  end

  def set_attachment
    @attachment = @work_order.attachments.find(params[:id])
  end

  def attachment_params
    params.require(:attachment).permit(:description, :file)
  end
end
