class CleaningScheduleJob < ApplicationJob
  queue_as :default

  def perform(property_id, check_out_str)
    property = Property.find_by(id: property_id)
    return unless property

    task_date = Date.parse(check_out_str)
    cleaners = User.where(role: "cleaner")
    assignee = cleaners.first

    CleaningTask.create!(
      property: property,
      task_date: task_date,
      status: "pending",
      priority: "high",
      assignee: assignee,
      note: "退房清洁任务，自动生成"
    )
  end
end
