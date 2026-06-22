class Templates::NotificationTemplatesController < ApplicationController
  before_action :set_template, only: [:show, :edit, :update, :destroy, :activate, :deactivate]

  def index
    authorize NotificationTemplate

    add_breadcrumb "系统配置", nil
    add_breadcrumb "通报模板管理", templates_notification_templates_path
    @page_title = "通报模板管理"

    @q = NotificationTemplate.ransack(params[:q])
    @templates = @q.result.includes(:creator).order(created_at: :desc).page(params[:page]).per(20)
  end

  def new
    authorize NotificationTemplate
    @template = NotificationTemplate.new(variables: {})

    add_breadcrumb "系统配置", nil
    add_breadcrumb "通报模板管理", templates_notification_templates_path
    add_breadcrumb "新建模板", nil
  end

  def create
    authorize NotificationTemplate

    @template = NotificationTemplate.new(template_params)
    @template.creator = current_user

    if @template.save
      redirect_to templates_notification_template_path(@template), notice: "模板创建成功"
    else
      render :new, status: :unprocessable_entity
    end
  end

  def show
    authorize @template

    add_breadcrumb "系统配置", nil
    add_breadcrumb "通报模板管理", templates_notification_templates_path
    add_breadcrumb @template.name, templates_notification_template_path(@template)

    @sample_preview = @template.render(
      supplier_name: "[供应商名称示例]",
      audit_title: "[审计项目标题示例]",
      audit_type: I18n.t("audit_types.#{@template.audit_type}", default: @template.audit_type.humanize),
      deadline: 14.days.from_now.strftime("%Y-%m-%d"),
      handler: current_user.name
    )
  end

  def edit
    authorize @template

    add_breadcrumb "系统配置", nil
    add_breadcrumb "通报模板管理", templates_notification_templates_path
    add_breadcrumb @template.name, templates_notification_template_path(@template)
    add_breadcrumb "编辑", nil
  end

  def update
    authorize @template

    if @template.update(template_params)
      redirect_to templates_notification_template_path(@template), notice: "模板更新成功"
    else
      render :edit, status: :unprocessable_entity
    end
  end

  def destroy
    authorize @template
    @template.destroy
    redirect_to templates_notification_templates_path, notice: "模板已删除"
  end

  def activate
    authorize @template, :activate?
    @template.update!(is_active: true)
    redirect_back fallback_location: templates_notification_templates_path, notice: "模板已启用"
  end

  def deactivate
    authorize @template, :deactivate?
    @template.update!(is_active: false)
    redirect_back fallback_location: templates_notification_templates_path, notice: "模板已停用"
  end

  private

  def set_template
    @template = NotificationTemplate.find(params[:id])
  end

  def template_params
    params.require(:notification_template).permit(
      :name, :audit_type, :content, :is_active,
      variables: [:supplier_name, :audit_title, :audit_type, :deadline, :handler, custom_fields: {}]
    )
  end
end
