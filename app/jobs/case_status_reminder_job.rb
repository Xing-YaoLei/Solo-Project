class CaseStatusReminderJob < ApplicationJob
  queue_as :default

  def perform
    LegalCase.material_missing.find_each do |c|
      puts "Reminder: Case ##{c.id} '#{c.title}' is waiting for materials"
    end

    LegalCase.review_required.find_each do |c|
      puts "Reminder: Case ##{c.id} '#{c.title}' requires review"
    end
  end
end
