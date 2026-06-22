module ApplicationHelper
  def page_title
    base = I18n.t("app.name", default: "合规审计结算台")
    content_for(:page_title) ? "#{content_for(:page_title)} - #{base}" : base
  end

  def title(page_title)
    content_for(:page_title, page_title)
  end

  def breadcrumbs
    @breadcrumbs || []
  end

  def add_breadcrumb(name, path = nil)
    @breadcrumbs ||= []
    @breadcrumbs << { name: name, path: path }
  end

  def status_badge(status, type: :default)
    colors = {
      draft: "bg-slate-100 text-slate-700",
      pending_materials: "bg-yellow-100 text-yellow-700",
      in_progress: "bg-blue-100 text-blue-700",
      pending_evidence: "bg-orange-100 text-orange-700",
      pending_checklist: "bg-cyan-100 text-cyan-700",
      pending_notification: "bg-purple-100 text-purple-700",
      pending_approval: "bg-pink-100 text-pink-700",
      approved: "bg-green-100 text-green-700",
      archived: "bg-slate-100 text-slate-600",
      rejected: "bg-red-100 text-red-700",
      open: "bg-red-100 text-red-700",
      assigned: "bg-orange-100 text-orange-700",
      resolved: "bg-green-100 text-green-700",
      closed: "bg-slate-100 text-slate-600",
      active: "bg-green-100 text-green-700",
      inactive: "bg-slate-100 text-slate-500",
      pending: "bg-yellow-100 text-yellow-700",
      approved_m: "bg-green-100 text-green-700",
      expired: "bg-red-100 text-red-700",
      critical: "bg-red-600 text-white",
      high: "bg-orange-500 text-white",
      medium: "bg-yellow-500 text-white",
      low: "bg-blue-500 text-white",
      processing: "bg-blue-100 text-blue-700",
      completed: "bg-green-100 text-green-700",
      failed: "bg-red-100 text-red-700"
    }

    labels = {
      draft: "草稿",
      pending_materials: "待收集材料",
      in_progress: "进行中",
      pending_evidence: "待补充证据",
      pending_checklist: "待核对清单",
      pending_notification: "待生成通报",
      pending_approval: "待审批",
      approved: "已通过",
      archived: "已归档",
      rejected: "已驳回",
      open: "待处理",
      assigned: "已分派",
      resolved: "已解决",
      closed: "已关闭",
      active: "生效中",
      inactive: "已停用",
      pending: "待审核",
      approved_m: "已通过",
      expired: "已过期",
      critical: "紧急",
      high: "高",
      medium: "中",
      low: "低",
      processing: "处理中",
      completed: "已完成",
      failed: "失败"
    }

    color = colors[status.to_s.to_sym] || "bg-slate-100 text-slate-600"
    label = labels[status.to_s.to_sym] || status.to_s.humanize

    content_tag(:span, label, class: "badge #{color}")
  end

  def severity_badge(severity)
    status_badge(severity, type: :severity)
  end

  def icon(name, options = {})
    size = options[:size] || 16
    class_names = ["w-#{size} h-#{size}", options[:class]].compact.join(" ")
    content_tag(:i, "", data: { lucide: name }, class: class_names, **options.except(:size, :class))
  end

  def format_datetime(datetime)
    return "-" if datetime.blank?
    I18n.l(datetime, format: :short)
  end

  def format_date(date)
    return "-" if date.blank?
    I18n.l(date.to_date, format: :default)
  end

  def format_money(amount, currency = "CNY")
    return "-" if amount.blank?
    number_to_currency(amount, unit: "¥", precision: 2)
  end

  def progress_bar(percent, options = {})
    color = options[:color] || "bg-blue-600"
    height = options[:height] || "h-2"
    content_tag(:div, class: "w-full bg-slate-200 rounded-full #{height} overflow-hidden") do
      content_tag(:div, "", class: "#{height} #{color} rounded-full transition-all duration-300", style: "width: #{[percent, 100].min}%")
    end
  end

  def empty_state(message, options = {})
    icon = options[:icon] || "inbox"
    render partial: "shared/empty_state", locals: { message: message, icon: icon, **options }
  end
end
