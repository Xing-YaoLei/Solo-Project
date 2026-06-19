class ExportExcelJob < ApplicationJob
  queue_as :default

  def perform(export_type, params = {}, operator = "system")
    model_klass = export_type.classify.constantize
    scope = model_klass.export_scope

    if params[:status].present?
      scope = scope.where(status: params[:status])
    end

    records = scope.to_a

    filename = "#{export_type}_#{Time.current.strftime('%Y%m%d%H%M%S')}.xlsx"
    temp_path = Rails.root.join("tmp", "exports", filename)
    FileUtils.mkdir_p(temp_path.dirname)

    Axlsx::Package.new do |p|
      scope_sheet = p.workbook.add_worksheet(name: "取数口径")
      scope_sheet.add_row ["取数口径说明"]
      scope_sheet.add_row ["数据表", export_type]
      scope_sheet.add_row ["筛选条件", params.present? ? params.to_s : "无"]
      scope_sheet.add_row ["口径描述", model_klass.data_scope_description]
      scope_sheet.add_row ["导出时间", Time.current.to_s]
      scope_sheet.add_row ["操作人", operator]
      scope_sheet.add_row ["记录数", records.count.to_s]

      data_sheet = p.workbook.add_worksheet(name: "数据")
      headers = model_klass.export_columns
      data_sheet.add_row headers

      header_style = data_sheet.styles.add_style(bg_color: "4472C4", fg_color: "FFFFFF", b: true)
      data_sheet.rows.first&.cells&.each { |cell| cell.style = header_style }

      records.each do |record|
        data_sheet.add_row record.to_export_row
      end
    end.serialize(temp_path.to_s)

    temp_path.to_s
  end
end
