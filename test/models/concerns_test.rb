require "test_helper"

class StatusLoggableTest < ActiveSupport::TestCase
  test "should log status transitions automatically" do
    performance = Performance.create!(
      name: "测试演出",
      start_time: 7.days.from_now,
      end_time: 7.days.from_now + 2.hours,
      venue: "测试场馆"
    )

    assert_difference "StatusLog.count", 1 do
      performance.publish!
    end

    log = StatusLog.last
    assert_equal performance, log.trackable
    assert_equal "publish", log.event
    assert_equal "draft", log.from_state
    assert_equal "published", log.to_state
    assert_equal "system", log.operator
  end

  test "should include operator and reason from Current" do
    performance = Performance.create!(
      name: "测试演出",
      start_time: 7.days.from_now,
      end_time: 7.days.from_now + 2.hours,
      venue: "测试场馆"
    )

    Current.operator = "管理员"
    Current.transition_reason = "审核通过"
    Current.transition_metadata = { note: "测试元数据" }

    performance.publish!

    log = StatusLog.last
    assert_equal "管理员", log.operator
    assert_equal "审核通过", log.reason
    assert_equal({ note: "测试元数据" }.to_json, log.metadata)
  ensure
    Current.reset
  end
end

class ExportableTest < ActiveSupport::TestCase
  test "should provide data scope description" do
    assert_includes Performance.data_scope_description, "取数口径"
    assert_includes Performance.data_scope_description, "Performance 表"
  end

  test "should have default export scope description" do
    class DummyModel < ApplicationRecord
      self.table_name = "performances"
      include Exportable
    end

    assert_equal "全量数据", DummyModel.export_scope_description
  end

  test "should return export columns excluding timestamps" do
    columns = Performance.export_columns
    assert_not_includes columns, "created_at"
    assert_not_includes columns, "updated_at"
  end

  test "to_export_row should return values for export columns" do
    performance = Performance.create!(
      name: "测试演出",
      start_time: 7.days.from_now,
      end_time: 7.days.from_now + 2.hours,
      venue: "测试场馆"
    )

    row = performance.to_export_row
    assert_equal performance.id, row[Performance.export_columns.index("id")]
    assert_equal "测试演出", row[Performance.export_columns.index("name")]
    assert_equal "测试场馆", row[Performance.export_columns.index("venue")]
  end
end
