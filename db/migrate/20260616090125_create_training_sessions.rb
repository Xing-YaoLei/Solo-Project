class CreateTrainingSessions < ActiveRecord::Migration[8.1]
  def change
    create_table :training_sessions do |t|
      t.references :prescription, null: false, foreign_key: { to_table: :training_prescriptions }
      t.references :equipment, null: false
      t.date :session_date
      t.integer :planned_duration, default: 0
      t.integer :actual_duration, default: 0
      t.string :status, default: 'planned'

      t.timestamps
    end
  end
end
