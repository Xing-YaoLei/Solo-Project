class PickupOrdersController < ApplicationController
  before_action :require_user
  before_action :set_pickup_order, only: [:show, :edit, :update, :submit, :start_process, :mark_missing_materials, :materials_received, :send_to_review, :complete, :reject_review, :close]
  before_action :set_ransack, only: [:index, :closed]

  def index
    scope = @q.result.includes(:operator, :reviewer, :pickup_items)
    has_status_filter = params[:q]&.key?(:status_eq) && params[:q][:status_eq].present?
    scope = scope.active unless has_status_filter || params[:all_status] == '1'
    @pickup_orders = scope.order(created_at: :desc)
                           .page(params[:page])
                           .per(20)
  end

  def closed
    scope = @q.result.includes(:operator, :reviewer, :pickup_items)
    has_status_filter = params[:q]&.key?(:status_eq) && params[:q][:status_eq].present?
    scope = scope.closed unless has_status_filter
    @pickup_orders = scope.order(created_at: :desc)
                           .page(params[:page])
                           .per(20)
    render :index
  end

  def show
    @pickup_item = @pickup_order.pickup_items.new
    @after_sales_proof = @pickup_order.after_sales_proofs.new
    @shortage_record = @pickup_order.shortage_records.new
  end

  def new
    @pickup_order = PickupOrder.new
    3.times { @pickup_order.pickup_items.new }
  end

  def edit
  end

  def create
    @pickup_order = PickupOrder.new(pickup_order_params)
    if @pickup_order.save
      @pickup_order.log_activity('create', user: current_user, details: '创建单据')
      redirect_to @pickup_order, notice: '自提核销单创建成功'
    else
      render :new, status: :unprocessable_entity
    end
  end

  def update
    if @pickup_order.update(pickup_order_params)
      @pickup_order.log_activity('update', user: current_user, details: '更新单据')
      redirect_to @pickup_order, notice: '自提核销单更新成功'
    else
      render :edit, status: :unprocessable_entity
    end
  end

  def submit
    if @pickup_order.pending?
      @pickup_order.submit!(user: current_user)
      redirect_to @pickup_order, notice: '单据已提交'
    else
      redirect_to @pickup_order, alert: '当前状态无法提交'
    end
  end

  def start_process
    if @pickup_order.submitted?
      @pickup_order.start_process!(user: current_user)
      redirect_to @pickup_order, notice: '开始处理'
    else
      redirect_to @pickup_order, alert: '当前状态无法开始处理'
    end
  end

  def mark_missing_materials
    if @pickup_order.processing?
      @pickup_order.mark_missing_materials!(user: current_user)
      redirect_to @pickup_order, notice: '已标记缺材料'
    else
      redirect_to @pickup_order, alert: '当前状态无法标记'
    end
  end

  def materials_received
    if @pickup_order.materials_missing?
      @pickup_order.materials_received!(user: current_user)
      redirect_to @pickup_order, notice: '材料已补充'
    else
      redirect_to @pickup_order, alert: '当前状态无法操作'
    end
  end

  def send_to_review
    if @pickup_order.processing?
      @pickup_order.send_to_review!(user: current_user)
      redirect_to @pickup_order, notice: '已提交复核'
    else
      redirect_to @pickup_order, alert: '当前状态无法提交复核'
    end
  end

  def complete
    if @pickup_order.reviewing?
      @pickup_order.complete!(user: current_user)
      redirect_to @pickup_order, notice: '复核通过，已完成'
    else
      redirect_to @pickup_order, alert: '当前状态无法完成'
    end
  end

  def reject_review
    if @pickup_order.reviewing?
      reason = params[:reject_reason]
      @pickup_order.reject_review!(user: current_user, reason: reason)
      redirect_to @pickup_order, notice: '复核已退回'
    else
      redirect_to @pickup_order, alert: '当前状态无法退回'
    end
  end

  def close
    if @pickup_order.completed? || @pickup_order.closed?
      @pickup_order.close!(user: current_user)
      redirect_to @pickup_order, notice: '单据已关闭'
    else
      redirect_to @pickup_order, alert: '当前状态无法关闭'
    end
  end

  def search
    pickup_order = PickupOrder.find_by(pickup_code: params[:pickup_code])
    if pickup_order
      redirect_to pickup_order
    else
      redirect_to console_path, alert: '未找到该自提码对应的单据'
    end
  end

  private

  def set_pickup_order
    @pickup_order = PickupOrder.find(params[:id])
  end

  def set_ransack
    q_params = params[:q]&.dup || {}
    if q_params[:created_at_lteq].present?
      date = q_params[:created_at_lteq].to_date rescue nil
      q_params[:created_at_lteq] = date.end_of_day if date
    end
    @q = PickupOrder.ransack(q_params)
  end

  def pickup_order_params
    params.require(:pickup_order).permit(
      :pickup_code,
      :customer_name,
      :customer_phone,
      :source,
      :notes,
      :estimated_pickup_time,
      :abnormal_reason,
      pickup_items_attributes: [:id, :product_name, :product_code, :product_tag, :expected_quantity, :actual_quantity, :unit_price, :remark, :_destroy],
      after_sales_proofs_attributes: [:id, :proof_type, :description, :document, :pickup_item_id, :_destroy]
    )
  end
end
