require "test_helper"

class TicketTypeTest < ActiveSupport::TestCase
  setup do
    @performance = Performance.create!(
      name: "测试演出",
      start_time: 7.days.from_now,
      end_time: 7.days.from_now + 2.hours,
      venue: "测试场馆"
    )
    @ticket_type = @performance.ticket_types.new(
      name: "VIP票",
      price: 200,
      sale_start_time: Time.current,
      sale_end_time: 6.days.from_now,
      max_quantity: 50,
      refund_policy: :partial_refund
    )
  end

  test "should be valid" do
    assert @ticket_type.valid?
  end

  test "name should be present" do
    @ticket_type.name = ""
    assert_not @ticket_type.valid?
  end

  test "price should be present and non-negative" do
    @ticket_type.price = nil
    assert_not @ticket_type.valid?
    @ticket_type.price = -1
    assert_not @ticket_type.valid?
  end

  test "sale_end_time should be after sale_start_time" do
    @ticket_type.sale_end_time = @ticket_type.sale_start_time - 1.hour
    assert_not @ticket_type.valid?
  end

  test "default status should be inactive" do
    assert @ticket_type.inactive?
  end

  test "should transition from inactive to active" do
    @ticket_type.save!
    assert @ticket_type.may_activate?
    @ticket_type.activate!
    assert @ticket_type.active?
  end

  test "should transition from active to sold_out" do
    @ticket_type.save!
    @ticket_type.activate!
    assert @ticket_type.may_mark_sold_out?
    @ticket_type.mark_sold_out!
    assert @ticket_type.sold_out?
  end

  test "should transition from active to suspended" do
    @ticket_type.save!
    @ticket_type.activate!
    assert @ticket_type.may_suspend?
    @ticket_type.suspend!
    assert @ticket_type.suspended?
  end

  test "available_for_purchase? should check status and time" do
    @ticket_type.save!
    @ticket_type.activate!
    assert @ticket_type.available_for_purchase?

    @ticket_type.suspend!
    assert_not @ticket_type.available_for_purchase?

    @ticket_type.reactivate!
    @ticket_type.update!(sale_start_time: 1.day.from_now)
    assert_not @ticket_type.available_for_purchase?
  end

  test "sold_count should count non-cancelled tickets" do
    @ticket_type.save!
    @ticket_type.activate!
    order = Order.create!(customer_name: "张三", customer_phone: "13800138000", total_amount: 200, payment_method: :wechat)
    seat = @performance.seats.create!(row: "1", seat_number: "1", section: "A")

    order.tickets.create!(ticket_type: @ticket_type, seat: seat, status: :issued)
    order.tickets.create!(ticket_type: @ticket_type, seat: @performance.seats.create!(row: "1", seat_number: "2", section: "A"), status: :cancelled)

    assert_equal 1, @ticket_type.sold_count
  end

  test "remaining_count should calculate remaining tickets" do
    @ticket_type.save!
    order = Order.create!(customer_name: "张三", customer_phone: "13800138000", total_amount: 200, payment_method: :wechat)
    seat = @performance.seats.create!(row: "1", seat_number: "1", section: "A")
    order.tickets.create!(ticket_type: @ticket_type, seat: seat, status: :issued)

    assert_equal 49, @ticket_type.remaining_count
  end

  test "should log status transitions" do
    @ticket_type.save!
    assert_difference "StatusLog.count", 1 do
      @ticket_type.activate!
    end

    log = StatusLog.last
    assert_equal "activate", log.event
    assert_equal "inactive", log.from_state
    assert_equal "active", log.to_state
  end
end
