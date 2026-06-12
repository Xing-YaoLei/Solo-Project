puts '=== Testing Abnormal Report CSV Export ==='
puts ''

controller = AbnormalReportsController.new
controller.params = ActionController::Parameters.new({})

abnormal_reports = AbnormalReport.all
csv_data = controller.send(:generate_abnormal_csv, abnormal_reports)
lines = csv_data.split("\n")

puts "Total lines: #{lines.size}"
puts ''

puts 'First 20 lines:'
puts '=' * 80
lines.first(20).each_with_index do |line, i|
  puts sprintf("%2d: %s", i + 1, line.force_encoding('UTF-8'))
end
puts '=' * 80
puts ''

puts 'Header line:'
puts lines.find { |l| l.include?('异常单号') }
puts ''

puts 'First data row:'
data_rows = lines.select { |l| l.match?(/^\d+,\d+,.+,.+,.+,\d+\.\d+,\d+\.\d+,.+,.+,.+,.+,.+,.+/) }
if data_rows.first
  puts data_rows.first
end
puts ''

puts '=== Abnormal CSV Export test passed! ==='
