class WorkOrderReminderJob < ApplicationJob
  queue_as :default

  def perform
    upcoming_work_orders = WorkOrder.active
                                     .where.not(due_date: nil)
                                     .where(due_date: (Time.current..24.hours.from_now))

    upcoming_work_orders.each do |work_order|
      if work_order.assigned_to
        WorkOrderMailer.with(work_order: work_order, user: work_order.assigned_to).reminder_email.deliver_later if defined?(WorkOrderMailer)
      end
    end
  end
end
