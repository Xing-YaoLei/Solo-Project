class CreateSettlements < ActiveRecord::Migration[8.1]
  def change
    create_table :settlements do |t|
      t.references :patient, null: false, foreign_key: true
      t.references :assessment_record, null: false, foreign_key: true
      t.decimal :amount, default: 0
      t.string :insurance_type
      t.string :status, default: 'pending'
      t.date :submitted_at
      t.date :settled_at

      t.timestamps
    end
  end
end
