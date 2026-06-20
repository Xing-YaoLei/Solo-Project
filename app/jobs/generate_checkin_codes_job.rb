class GenerateCheckinCodesJob < ApplicationJob
  queue_as :default

  def perform(performance_id)
    performance = Performance.find(performance_id)
    tickets = Ticket.joins(:ticket_type).where(ticket_types: { performance_id: performance_id }, status: %i[reserved issued])

    tickets.find_each do |ticket|
      next if ticket.checkin_code.present?
      ticket.generate_checkin_code!
    end
  end
end
