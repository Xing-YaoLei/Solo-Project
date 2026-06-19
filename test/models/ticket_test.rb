require "test_helper"

class TicketTest < ActiveSupport::TestCase
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
    @seat = @performance.seats.create!(row: "1", seat_number: "1", section: "A", status: :available)
    @order = Order.create!(
      customer_name: "张三",
      customer_phone: "13800138000",
      total_amount: 100,
      payment_method: :wechat
    )
    @ticket = Ticket.new(
      order: @order,
      ticket_type: @ticket_type,
      seat: @seat
    )
  end

  test "should be valid" do
    assert @ticket.valid?
  end

  test "should generate ticket_no on create" do
    @ticket.save!
    assert_not_nil @ticket.ticket_no
    assert_match /^TKT/, @ticket.ticket_no
  end

  test "default status should be reserved" do
    assert @ticket.reserved?
  end

  test "should transition from reserved to issued" do
    @ticket.save!
    assert @ticket.may_issue?
    @ticket.issue!
    assert @ticket.issued?
  end

  test "should transition from issued to checked_in" do
    @ticket.save!
    @ticket.issue!
    assert @ticket.may_checkin?
    @ticket.checkin!
    assert @ticket.checked_in?
    assert_not_nil @ticket.checked_in_at
  end

  test "should cancel reserved ticket" do
    @ticket.save!
    assert @ticket.may_cancel?
    @ticket.cancel!
    assert @ticket.cancelled?
    assert_equal "available", @seat.reload.status
  end

  test "generate_checkin_code should create checkin code" do
    @ticket.save!
    @ticket.issue!
    assert_difference "CheckinCode.count", 1 do
      @ticket.generate_checkin_code!
    end

    checkin_code = @ticket.checkin_code
    assert_not_nil checkin_code
    assert checkin_code.active?
    assert_equal @performance.end_time, checkin_code.expires_at
  end

  test "should regenerate checkin code if expired" do
    @ticket.save!
    @ticket.issue!
    @ticket.generate_checkin_code!
    old_code_value = @ticket.checkin_code.code
    old_code_id = @ticket.checkin_code.id

    @ticket.checkin_code.update!(status: :expired)

    @ticket.reload.generate_checkin_code!
    @ticket.reload

    assert_not_equal old_code_value, @ticket.checkin_code.code
    assert_not_equal old_code_id, @ticket.checkin_code.id
    assert @ticket.checkin_code.active?
  end

  test "assign_seat should occupy seat on create" do
    assert_equal "available", @seat.status
    @ticket.save!
    assert_equal "occupied", @seat.reload.status
  end

  test "should log status transitions" do
    @ticket.save!
    assert_difference "StatusLog.count", 1 do
      @ticket.issue!
    end

    log = StatusLog.last
    assert_equal "issue", log.event
    assert_equal "reserved", log.from_state
    assert_equal "issued", log.to_state
  end
end
