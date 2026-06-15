module ApplicationHelper
  def order_status_text(status)
    {
      "pending" => "待支付",
      "paid" => "已支付",
      "cancelled" => "已取消",
      "refunded" => "已退款",
      "partially_refunded" => "部分退款"
    }[status] || status
  end

  def order_status_class(status)
    {
      "pending" => "bg-yellow-100 text-yellow-800",
      "paid" => "bg-green-100 text-green-800",
      "cancelled" => "bg-gray-100 text-gray-800",
      "refunded" => "bg-red-100 text-red-800",
      "partially_refunded" => "bg-orange-100 text-orange-800"
    }[status] || "bg-gray-100 text-gray-800"
  end

  def enrollment_status_text(status)
    {
      "enrolled" => "已报名",
      "studying" => "学习中",
      "completed" => "已完成",
      "expired" => "已过期",
      "refunded" => "已退款"
    }[status] || status
  end

  def enrollment_status_class(status)
    {
      "enrolled" => "bg-blue-100 text-blue-800",
      "studying" => "bg-green-100 text-green-800",
      "completed" => "bg-purple-100 text-purple-800",
      "expired" => "bg-gray-100 text-gray-800",
      "refunded" => "bg-red-100 text-red-800"
    }[status] || "bg-gray-100 text-gray-800"
  end

  def settlement_status_text(status)
    {
      "draft" => "草稿",
      "calculating" => "计算中",
      "pending_review" => "待复核",
      "approved" => "已通过",
      "rejected" => "已驳回",
      "exported" => "已导出"
    }[status] || status
  end

  def settlement_status_class(status)
    {
      "draft" => "bg-gray-100 text-gray-800",
      "calculating" => "bg-yellow-100 text-yellow-800",
      "pending_review" => "bg-blue-100 text-blue-800",
      "approved" => "bg-green-100 text-green-800",
      "rejected" => "bg-red-100 text-red-800",
      "exported" => "bg-purple-100 text-purple-800"
    }[status] || "bg-gray-100 text-gray-800"
  end

  def follow_up_status_text(status)
    {
      "pending" => "待跟进",
      "contacted" => "已联系",
      "resolved" => "已解决",
      "closed" => "已关闭"
    }[status] || status
  end

  def follow_up_status_class(status)
    {
      "pending" => "bg-red-100 text-red-800",
      "contacted" => "bg-yellow-100 text-yellow-800",
      "resolved" => "bg-green-100 text-green-800",
      "closed" => "bg-gray-100 text-gray-800"
    }[status] || "bg-gray-100 text-gray-800"
  end

  def appeal_status_text(status)
    {
      "pending" => "待处理",
      "processing" => "处理中",
      "approved" => "已通过",
      "rejected" => "已驳回",
      "closed" => "已关闭"
    }[status] || status
  end

  def appeal_status_class(status)
    {
      "pending" => "bg-orange-100 text-orange-800",
      "processing" => "bg-yellow-100 text-yellow-800",
      "approved" => "bg-green-100 text-green-800",
      "rejected" => "bg-red-100 text-red-800",
      "closed" => "bg-gray-100 text-gray-800"
    }[status] || "bg-gray-100 text-gray-800"
  end

  def appeal_type_text(type)
    {
      "refund" => "退款申诉",
      "makeup_exam" => "补考申请",
      "extension" => "延期申请",
      "complaint" => "投诉",
      "other" => "其他"
    }[type] || type
  end

  def settlement_item_type_text(type)
    {
      "enrollment" => "报名",
      "course_completed" => "完课",
      "full_completion" => "完课通过",
      "refund" => "退款"
    }[type] || type
  end
end
