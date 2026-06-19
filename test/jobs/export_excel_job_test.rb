require "test_helper"

class ExportExcelJobTest < ActiveJob::TestCase
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
      payment_method: :wechat,
      status: :paid,
      paid_at: Time.current
    )
    @order.tickets.create!(ticket_type: @ticket_type, seat: @seat, status: :issued)
  end

  test "should export orders to excel file" do
    file_path = ExportExcelJob.perform_now("orders", {})

    assert File.exist?(file_path)
    assert_match /orders_\d+\.xlsx$/, file_path
    assert File.size(file_path) > 0

    File.delete(file_path) if File.exist?(file_path)
  end

  test "should include scope description in export" do
    file_path = ExportExcelJob.perform_now("orders", {})

    assert File.exist?(file_path)

    content = File.binread(file_path)
    assert content.present?

    File.delete(file_path) if File.exist?(file_path)
  end

  test "should export with status filter" do
    cancelled_order = Order.create!(
      customer_name: "李四",
      customer_phone: "13900139000",
      total_amount: 200,
      payment_method: :alipay,
      status: :cancelled
    )

    file_path = ExportExcelJob.perform_now("orders", { status: "cancelled" })

    assert File.exist?(file_path)
    assert_match /orders_\d+\.xlsx$/, file_path

    File.delete(file_path) if File.exist?(file_path)
  end

  test "should export exception records" do
    seat2 = @performance.seats.create!(row: "1", seat_number: "2", section: "A")
    ticket = @order.tickets.create!(ticket_type: @ticket_type, seat: seat2, status: :issued)
    @order.exception_records.create!(
      exception_type: :refund_dispute,
      ticket: ticket,
      title: "测试异常",
      description: "测试描述",
      impact_scope: "测试影响"
    )

    file_path = ExportExcelJob.perform_now("exception_records", {})

    assert File.exist?(file_path)
    assert_match /exception_records_\d+\.xlsx$/, file_path

    File.delete(file_path) if File.exist?(file_path)
  end

  test "should include operator in export" do
    file_path = ExportExcelJob.perform_now("orders", {}, "测试操作员")

    assert File.exist?(file_path)

    File.delete(file_path) if File.exist?(file_path)
  end

  test "data_scope_description should include correct information" do
    assert_includes Order.data_scope_description, "取数口径"
    assert_includes Order.data_scope_description, "Order 表"
    assert_includes ExceptionRecord.data_scope_description, "影响范围"
    assert_includes ExceptionRecord.data_scope_description, "责任人"
    assert_includes ExceptionRecord.data_scope_description, "关闭结论"
  end

  test "export_columns should exclude timestamps" do
    columns = Order.export_columns
    assert_not_includes columns, "created_at"
    assert_not_includes columns, "updated_at"
  end
end
