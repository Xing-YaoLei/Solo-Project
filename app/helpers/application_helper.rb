module ApplicationHelper
  def rule_type_label(rule)
    case rule.rule_type
    when "percentage_discount"
      "百分比折扣"
    when "fixed_discount"
      "固定金额优惠"
    when "fixed_price"
      "固定价格"
    when "markup"
      "加价"
    else
      rule.rule_type
    end
  end

  def rule_value_label(rule)
    case rule.rule_type
    when "percentage_discount"
      "#{rule.value}%"
    when "fixed_discount", "fixed_price", "markup"
      "¥#{number_with_precision(rule.value, precision: 2)}"
    else
      rule.value
    end
  end

  def order_status_label(order)
    case order.status
    when "pending"
      "待确认"
    when "confirmed"
      "已确认"
    when "checked_in"
      "已入住"
    when "completed"
      "已完成"
    when "cancelled"
      "已取消"
    else
      order.status
    end
  end

  def channel_status_label(channel)
    channel.active? ? "启用" : "禁用"
  end

  def redemption_status_label(record)
    case record.status
    when "pending"
      "待核销"
    when "redeemed"
      "已核销"
    when "expired"
      "已过期"
    else
      record.status
    end
  end

  def direction_label(communication)
    case communication.direction
    when "incoming"
      "客户来电"
    when "outgoing"
      "我方呼出"
    when "internal"
      "内部备注"
    else
      communication.direction
    end
  end

  def resolution_label(review)
    case review.resolution
    when "pending"
      "待处理"
    when "refund"
      "退款处理"
    when "upgrade"
      "升级套餐"
    when "alternative"
      "安排替代方案"
    when "resolved"
      "已解决"
    when "rejected"
      "驳回"
    else
      review.resolution
    end
  end

  def communication_type_label(comm)
    case comm.communication_type
    when "note"
      "备注"
    when "phone"
      "电话"
    when "email"
      "邮件"
    when "sms"
      "短信"
    when "wechat"
      "微信"
    else
      comm.communication_type
    end
  end
end
