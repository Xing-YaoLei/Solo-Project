require "test_helper"

class OrderTest < ActiveSupport::TestCase
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
    @order = Order.new(
      customer_name: "张三",
      customer_phone: "13800138000",
      total_amount: 100,
      payment_method: :wechat
    )
  end

  test "should be valid" do
    assert @order.valid?
  end

  test "customer_name should be present" do
    @order.customer_name = ""
    assert_not @order.valid?
  end

  test "customer_phone should be present" do
    @order.customer_phone = ""
    assert_not @order.valid?
  end

  test "should generate order_no on create" do
    @order.save!
    assert_not_nil @order.order_no
    assert_match /^ORD/, @order.order_no
  end

  test "default status should be pending" do
    assert @order.pending?
  end

  test "should transition from pending to paid" do
    @order.save!
    assert @order.may_pay?
    @order.pay!
    assert @order.paid?
    assert_not_nil @order.paid_at
  end

  test "should transition from paid to confirmed" do
    @order.save!
    @order.pay!
    assert @order.may_confirm?
    @order.confirm!
    assert @order.confirmed?
  end

  test "should transition from paid to refunded" do
    @order.save!
    @order.pay!
    assert @order.may_refund?
    @order.refund!
    assert @order.refunded?
    assert_not_nil @order.refunded_at
  end

  test "should cancel pending order" do
    @order.save!
    assert @order.may_cancel?
    @order.cancel!
    assert @order.cancelled?
  end

  test "should create exception record" do
    @order.save!
    ticket = @order.tickets.create!(ticket_type: @ticket_type, seat: @seat, status: :issued)
    assert_difference "ExceptionRecord.count", 1 do
      @order.create_exception_record!(
        description: "测试异常",
        impact_scope: "测试影响范围",
        responsible_person: "测试人"
      )
    end

    exception = ExceptionRecord.last
    assert_equal "refund_dispute", exception.exception_type
    assert_equal "测试异常", exception.description
    assert_equal "测试影响范围", exception.impact_scope
  end

  test "refund with checked in ticket should create exception" do
    @order.save!
    @order.pay!
    ticket = @order.tickets.create!(
      ticket_type: @ticket_type,
      seat: @seat,
      status: :reserved
    )
    ticket.issue!
    ticket.checkin!

    assert_difference "ExceptionRecord.count", 1 do
      @order.refund!
    end

    exception = ExceptionRecord.last
    assert_match /已签到票/, exception.title
    assert_equal "refund_dispute", exception.exception_type
  end

  test "performance should return associated performance" do
    @order.save!
    @order.tickets.create!(ticket_type: @ticket_type, seat: @seat, status: :issued)
    assert_equal @performance, @order.performance
  end

  test "should log status transitions" do
    @order.save!
    assert_difference "StatusLog.count", 1 do
      @order.pay!
    end

    log = StatusLog.last
    assert_equal "pay", log.event
    assert_equal "pending", log.from_state
    assert_equal "paid", log.to_state
  end
end
