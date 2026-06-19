require "test_helper"

class PerformanceTest < ActiveSupport::TestCase
  setup do
    @performance = Performance.new(
      name: "测试演出",
      start_time: 7.days.from_now,
      end_time: 7.days.from_now + 2.hours,
      venue: "测试场馆",
      total_seats: 100
    )
  end

  test "should be valid" do
    assert @performance.valid?
  end

  test "name should be present" do
    @performance.name = ""
    assert_not @performance.valid?
  end

  test "start_time should be present" do
    @performance.start_time = nil
    assert_not @performance.valid?
  end

  test "end_time should be after start_time" do
    @performance.end_time = @performance.start_time - 1.hour
    assert_not @performance.valid?
  end

  test "default status should be draft" do
    assert @performance.draft?
  end

  test "should transition from draft to published" do
    @performance.save!
    assert @performance.may_publish?
    @performance.publish!
    assert @performance.published?
  end

  test "should transition from published to ongoing" do
    @performance.save!
    @performance.publish!
    assert @performance.may_start?
    @performance.start!
    assert @performance.ongoing?
  end

  test "should transition from ongoing to finished" do
    @performance.save!
    @performance.publish!
    @performance.start!
    assert @performance.may_finish?
    @performance.finish!
    assert @performance.finished?
  end

  test "should cancel from draft" do
    @performance.save!
    assert @performance.may_cancel?
    @performance.cancel!
    assert @performance.cancelled?
  end

  test "should calculate occupancy rate" do
    @performance.save!
    50.times do |i|
      @performance.seats.create!(
        row: "1",
        seat_number: i.to_s,
        section: "A",
        status: i < 30 ? :occupied : :available
      )
    end
    assert_equal 60.0, @performance.occupancy_rate
  end

  test "seat_map_data should group by section and row" do
    @performance.save!
    @performance.seats.create!(row: "1", seat_number: "1", section: "A")
    @performance.seats.create!(row: "1", seat_number: "2", section: "A")
    @performance.seats.create!(row: "2", seat_number: "1", section: "A")
    @performance.seats.create!(row: "1", seat_number: "1", section: "B")

    data = @performance.seat_map_data
    assert_includes data.keys, "A"
    assert_includes data.keys, "B"
    assert_includes data["A"].keys, "1"
    assert_equal 2, data["A"]["1"].size
  end

  test "should log status transitions" do
    @performance.save!
    assert_difference "StatusLog.count", 1 do
      @performance.publish!
    end

    log = StatusLog.last
    assert_equal "publish", log.event
    assert_equal "draft", log.from_state
    assert_equal "published", log.to_state
  end

  test "export_scope_description should return correct message" do
    assert_equal "按演出状态筛选，默认全部", Performance.export_scope_description
  end
end
