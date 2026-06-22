class ExceptionOrdersController < ApplicationController
  before_action :set_exception_order, only: [
    :show, :edit, :update, :assign, :resolve, :close
  ]
  before_action :set_audit, only: [:new, :create]

  def index
    authorize ExceptionOrder

    add_breadcrumb "异常单中心", exception_orders_path
    @page_title = "异常单列表 | 合规审计结算台"

    @q = policy_scope(ExceptionOrder).ransack(params[:q])
    @exception_orders = @q.result
      .includes(audit: [:supplier], handler: [])
      .order(created_at: :desc)
      .page(params[:page])
      .per(20)

    @status_counts = policy_scope(ExceptionOrder).group(:status).count
    @severity_counts = policy_scope(ExceptionOrder).group(:severity).count
  end

  def show
    authorize @exception_order

    add_breadcrumb "异常单中心", exception_orders_path
    add_breadcrumb @exception_order.title, exception_order_path(@exception_order)
    @page_title = "#{@exception_order.title} | 异常单详情"

    @transition_logs = @exception_order.state_transition_logs.includes(:operator).order(created_at: :asc)
    @audit = @exception_order.audit
    @handler_options = available_handlers
  end

  def new
    authorize ExceptionOrder
    @exception_order = ExceptionOrder.new
    @exception_order.audit = @audit

    if params[:missing_items].present?
      @missing_items = parse_missing_items(params[:missing_items])
      @exception_order.title = "#{@audit.title} 证据缺失异常" if @audit
      @exception_order.severity = params[:severity] || :medium
    end

    add_breadcrumb "异常单中心", exception_orders_path
    add_breadcrumb "新建异常单", nil
    @page_title = "新建异常单"
  end

  def create
    authorize ExceptionOrder

    missing_items = parse_missing_items(params[:exception_order][:missing_items_raw])
    handler_id = params[:exception_order][:handler_id]

    if @audit
      service = ExceptionOrderGenerationService.call(
        @audit,
        missing_items,
        current_user,
        title: params[:exception_order][:title],
        severity: params[:exception_order][:severity],
        handler_id: handler_id.presence,
        auto_generated: false
      )

      if service.success?
        @exception_order = service.result
        if params[:exception_order][:impact_scope].present?
          @exception_order.update(impact_scope: params[:exception_order][:impact_scope])
        end
        if params[:exception_order][:responsibility].present?
          @exception_order.update(responsibility: params[:exception_order][:responsibility])
        end
        redirect_to @exception_order, notice: "异常单创建成功"
      else
        @exception_order = ExceptionOrder.new(exception_order_params)
        render :new, status: :unprocessable_entity, alert: service.errors.map { |e| e[:message] }.join("，")
      end
    else
      @exception_order = ExceptionOrder.new(exception_order_params)
      if @exception_order.save
        redirect_to @exception_order, notice: "异常单创建成功"
      else
        render :new, status: :unprocessable_entity
      end
    end
  end

  def edit
    authorize @exception_order

    @audit = @exception_order.audit
    @handler_options = available_handlers

    add_breadcrumb "异常单中心", exception_orders_path
    add_breadcrumb @exception_order.title, exception_order_path(@exception_order)
    add_breadcrumb "编辑", nil
  end

  def update
    authorize @exception_order

    if @exception_order.update(exception_order_params)
      redirect_to @exception_order, notice: "异常单更新成功"
    else
      @audit = @exception_order.audit
      @handler_options = available_handlers
      render :edit, status: :unprocessable_entity
    end
  end

  def assign
    authorize @exception_order, :assign?

    handler = User.find_by(id: params[:handler_id])
    remark = params[:remark]

    if handler.nil?
      return redirect_back fallback_location: @exception_order, alert: "请选择处理人"
    end

    result = @exception_order.assign_to(handler, remark)

    respond_to do |format|
      if result
        format.html do
          redirect_to @exception_order, notice: "已将异常单分派给 #{handler.name}"
        end
        format.turbo_stream do
          streams = [
            turbo_stream.invoke("modal", "closeAll", selector: "[data-controller='modal']"),
            turbo_stream.replace("exception_status_card", partial: "exception_orders/status_card", locals: { exception_order: @exception_order.reload }),
            turbo_stream.replace("handler_info", partial: "exception_orders/handler_info", locals: { exception_order: @exception_order.reload }),
            turbo_stream.replace("transition_timeline", partial: "shared/transition_timeline",
                                 locals: { logs: @exception_order.state_transition_logs.includes(:operator).order(created_at: :asc) })
          ]
          streams += render_turbo_flash(notice: "已将异常单分派给 #{handler.name}")
          render turbo_stream: streams
        end
      else
        message = "分派失败：当前状态不支持分派操作"
        format.html { redirect_back fallback_location: @exception_order, alert: message }
        format.turbo_stream { render turbo_stream: render_turbo_flash(alert: message) }
      end
    end
  end

  def resolve
    authorize @exception_order, :resolve?

    conclusion = params[:conclusion]
    remark = params[:remark]

    if conclusion.blank?
      return redirect_back fallback_location: @exception_order, alert: "请填写处理结论"
    end

    result = @exception_order.resolve(current_user, conclusion, remark)

    respond_to do |format|
      if result
        NotificationJob.perform_later(
          :exception_resolved,
          exception_order_id: @exception_order.id,
          resolver_id: current_user.id
        )

        format.html { redirect_to @exception_order, notice: "异常单已标记为已解决" }
        format.turbo_stream do
          streams = [
            turbo_stream.invoke("modal", "closeAll", selector: "[data-controller='modal']"),
            turbo_stream.replace("exception_status_card", partial: "exception_orders/status_card", locals: { exception_order: @exception_order.reload }),
            turbo_stream.replace("conclusion_section", partial: "exception_orders/conclusion", locals: { exception_order: @exception_order.reload }),
            turbo_stream.replace("transition_timeline", partial: "shared/transition_timeline",
                                 locals: { logs: @exception_order.state_transition_logs.includes(:operator).order(created_at: :asc) })
          ]
          streams += render_turbo_flash(notice: "异常单已标记为已解决")
          render turbo_stream: streams
        end
      else
        message = "操作失败：当前状态不支持解决操作"
        format.html { redirect_back fallback_location: @exception_order, alert: message }
        format.turbo_stream { render turbo_stream: render_turbo_flash(alert: message) }
      end
    end
  end

  def close
    authorize @exception_order, :close?

    remark = params[:remark]
    result = @exception_order.close(current_user, remark)

    respond_to do |format|
      if result
        format.html { redirect_to @exception_order, notice: "异常单已关闭" }
        format.turbo_stream do
          streams = [
            turbo_stream.replace("exception_status_card", partial: "exception_orders/status_card", locals: { exception_order: @exception_order.reload }),
            turbo_stream.replace("transition_timeline", partial: "shared/transition_timeline",
                                 locals: { logs: @exception_order.state_transition_logs.includes(:operator).order(created_at: :asc) })
          ]
          streams += render_turbo_flash(notice: "异常单已关闭")
          render turbo_stream: streams
        end
      else
        message = "操作失败：当前状态不支持关闭操作"
        format.html { redirect_back fallback_location: @exception_order, alert: message }
        format.turbo_stream { render turbo_stream: render_turbo_flash(alert: message) }
      end
    end
  end

  private

  def set_exception_order
    @exception_order = ExceptionOrder.find(params[:id])
  end

  def set_audit
    @audit = Audit.find_by(id: params[:audit_id])
  end

  def exception_order_params
    params.require(:exception_order).permit(
      :title, :severity, :status, :audit_id,
      :impact_scope, :responsibility, :conclusion,
      :due_at, :handler_id
    )
  end

  def parse_missing_items(raw)
    return [] if raw.blank?
    begin
      JSON.parse(raw.to_s)
    rescue JSON::ParserError
      []
    end
  end

  def available_handlers
    User.active.where(role: %i[auditor supervisor admin]).order(:name).pluck(:name, :id)
  end
end
