require "test_helper"

class CheckinCodeTest < ActiveSupport::TestCase
  setup do
    @performance = Performance.create!(
      name: "测试演出",
      start_time: 7.days.from_now,
      end_time: 7.days.from_now + 2.hours,
      venue: "测试场馆"
    )
    @ticket_type = @performance.ticket_types.create!(
      name: "普通票",
      price: 100,
      sale_start_time: Time.current,
      sale_end_time: 6.days.from_now
    )
    @seat = @performance.seats.create!(row: "1", seat_number: "1", section: "A")
    @order = Order.create!(
      customer_name: "张三",
      customer_phone: "13800138000",
      total_amount: 100,
      payment_method: :wechat
    )
    @ticket = @order.tickets.create!(
      ticket_type: @ticket_type,
      seat: @seat,
      status: :issued
    )
    @checkin_code = @ticket.create_checkin_code!(
      code: "TEST123",
      qr_code_data: { test: "data" }.to_json,
      expires_at: @performance.end_time
    )
  end

  test "should be valid" do
    assert @checkin_code.valid?
  end

  test "code should be unique" do
    duplicate = @checkin_code.dup
    assert_not duplicate.valid?
  end

  test "default status should be active" do
    assert @checkin_code.active?
  end

  test "should verify active code" do
    assert @checkin_code.may_verify?
    @checkin_code.verify!
    assert @checkin_code.verified?
    assert_not_nil @checkin_code.verified_at
  end

  test "should use active code" do
    assert @checkin_code.may_use?
    @checkin_code.use!
    assert @checkin_code.used?
    assert_not_nil @checkin_code.used_at
    assert @ticket.reload.checked_in?
  end

  test "use should checkin ticket" do
    @checkin_code.use!
    assert @ticket.checked_in?
    assert_not_nil @ticket.checked_in_at
  end

  test "should expire active code" do
    travel_to @performance.end_time + 1.day do
      assert @checkin_code.may_expire?
      @checkin_code.expire!
      assert @checkin_code.expired?
    end
  end

  test "expired? should return true when past expires_at" do
    @checkin_code.update!(expires_at: 1.day.ago)
    assert @checkin_code.expired?
  end

  test "expired? should return false when not expired" do
    @checkin_code.update!(expires_at: 1.day.from_now)
    assert_not @checkin_code.expired?
  end

  test "performance should return associated performance" do
    assert_equal @performance, @checkin_code.performance
  end

  test "should log status transitions" do
    assert_difference "StatusLog.count", 2 do
      @checkin_code.use!
    end

    checkin_log = StatusLog.find_by(trackable_type: "CheckinCode", trackable_id: @checkin_code.id)
    assert_equal "use", checkin_log.event
    assert_equal "active", checkin_log.from_state
    assert_equal "used", checkin_log.to_state
  end
end
