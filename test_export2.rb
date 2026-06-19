begin
  user = User.first
  export = user.exports.create!(export_type: 'heat_points')
  puts "Created export ##{export.id}"

  # Step by step - check get_export_data
  puts "--- get_export_data #{export.export_type} ---"
  klass = export.export_type.classify.safe_constantize
  puts "Klass: #{klass}"

  if klass
    scope = klass.all
    puts "Scope count: #{scope.count}"
    # Test create_excel_file
    p = Axlsx::Package.new
    wb = p.workbook
    wb.add_worksheet(name: export.display_name) do |sheet|
      data = scope.to_a
      puts "Data size: #{data.size}"
      if data.any?
        puts "Attrs: #{data.first.attributes.keys}"
        sheet.add_row data.first.attributes.keys
        data.each do |record|
          row = record.attributes.values.map { |v| v.is_a?(Money) ? v.to_f : v }
          sheet.add_row row
        end
      end
    end
    file_path = Rails.root.join("tmp", "export_test_#{export.id}.xlsx")
    puts "Serializing to #{file_path}..."
    p.serialize(file_path.to_s)
    puts "Serialized OK. File size: #{File.size(file_path)}"

    puts "Attaching file..."
    export.file.attach(
      io: File.open(file_path),
      filename: "#{export.export_type}_#{Time.now.strftime('%Y%m%d%H%M%S')}.xlsx",
      content_type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )
    puts "Attached: #{export.file.attached?}"
    export.status = :completed
    export.save!
    puts "Done! Status: #{export.status}"
  end
rescue => e
  puts "ERROR: #{e.class} - #{e.message}"
  puts e.backtrace.first(20).join("\n")
end
