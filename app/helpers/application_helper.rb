module ApplicationHelper
  STATUS_BG_CLASSES = {
    pending: "bg-yellow-100 text-yellow-800",
    in_progress: "bg-blue-100 text-blue-800",
    processing: "bg-blue-100 text-blue-800",
    completed: "bg-green-100 text-green-800",
    cancelled: "bg-gray-100 text-gray-800",
    active: "bg-green-100 text-green-800",
    inactive: "bg-gray-100 text-gray-800",
    draft: "bg-gray-100 text-gray-800",
    published: "bg-green-100 text-green-800",
    archived: "bg-gray-100 text-gray-800",
    scheduled: "bg-blue-100 text-blue-800",
    ongoing: "bg-green-100 text-green-800",
    sold: "bg-orange-100 text-orange-800",
    available: "bg-green-100 text-green-800",
    held: "bg-yellow-100 text-yellow-800",
    complementary: "bg-purple-100 text-purple-800",
    refunded: "bg-gray-100 text-gray-800",
    reported: "bg-red-100 text-red-800",
    resolved: "bg-green-100 text-green-800",
    closed: "bg-gray-100 text-gray-800",
    expired: "bg-red-100 text-red-800",
    terminated: "bg-gray-100 text-gray-800",
    failed: "bg-red-100 text-red-800"
  }.freeze

  STATUS_TEXT_MAP = {
    pending: "待处理",
    in_progress: "处理中",
    processing: "处理中",
    completed: "已完成",
    cancelled: "已取消",
    active: "启用",
    inactive: "停用",
    draft: "草稿",
    published: "已发布",
    archived: "已归档",
    scheduled: "待开始",
    ongoing: "进行中",
    sold: "已售出",
    available: "可售",
    held: "预留",
    complementary: "赠票",
    refunded: "已退票",
    reported: "已上报",
    resolved: "已解决",
    closed: "已关闭",
    expired: "已过期",
    terminated: "已终止",
    failed: "失败"
  }.freeze

  PRIORITY_BG_CLASSES = {
    urgent: "bg-red-500",
    high: "bg-orange-500",
    normal: "bg-blue-500",
    low: "bg-gray-500"
  }.freeze

  PRIORITY_TEXT_CLASSES = {
    urgent: "text-red-600",
    high: "text-orange-600",
    normal: "text-blue-600",
    low: "text-gray-600"
  }.freeze

  def status_bg_class(status)
    return "bg-gray-100 text-gray-800" if status.blank?

    STATUS_BG_CLASSES[status.to_sym] || "bg-gray-100 text-gray-800"
  end

  def status_text(status)
    return status.to_s.humanize if status.blank?

    STATUS_TEXT_MAP[status.to_sym] || status.to_s.humanize
  end

  def status_class(status)
    status_bg_class(status)
  end

  def priority_bg_class(priority)
    return "bg-gray-500" if priority.blank?

    PRIORITY_BG_CLASSES[priority.to_sym] || "bg-gray-500"
  end

  def priority_text_class(priority)
    return "text-gray-600" if priority.blank?

    PRIORITY_TEXT_CLASSES[priority.to_sym] || "text-gray-600"
  end

  def priority_text(priority)
    case priority.to_s
    when "urgent" then "紧急"
    when "high" then "高"
    when "normal" then "普通"
    when "low" then "低"
    else priority.to_s.humanize
    end
  end

  def heat_level_color(level)
    case level.to_i
    when 5 then "bg-red-500"
    when 4 then "bg-orange-500"
    when 3 then "bg-yellow-500"
    when 2 then "bg-green-500"
    when 1 then "bg-blue-500"
    else "bg-gray-500"
    end
  end

  def heat_level_text(level)
    "#{level} 级热度"
  end

  def format_money(money)
    if money.is_a?(Money)
      money.format(symbol: "¥", no_cents: false)
    elsif money.is_a?(Numeric)
      number_to_currency(money, unit: "¥", precision: 2)
    else
      "¥0.00"
    end
  end

  def format_currency(cents)
    number_to_currency(cents.to_i / 100.0, unit: "¥", precision: 2)
  end

  def format_date(date)
    date&.strftime("%Y-%m-%d")
  end

  def format_datetime(datetime)
    datetime&.strftime("%Y-%m-%d %H:%M")
  end
end
