class AccessRecordsController < ApplicationController
  before_action :set_access_record, only: %i[show destroy]

  def index
    @access_records = AccessRecord.includes(:parking_spot).recent
    @access_records = @access_records.by_direction(params[:direction]) if params[:direction].present?
    @access_records = @access_records.by_date_range(params[:start_date], params[:end_date]) if params[:start_date].present?
    @access_records = @access_records.where(plate_number: params[:plate_number]) if params[:plate_number].present?
  end

  def show
    @related_bills = ParkingBill.where(plate_number: @access_record.plate_number)
                                .order(created_at: :desc)
                                .limit(10)
    @related_routes = InspectionRoute.where(scheduled_at: @access_record.accessed_at.beginning_of_day..@access_record.accessed_at.end_of_day)
                                     .recent
                                     .limit(5)
  end

  def create
    @access_record = AccessRecord.new(access_record_params)
    if @access_record.save
      respond_to do |format|
        format.html { redirect_to access_records_url, notice: "门禁记录创建成功" }
        format.turbo_stream
      end
    else
      render :new, status: :unprocessable_entity
    end
  end

  def destroy
    @access_record.destroy!
    redirect_to access_records_url, notice: "记录已删除"
  end

  private

  def set_access_record
    @access_record = AccessRecord.find(params[:id])
  end

  def access_record_params
    params.require(:access_record).permit(
      :plate_number, :direction, :access_type, :accessed_at,
      :parking_spot_id, :gate_name
    )
  end
end
