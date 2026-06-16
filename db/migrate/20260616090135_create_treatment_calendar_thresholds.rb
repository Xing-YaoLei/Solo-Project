class CreateTreatmentCalendarThresholds < ActiveRecord::Migration[8.1]
  def change
    create_table :treatment_calendar_thresholds do |t|
      t.references :area, null: false, foreign_key: true
      t.integer :max_daily_treatments, default: 20
      t.integer :min_interval_minutes, default: 30
      t.jsonb :time_slots

      t.timestamps
    end
  end
end
