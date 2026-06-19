class Desktop::ExportsController < ApplicationController
  def index
    @exports = current_user.exports.recent.page(params[:page]).per(20)
  end

  def create
    export_type = params[:export_type]

    if Export::EXPORT_TYPES.include?(export_type)
      export = current_user.exports.create!(
        export_type: export_type,
        filters: params[:filters] || {}
      )

      ExportWorker.perform_async(export.id)

      redirect_to desktop_exports_path, notice: "导出任务已提交，完成后可在此下载。"
    else
      redirect_to desktop_exports_path, alert: "无效的导出类型。"
    end
  end

  def download
    @export = current_user.exports.find(params[:id])

    if @export.completed? && @export.file.attached?
      redirect_to rails_blob_path(@export.file, disposition: "attachment")
    else
      redirect_to desktop_exports_path, alert: "导出文件尚未准备好。"
    end
  end
end
