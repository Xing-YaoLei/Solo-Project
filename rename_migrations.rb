require "fileutils"

mapping = {
  "20260619174622_create_users.rb" => "20260620000001_create_users.rb",
  "20260619174638_create_properties.rb" => "20260620000002_create_properties.rb",
  "20260619174646_create_room_statuses.rb" => "20260620000003_create_room_statuses.rb",
  "20260619174623_create_guests.rb" => "20260620000004_create_guests.rb",
  "20260619174631_create_channel_orders.rb" => "20260620000005_create_channel_orders.rb",
  "20260619174640_create_check_in_documents.rb" => "20260620000006_create_check_in_documents.rb",
  "20260619174621_create_document_change_logs.rb" => "20260620000007_create_document_change_logs.rb",
  "20260619174619_create_cleaning_tasks.rb" => "20260620000008_create_cleaning_tasks.rb",
  "20260619174624_create_room_conflicts.rb" => "20260620000009_create_room_conflicts.rb",
  "20260619174632_create_conflict_actions.rb" => "20260620000010_create_conflict_actions.rb",
  "20260619174629_create_monthly_reports.rb" => "20260620000011_create_monthly_reports.rb",
  "20260619174639_create_report_downloads.rb" => "20260620000012_create_report_downloads.rb"
}

Dir.chdir(File.join(__dir__, "db/migrate")) do
  mapping.each do |old_name, new_name|
    if File.exist?(old_name)
      FileUtils.mv(old_name, new_name)
      puts "OK: #{old_name} -> #{new_name}"
    else
      puts "SKIP: #{old_name} not found"
    end
  end
end
