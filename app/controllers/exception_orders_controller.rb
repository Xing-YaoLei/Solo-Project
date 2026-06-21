class ExceptionOrdersController < ApplicationController
  before_action :set_exception_order, only: %i[show edit update start_processing resolve close reopen]

  def index
    @q = ExceptionOrder.ransack(params[:q])
    @pagy, @exception_orders = pagy(@q.result.order(created_at: :desc))
  end

  def show; end

  def edit; end

  def update
    if @exception_order.update(exception_order_params)
      redirect_to @exception_order, notice: '异常单已更新'
    else
      render :edit, status: :unprocessable_entity
    end
  end

  def start_processing
    if @exception_order.may_start_processing?
      @exception_order.start_processing!
      @exception_order.update(handler: current_user)
      redirect_to @exception_order, notice: '已开始处理'
    else
      redirect_to @exception_order, alert: '操作失败'
    end
  end

  def resolve
    if @exception_order.may_resolve?
      @exception_order.resolve!
      redirect_to @exception_order, notice: '已解决'
    else
      redirect_to @exception_order, alert: '操作失败'
    end
  end

  def close
    if @exception_order.may_close?
      @exception_order.close!
      redirect_to @exception_order, notice: '已关闭'
    else
      redirect_to @exception_order, alert: '操作失败'
    end
  end

  def reopen
    if @exception_order.may_reopen?
      @exception_order.reopen!
      redirect_to @exception_order, notice: '已重新打开'
    else
      redirect_to @exception_order, alert: '操作失败'
    end
  end

  private

  def set_exception_order
    @exception_order = ExceptionOrder.find(params[:id])
  end

  def exception_order_params
    params.require(:exception_order).permit(:impact_scope, :responsibility, :handling_result, :handler_id)
  end
end
