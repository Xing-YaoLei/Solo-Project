class InspectionPhotosController < ApplicationController
  before_action :authenticate_user!
  before_action :set_work_order
  before_action :set_inspection_photo, only: %i[destroy]

  def create
    @inspection_photo = @work_order.inspection_photos.build(inspection_photo_params)
    @inspection_photo.taken_by = current_user if current_user

    respond_to do |format|
      if @inspection_photo.save
        @work_order.timeline_events.create!(
          event_type: :photo_added,
          user: current_user,
          content: '添加工单检查照片'
        )
        format.html { redirect_to @work_order, notice: 'Inspection photo was successfully uploaded.' }
        format.turbo_stream
      else
        format.html { redirect_to @work_order, alert: 'Failed to upload inspection photo.' }
        format.turbo_stream { render :new, status: :unprocessable_entity }
      end
    end
  end

  def destroy
    @inspection_photo.destroy
    respond_to do |format|
      format.html { redirect_to @work_order, notice: 'Inspection photo was successfully deleted.', status: :see_other }
      format.turbo_stream { redirect_to @work_order, notice: 'Inspection photo was successfully deleted.', status: :see_other }
    end
  end

  private

  def set_work_order
    @work_order = WorkOrder.find(params[:work_order_id])
  end

  def set_inspection_photo
    @inspection_photo = @work_order.inspection_photos.find(params[:id])
  end

  def inspection_photo_params
    params.require(:inspection_photo).permit(:photo_type, :description, :image)
  end
end
