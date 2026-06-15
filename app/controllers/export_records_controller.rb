class ExportRecordsController < ApplicationController
  def index
    @records = ExportRecord.all
    @records = @records.by_type(params[:export_type])
    @records = @records.by_operator(params[:operator_id])
    @records = @records.recent.page(params[:page]).per(20)
  end

  def show
    @record = ExportRecord.find(params[:id])
  end

  def download
    @record = ExportRecord.find(params[:id])
    if @record.completed? && @record.file_name
      file_path = Rails.root.join("tmp", "exports", @record.file_name)
      if File.exist?(file_path)
        send_file file_path, type: "text/csv", filename: @record.file_name
      else
        redirect_to export_record_path(@record), alert: "文件不存在，可能已过期"
      end
    else
      redirect_to export_record_path(@record), alert: "文件尚未生成或生成失败"
    end
  end

  def new
    @export_types = ExportRecord::EXPORT_TYPES
    @users = User.all
  end

  def create
    filter_conditions = {}
    if params[:filter_conditions_json].present?
      begin
        filter_conditions = JSON.parse(params[:filter_conditions_json])
      rescue JSON::ParserError
        filter_conditions = { raw: params[:filter_conditions_json] }
      end
    elsif params[:filter_conditions].present?
      filter_conditions = params[:filter_conditions].is_a?(ActionController::Parameters) ? params[:filter_conditions].to_unsafe_h : params[:filter_conditions]
    end

    export_record = ExportRecord.new(
      export_type: params[:export_record]&.fetch(:export_type, params[:export_type]),
      operator: current_user,
      filter_conditions: filter_conditions,
      status: "processing"
    )

    if export_record.save
      ExportReportJob.perform_later(export_record.id)
      redirect_to export_record_path(export_record), notice: "正在生成导出文件..."
    else
      @export_types = ExportRecord::EXPORT_TYPES
      @export_record = export_record
      render :new
    end
  end
end
