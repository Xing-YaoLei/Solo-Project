class NotesController < ApplicationController
  before_action :authenticate_user!
  before_action :set_work_order
  before_action :set_note, only: %i[destroy]

  def create
    @note = @work_order.notes.build(note_params)
    @note.author = current_user

    respond_to do |format|
      if @note.save
        @work_order.timeline_events.create!(
          event_type: :note_added,
          user: current_user,
          content: '添加工单备注'
        )
        format.html { redirect_to @work_order, notice: 'Note was successfully created.' }
        format.turbo_stream
      else
        format.html { redirect_to @work_order, alert: 'Failed to create note.' }
        format.turbo_stream { render :new, status: :unprocessable_entity }
      end
    end
  end

  def destroy
    @note.destroy
    respond_to do |format|
      format.html { redirect_to @work_order, notice: 'Note was successfully deleted.', status: :see_other }
      format.turbo_stream { redirect_to @work_order, notice: 'Note was successfully deleted.', status: :see_other }
    end
  end

  private

  def set_work_order
    @work_order = WorkOrder.find(params[:work_order_id])
  end

  def set_note
    @note = @work_order.notes.find(params[:id])
  end

  def note_params
    params.require(:note).permit(:content)
  end
end
