class Attachment < ApplicationRecord
  belongs_to :work_order
  belongs_to :uploaded_by, class_name: 'User', optional: true
  has_one_attached :file
end
