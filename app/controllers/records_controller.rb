class RecordsController < ApplicationController
  def index
    @properties = Property.all
    @selected_property = Property.find_by(id: params[:property_id]) || @properties.first
    @start_date = Date.parse(params[:start_date]) rescue Date.current.beginning_of_month
    @end_date = Date.parse(params[:end_date]) rescue Date.current.end_of_month
    @calendar_dates = (@start_date..@end_date).to_a
    @channel_orders = ChannelOrder.for_date_range(@start_date, @end_date).for_property(@selected_property&.id)
    @cleaning_tasks = CleaningTask.for_property(@selected_property&.id).where(task_date: @start_date..@end_date)
    @room_conflicts = RoomConflict.for_property(@selected_property&.id).open
  end
end
