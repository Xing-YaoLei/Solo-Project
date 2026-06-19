require "test_helper"

class GenerateCheckinCodesJobTest < ActiveJob::TestCase
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
    @seat1 = @performance.seats.create!(row: "1", seat_number: "1", section: "A")
    @seat2 = @performance.seats.create!(row: "1", seat_number: "2", section: "A")
    @seat3 = @performance.seats.create!(row: "1", seat_number: "3", section: "A")

    @order1 = Order.create!(customer_name: "张三", customer_phone: "13800138000", total_amount: 100, payment_method: :wechat)
    @order2 = Order.create!(customer_name: "李四", customer_phone: "13900139000", total_amount: 100, payment_method: :alipay)

    @ticket1 = @order1.tickets.create!(ticket_type: @ticket_type, seat: @seat1, status: :issued)
    @ticket2 = @order1.tickets.create!(ticket_type: @ticket_type, seat: @seat2, status: :issued)
    @ticket3 = @order2.tickets.create!(ticket_type: @ticket_type, seat: @seat3, status: :reserved)
  end

  test "should generate checkin codes for issued tickets" do
    assert_difference "CheckinCode.count", 2 do
      GenerateCheckinCodesJob.perform_now(@performance.id)
    end

    assert_not_nil @ticket1.reload.checkin_code
    assert_not_nil @ticket2.reload.checkin_code
    assert_nil @ticket3.reload.checkin_code
  end

  test "should not regenerate existing active checkin codes" do
    @ticket1.generate_checkin_code!
    old_code = @ticket1.checkin_code.code

    assert_difference "CheckinCode.count", 1 do
      GenerateCheckinCodesJob.perform_now(@performance.id)
    end

    assert_equal old_code, @ticket1.reload.checkin_code.code
  end

  test "generated codes should have correct attributes" do
    GenerateCheckinCodesJob.perform_now(@performance.id)

    @ticket1.checkin_code.tap do |code|
      assert code.active?
      assert_equal @performance.end_time, code.expires_at
      assert_includes code.qr_code_data, @ticket1.ticket_no
      assert_includes code.qr_code_data, @performance.name
    end
  end
end
