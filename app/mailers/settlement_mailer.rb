class SettlementMailer < ApplicationMailer
  def denial_notification(notification)
    @notification = notification
    @settlement = notification.settlement
    @user = notification.user

    mail(
      to: @user.email,
      subject: "医保结算被驳回 - 患者 #{@settlement.patient.name}"
    )
  end
end
