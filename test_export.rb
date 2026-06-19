begin
  user = User.first
  export = user.exports.create!(export_type: 'heat_points')
  puts "Created export ##{export.id}"
  ExportWorker.new.perform(export.id)
  export.reload
  puts "Status: #{export.status}"
  puts "Attached: #{export.file.attached?}"
  puts "Filename: #{export.file.filename}" if export.file.attached?
rescue => e
  puts "ERROR: #{e.class} - #{e.message}"
  puts e.backtrace.first(20).join("\n")
end
