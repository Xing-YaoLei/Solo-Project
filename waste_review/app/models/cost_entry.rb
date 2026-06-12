class CostEntry < ApplicationRecord
  belongs_to :waste_report
  belongs_to :responsible_store, class_name: 'Store', optional: true

  enum :cost_type, { material: 0, labor: 1, disposal: 2 }
end
