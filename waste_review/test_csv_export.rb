puts '=== Testing CSV Export ==='
puts ''

controller = WasteReportsController.new
controller.params = ActionController::Parameters.new({})

reports = WasteReport.order(report_date: :desc).limit(5)
csv_data = controller.send(:generate_csv, reports, {})
lines = csv_data.split("\n")

puts "Total lines: #{lines.size}"
puts ''

puts 'First 15 lines (取数口径说明):'
puts '=' * 80
lines.first(15).each_with_index do |line, i|
  puts sprintf("%2d: %s", i + 1, line.force_encoding('UTF-8'))
end
puts '=' * 80
puts ''

puts 'Header line:'
puts lines.find { |l| l.include?('报损单号') }
puts ''

puts 'First data row:'
data_rows = lines.select { |l| l.match?(/^\d+,/) }
if data_rows.first
  puts data_rows.first
end
puts ''

puts '=== CSV Export test passed! ==='
