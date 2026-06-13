class CreateReminderRules < ActiveRecord::Migration[7.2]
  def change
    create_table :reminder_rules do |t|
      t.references :course_consumption, null: false, foreign_key: true
      t.string :rule_type, null: false
      t.integer :threshold_value
      t.string :threshold_unit
      t.string :notification_method, default: "system"
      t.text :message_template
      t.boolean :enabled, default: true
      t.datetime :last_triggered_at
      t.timestamps
    end
  end
end
