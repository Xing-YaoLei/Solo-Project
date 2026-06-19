require "test_helper"

class SeatTest < ActiveSupport::TestCase
  setup do
    @performance = Performance.create!(
      name: "测试演出",
      start_time: 7.days.from_now,
      end_time: 7.days.from_now + 2.hours,
      venue: "测试场馆"
    )
    @seat = @performance.seats.new(
      row: "A",
      seat_number: "1",
      section: "VIP区",
      price: 200
    )
  end

  test "should be valid" do
    assert @seat.valid?
  end

  test "row should be present" do
    @seat.row = ""
    assert_not @seat.valid?
  end

  test "seat_number should be present" do
    @seat.seat_number = ""
    assert_not @seat.valid?
  end

  test "section should be present" do
    @seat.section = ""
    assert_not @seat.valid?
  end

  test "default status should be available" do
    assert @seat.available?
  end

  test "should occupy available seat" do
    @seat.save!
    assert @seat.may_occupy?
    @seat.occupy!
    assert @seat.occupied?
  end

  test "should disable available seat" do
    @seat.save!
    assert @seat.may_disable?
    @seat.disable!
    assert @seat.disabled?
  end

  test "should release occupied seat" do
    @seat.save!
    @seat.occupy!
    assert @seat.may_release?
    @seat.release!
    assert @seat.available?
  end

  test "should reserve available seat" do
    @seat.save!
    assert @seat.may_reserve?
    @seat.reserve!
    assert @seat.reserved?
  end

  test "display_name should format correctly" do
    assert_equal "VIP区-A排1号", @seat.display_name
  end

  test "should log status transitions" do
    @seat.save!
    assert_difference "StatusLog.count", 1 do
      @seat.occupy!
    end

    log = StatusLog.last
    assert_equal "occupy", log.event
    assert_equal "available", log.from_state
    assert_equal "occupied", log.to_state
  end
end
