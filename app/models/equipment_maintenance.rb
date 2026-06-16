class EquipmentMaintenance < ApplicationRecord
  belongs_to :equipment
  belongs_to :performer, class_name: 'User'
end
