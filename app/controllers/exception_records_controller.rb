class ExceptionRecordsController < ApplicationController
  before_action :set_exception_record, only: %i[show assign resolve close]

  def index
    @exception_records = ExceptionRecord.includes(:order, :ticket).order(created_at: :desc)
    @exception_records = @exception_records.where(status: params[:status]) if params[:status].present?
    @exception_records = @exception_records.where(exception_type: params[:exception_type]) if params[:exception_type].present?
    @exception_records = paginate(@exception_records, per_page: 20)
  end

  def show
    @status_logs = StatusLog.for_trackable(@exception_record).recent.limit(20)
  end

  def assign
    if @exception_record.may_assign?
      @exception_record.assignee = params[:assignee]
      @exception_record.assign!
      redirect_to @exception_record, notice: "异常单已指派给 #{params[:assignee]}"
    else
      redirect_to @exception_record, alert: "当前状态无法指派"
    end
  end

  def resolve
    if @exception_record.may_resolve?
      @exception_record.update!(resolution: params[:resolution], conclusion: params[:conclusion])
      @exception_record.resolve!
      redirect_to @exception_record, notice: "异常单已解决"
    else
      redirect_to @exception_record, alert: "当前状态无法解决"
    end
  end

  def close
    if @exception_record.may_close?
      @exception_record.update!(conclusion: params[:conclusion]) if params[:conclusion].present?
      @exception_record.close!
      redirect_to @exception_record, notice: "异常单已关闭"
    else
      redirect_to @exception_record, alert: "当前状态无法关闭"
    end
  end

  def export
    file_path = ExportExcelJob.perform_now("exception_records", params.to_unsafe_h.slice(:status, :exception_type))
    send_file file_path, filename: File.basename(file_path), type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  end

  private

  def set_exception_record
    @exception_record = ExceptionRecord.find(params[:id])
  end
end
