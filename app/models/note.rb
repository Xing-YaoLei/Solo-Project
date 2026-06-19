class Note < ApplicationRecord
  belongs_to :work_order
  belongs_to :author, class_name: 'User', optional: true
end
