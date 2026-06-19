require "test_helper"

class ExceptionRecordTest < ActiveSupport::TestCase
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
    @exception_record = ExceptionRecord.new(
      order: @order,
      ticket: @ticket,
      exception_type: :refund_dispute,
      title: "测试异常单",
      description: "测试异常描述",
      impact_scope: "影响1张票"
    )
  end

  test "should be valid" do
    assert @exception_record.valid?
  end

  test "title should be present" do
    @exception_record.title = ""
    assert_not @exception_record.valid?
  end

  test "exception_type should be present" do
    @exception_record.exception_type = nil
    assert_not @exception_record.valid?
  end

  test "impact_scope should be present" do
    @exception_record.impact_scope = ""
    assert_not @exception_record.valid?
  end

  test "description should be present" do
    @exception_record.description = ""
    assert_not @exception_record.valid?
  end

  test "default status should be open" do
    assert @exception_record.open?
  end

  test "should transition from open to assigned" do
    @exception_record.save!
    @exception_record.assignee = "处理人"
    assert @exception_record.may_assign?
    @exception_record.assign!
    assert @exception_record.assigned?
  end

  test "should transition from assigned to resolving" do
    @exception_record.save!
    @exception_record.assignee = "处理人"
    @exception_record.assign!
    assert @exception_record.may_start_resolve?
    @exception_record.start_resolve!
    assert @exception_record.resolving?
  end

  test "should transition from resolving to closed" do
    @exception_record.save!
    @exception_record.assignee = "处理人"
    @exception_record.assign!
    @exception_record.start_resolve!
    @exception_record.resolution = "已处理"
    @exception_record.conclusion = "已完成"
    assert @exception_record.may_resolve?
    @exception_record.resolve!
    assert @exception_record.closed?
    assert_not_nil @exception_record.closed_at
  end

  test "should close from any state" do
    @exception_record.save!
    assert @exception_record.may_close?
    @exception_record.close!
    assert @exception_record.closed?
    assert_not_nil @exception_record.closed_at
  end

  test "assign should set responsible_person if not set" do
    @exception_record.save!
    @exception_record.assignee = "测试人"
    @exception_record.assign!
    assert_equal "测试人", @exception_record.responsible_person
  end

  test "should log status transitions" do
    @exception_record.save!
    assert_difference "StatusLog.count", 1 do
      @exception_record.assignee = "测试人"
      @exception_record.assign!
    end

    log = StatusLog.last
    assert_equal "assign", log.event
    assert_equal "open", log.from_state
    assert_equal "assigned", log.to_state
  end

  test "export_scope_description should be correct" do
    assert_includes ExceptionRecord.export_scope_description, "影响范围"
    assert_includes ExceptionRecord.export_scope_description, "责任人"
    assert_includes ExceptionRecord.export_scope_description, "关闭结论"
  end
end
