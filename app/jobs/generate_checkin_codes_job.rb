class GenerateCheckinCodesJob < ApplicationJob
  queue_as :default

  def perform(performance_id)
    performance = Performance.find(performance_id)
    tickets = Ticket.joins(:ticket_type).where(ticket_types: { performance_id: performance_id }, status: :issued)

    tickets.find_each do |ticket|
      ticket.generate_checkin_code!
    end
  end
end
