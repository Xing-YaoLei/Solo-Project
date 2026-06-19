class ReportDownloadsController < ApplicationController
  before_action :set_report_download, only: %i[show destroy]

  def index
    @report_downloads = ReportDownload.all.order(generated_at: :desc)
  end

  def show; end

  def destroy
    @report_download.destroy
    redirect_to report_downloads_path, notice: "下载记录已删除"
  end

  private

  def set_report_download
    @report_download = ReportDownload.find(params[:id])
  end
end
