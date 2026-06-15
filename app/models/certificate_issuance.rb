class CertificateIssuance < ApplicationRecord
  enum :status, { issued: 0, revoked: 1 }

  belongs_to :certificate
  belongs_to :enrollment
  belongs_to :user

  validates :certificate_id, presence: true
  validates :enrollment_id, presence: true
  validates :user_id, presence: true
  validates :certificate_no, presence: true, uniqueness: true

  scope :valid, -> { where(status: :issued) }
  scope :by_user, ->(user) { where(user: user) }

  def revoke!
    return if revoked?
    update(status: :revoked)
  end

  def valid?
    status == "issued"
  end
end
