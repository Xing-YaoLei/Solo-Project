class CreateTrainingPrescriptions < ActiveRecord::Migration[8.1]
  def change
    create_table :training_prescriptions do |t|
      t.references :assessment_record, null: false, foreign_key: true
      t.references :rule, null: false, foreign_key: { to_table: :prescription_rules }
      t.references :therapist, null: false, foreign_key: { to_table: :users }
      t.jsonb :plan_detail
      t.date :start_date
      t.date :end_date
      t.string :status, default: 'pending'

      t.timestamps
    end
  end
end
