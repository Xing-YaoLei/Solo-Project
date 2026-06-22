class AuditsController < ApplicationController
  before_action :set_audit, only: [
    :show, :edit, :update, :transition, :evidence, :checklist,
    :update_checklist, :destroy_evidence, :generate_notification, :export
  ]

  def index
    authorize Audit

    add_breadcrumb "审计工作台", audits_path
    @page_title = "审计项目列表 | 合规审计结算台"

    @q = policy_scope(Audit).ransack(params[:q])
    @audits = @q.result
      .includes(:supplier, :creator, :exception_orders)
      .order(created_at: :desc)
      .page(params[:page])
      .per(20)

    @status_counts = policy_scope(Audit).group(:status).count
  end

  def show
    authorize @audit

    add_breadcrumb "审计工作台", audits_path
    add_breadcrumb @audit.title, audit_path(@audit)
    @page_title = "#{@audit.title} | 审计详情"

    load_audit_details
  end

  def new
    authorize Audit
    @audit = Audit.new
    @audit.start_at = Date.today
    @audit.end_at = 14.days.from_now.to_date

    if params[:supplier_id].present?
      @audit.supplier_id = params[:supplier_id]
      supplier = Supplier.find_by(id: params[:supplier_id])
      @audit.title = "#{supplier&.name} - 常规审计 #{Date.today.strftime('%Y年%m月')}" if supplier
    end

    @suppliers = policy_scope(Supplier).active.order(:name)
    @templates = NotificationTemplate.active.order(:name)

    add_breadcrumb "审计工作台", audits_path
    add_breadcrumb "新建审计", nil
    @page_title = "新建审计项目"
  end

  def create
    authorize Audit

    @audit = Audit.new(audit_params)
    @audit.creator = current_user

    if @audit.save
      redirect_to @audit, notice: "审计项目创建成功，点击「推进流程」开始审计工作"
    else
      @suppliers = policy_scope(Supplier).active.order(:name)
      @templates = NotificationTemplate.active.order(:name)
      render :new, status: :unprocessable_entity
    end
  end

  def edit
    authorize @audit

    @suppliers = policy_scope(Supplier).order(:name)
    @templates = NotificationTemplate.order(:name)

    add_breadcrumb "审计工作台", audits_path
    add_breadcrumb @audit.title, audit_path(@audit)
    add_breadcrumb "编辑", nil
    @page_title = "编辑审计 - #{@audit.title}"
  end

  def update
    authorize @audit

    if @audit.update(audit_params)
      redirect_to @audit, notice: "审计项目更新成功"
    else
      @suppliers = policy_scope(Supplier).order(:name)
      @templates = NotificationTemplate.order(:name)
      render :edit, status: :unprocessable_entity
    end
  end

  def transition
    authorize @audit, :transition?

    target_state = params[:target_state]
    remark = params[:remark]
    rejection_reason = params[:rejection_reason]

    service = AuditTransitionService.call(
      @audit,
      current_user,
      target_state,
      remark: remark,
      rejection_reason: rejection_reason,
      notify: true
    )

    respond_to do |format|
      if service.success?
        format.html do
          redirect_to @audit, notice: "状态变更成功：#{status_text(target_state)}"
        end
        format.turbo_stream do
          load_audit_details
          render turbo_stream: build_transition_success_streams("状态变更成功：#{status_text(target_state)}")
        end
      else
        message = service.errors.map { |e| e[:message] }.join("，")
        format.html { redirect_to @audit, alert: message }
        format.turbo_stream do
          render turbo_stream: render_turbo_flash(alert: message)
        end
      end
    end
  end

  def evidence
    authorize @audit, :upload_evidence?

    evidence_params = params.require(:evidence_attachment).permit(
      :name, :evidence_type, :description, :file
    )
    @evidence = @audit.evidence_attachments.new(evidence_params)
    @evidence.uploader = current_user
    @evidence.file_type = @evidence.file&.content_type

    respond_to do |format|
      if @evidence.save
        detection_service = EvidenceMissingDetectionService.call(@audit, auto_create_exception: false)
        @detection_result = detection_service.success? ? detection_service.result : nil
        @audit.reload

        format.html do
          redirect_to @audit, notice: "证据附件上传成功"
        end
        format.turbo_stream do
          render turbo_stream: [
            turbo_stream.replace("evidence_list", partial: "audits/evidence_list", locals: { audit: @audit, evidence_attachments: @audit.evidence_attachments.order(created_at: :desc) }),
            turbo_stream.replace("evidence_count", partial: "audits/evidence_count", locals: { audit: @audit }),
            turbo_stream.replace("evidence_completeness", partial: "audits/evidence_completeness", locals: { audit: @audit, detection: @detection_result }),
            *render_turbo_flash(notice: "证据附件上传成功")
          ]
        end
      else
        message = @evidence.errors.full_messages.join("，")
        format.html do
          redirect_to @audit, alert: "上传失败：#{message}"
        end
        format.turbo_stream do
          render turbo_stream: render_turbo_flash(alert: "上传失败：#{message}")
        end
      end
    end
  end

  def checklist
    authorize @audit, :manage_checklist?

    add_breadcrumb "审计工作台", audits_path
    add_breadcrumb @audit.title, audit_path(@audit)
    add_breadcrumb "检查清单", nil

    @checklist_items = @audit.checklist_items.by_sort_order
  end

  def update_checklist
    authorize @audit, :manage_checklist?

    checklist_params.each do |item_id, attrs|
      item = @audit.checklist_items.find_by(id: item_id)
      next unless item

      status = attrs[:status] || item.status
      remark = attrs[:remark]

      case status
      when "completed" then item.mark_completed(current_user, remark)
      when "rejected" then item.mark_rejected(current_user, remark)
      when "not_applicable" then item.mark_not_applicable(current_user, remark)
      else item.reset(current_user)
      end
    end

    respond_to do |format|
      format.html do
        redirect_to checklist_audit_path(@audit), notice: "检查清单已更新"
      end
      format.turbo_stream do
        detection = EvidenceMissingDetectionService.call(@audit, auto_create_exception: false)
        render turbo_stream: [
          turbo_stream.replace("checklist_progress", partial: "audits/checklist_progress", locals: { audit: @audit.reload }),
          turbo_stream.replace("evidence_completeness", partial: "audits/evidence_completeness", locals: { audit: @audit.reload, detection: detection }),
          *render_turbo_flash(notice: "检查清单已更新")
        ]
      end
    end
  end

  def destroy_evidence
    authorize @audit, :upload_evidence?

    evidence = @audit.evidence_attachments.find(params[:evidence_id])
    evidence.destroy

    respond_to do |format|
      format.html { redirect_to @audit, notice: "证据附件已删除" }
      format.turbo_stream do
        render turbo_stream: [
          turbo_stream.remove(dom_id(evidence)),
          turbo_stream.replace("evidence_count", partial: "audits/evidence_count", locals: { audit: @audit.reload }),
          *render_turbo_flash(notice: "证据附件已删除")
        ]
      end
    end
  end

  def generate_notification
    authorize @audit, :generate_notification?

    if @audit.template.present?
      content = @audit.generate_notification
      @audit.update!(notification_content: content, notification_generated_at: Time.current)
      redirect_to @audit, notice: "通报内容已生成，请核对后发送"
    else
      redirect_to @audit, alert: "请先选择通报模板"
    end
  end

  def export
    authorize @audit, :export?

    respond_to do |format|
      format.xlsx do
        service = ReportExportService.call(
          current_user,
          export_type: "full_audit_record",
          supplier_ids: [@audit.supplier_id],
          start_date: @audit.created_at.to_date,
          end_date: Date.today
        )

        if service.success?
          export_record = service.result
          ReportExportJob.perform_now(export_record.id)
          if export_record.reload.completed? && export_record.file_url
            redirect_to export_record.file_url, allow_other_host: true, notice: "导出成功"
          else
            redirect_to @audit, alert: "导出文件生成中，请稍后在「报告导出」页面下载"
          end
        else
          redirect_to @audit, alert: service.errors.map { |e| e[:message] }.join("，")
        end
      end
    end
  end

  def search
    authorize Audit, :search?

    keyword = params[:keyword].to_s.strip
    scope = if keyword.present?
              policy_scope(Audit).where("title ILIKE ?", "%#{keyword}%")
            else
              Audit.none
            end

    @audits = scope.includes(:supplier).limit(10)

    respond_to do |format|
      format.json do
        render json: @audits.map { |a| { id: a.id, title: a.title, supplier: a.supplier&.name, status: a.status } }
      end
    end
  end

  private

  def set_audit
    @audit = Audit.find(params[:id])
  end

  def load_audit_details
    @evidence_attachments = @audit.evidence_attachments.order(created_at: :desc)
    @checklist_items = @audit.checklist_items.by_sort_order
    @exception_orders = @audit.exception_orders.includes(:handler).order(created_at: :desc)
    @transition_logs = @audit.state_transition_logs.includes(:operator).order(created_at: :asc)
    @available_transitions = @audit.available_transitions
    @evidence_detection = EvidenceMissingDetectionService.call(@audit, auto_create_exception: false)
    @evidence_detection_result = @evidence_detection.success? ? @evidence_detection.result : nil
  end

  def audit_params
    params.require(:audit).permit(
      :title, :audit_type, :supplier_id, :template_id,
      :start_at, :end_at, :conclusion, :status
    )
  end

  def checklist_params
    params.permit(checklist_items: [:status, :remark])
      .require(:checklist_items)
      .to_unsafe_h
  end

  def status_text(state)
    I18n.t("audit_statuses.#{state}", default: state.to_s.humanize)
  end

  def build_transition_success_streams(notice_message)
    streams = []
    streams << turbo_stream.replace("audit_status_card", partial: "audits/status_card", locals: { audit: @audit })
    streams << turbo_stream.replace("status_progress_bar", partial: "audits/status_progress", locals: { audit: @audit })
    streams << turbo_stream.replace("action_buttons", partial: "audits/action_buttons", locals: { audit: @audit })
    streams << turbo_stream.replace("transition_timeline", partial: "shared/transition_timeline", locals: { logs: @transition_logs })
    streams += render_turbo_flash(notice: notice_message)
    streams
  end
end
