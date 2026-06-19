class ExportWorker
  include Sidekiq::Worker

  def perform(export_id)
    export = Export.find(export_id)
    export.processing!

    begin
      data = generate_export_data(export)
      file_path = create_excel_file(export, data)

      export.file.attach(
        io: File.open(file_path),
        filename: "#{export.export_type}_#{export.id}.xlsx",
        content_type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      )

      export.completed!
      File.delete(file_path) if File.exist?(file_path)
    rescue => e
      export.failed!
      Rails.logger.error("Export failed: #{e.message}")
    end
  end

  private

  def generate_export_data(export)
    case export.export_type
    when "heat_points"
      HeatPoint.all
    when "guide_contents"
      GuideContent.all
    when "performances"
      Performance.all
    when "merchant_contracts"
      MerchantContract.all
    when "processing_records"
      ProcessingRecord.all
    when "secondary_consumptions"
      SecondaryConsumption.all
    when "todos"
      Todo.all
    else
      []
    end
  end

  def create_excel_file(export, data)
    p = Axlsx::Package.new
    wb = p.workbook

    wb.add_worksheet(name: export.display_name) do |sheet|
      if data.any?
        sheet.add_row data.first.attributes.keys
        data.each do |record|
          sheet.add_row record.attributes.values.map { |v| v.is_a?(Money) ? v.to_f : v }
        end
      end
    end

    file_path = Rails.root.join("tmp", "export_#{export.id}.xlsx")
    p.serialize(file_path.to_s)
    file_path.to_s
  end
end
end
