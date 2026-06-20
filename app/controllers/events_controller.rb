class EventsController < ApplicationController
  before_action :authenticate_user!
  before_action :set_event, only: %i[show edit update]

  def index
    @events = Event.recent.page(params[:page]).per(20)
  end

  def show
  end

  def edit
  end

  def update
    if @event.update(event_params)
      redirect_to @event, notice: t("event.successfully_updated")
    else
      render :edit, status: :unprocessable_content
    end
  end

  private

  def set_event
    @event = Event.find(params[:id])
  end

  def event_params
    params.require(:event).permit(:name, :description, :start_time, :end_time, :location, :status)
  end
end
