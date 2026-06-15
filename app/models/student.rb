class Student < ApplicationRecord
  STATUSES = %w[active inactive suspended graduated].freeze
  GENDERS = %w[male female other].freeze

  belongs_to :community, optional: true
  has_one :member_profile, dependent: :destroy
  has_many :redemption_records, dependent: :destroy
  has_many :refund_records, dependent: :destroy
  has_many :exam_results, dependent: :destroy
  has_many :assignment_submissions, dependent: :destroy
  has_many :plagiarism_logs, dependent: :destroy

  validates :name, presence: true
  validates :status, inclusion: { in: STATUSES }
  validates :gender, inclusion: { in: GENDERS }, allow_nil: true

  scope :active, -> { where(status: "active") }
  scope :by_community, ->(community_id) { where(community_id: community_id) if community_id.present? }

  after_create :create_default_member_profile

  private

  def create_default_member_profile
    create_member_profile(
      membership_start_date: Date.current,
      membership_end_date: 1.year.from_now
    )
  end
end
