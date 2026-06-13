class ConsoleController < ApplicationController
  before_action :require_user

  def index
    @q = PickupOrder.active.ransack(params[:q])
    @pickup_orders = @q.result.includes(:operator, :reviewer, :pickup_items)
                           .order(created_at: :desc)
                           .page(params[:page])
                           .per(20)

    @stats = {
      pending: PickupOrder.active.where(status: 'pending').count,
      submitted: PickupOrder.active.where(status: 'submitted').count,
      processing: PickupOrder.active.where(status: 'processing').count,
      materials_missing: PickupOrder.active.where(status: 'materials_missing').count,
      reviewing: PickupOrder.active.where(status: 'reviewing').count,
      completed: PickupOrder.where(status: 'completed').where('created_at >= ?', Date.today).count,
      shortage: PickupOrder.active.with_shortage.count
    }
  end
end
