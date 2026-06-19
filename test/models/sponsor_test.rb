require "test_helper"

class SponsorTest < ActiveSupport::TestCase
  setup do
    @sponsor = Sponsor.new(
      name: "测试赞助商",
      contact_person: "张三",
      contact_phone: "010-12345678",
      contact_email: "test@example.com",
      address: "北京市朝阳区"
    )
  end

  test "should be valid" do
    assert @sponsor.valid?
  end

  test "name should be present" do
    @sponsor.name = ""
    assert_not @sponsor.valid?
  end

  test "default status should be prospective" do
    @sponsor.save!
    assert @sponsor.prospective?
  end

  test "should transition from prospective to active" do
    @sponsor.save!
    assert @sponsor.may_activate?
    @sponsor.activate!
    assert @sponsor.active?
  end
end

class SponsorshipTest < ActiveSupport::TestCase
  setup do
    @performance = Performance.create!(
      name: "测试演出",
      start_time: 7.days.from_now,
      end_time: 7.days.from_now + 2.hours,
      venue: "测试场馆"
    )
    @sponsor = Sponsor.create!(
      name: "测试赞助商",
      contact_person: "张三",
      contact_phone: "010-12345678"
    )
    @sponsorship = @sponsor.sponsorships.new(
      performance: @performance,
      amount: 100000,
      sponsorship_type: :co_sponsor,
      benefits: "广告展示",
      start_date: Date.current,
      end_date: 30.days.from_now
    )
  end

  test "should be valid" do
    assert @sponsorship.valid?
  end

  test "amount should be non-negative" do
    @sponsorship.amount = -1
    assert_not @sponsorship.valid?
  end

  test "default status should be pending" do
    @sponsorship.save!
    assert @sponsorship.pending?
  end
end
