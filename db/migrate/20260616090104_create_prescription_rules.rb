class CreatePrescriptionRules < ActiveRecord::Migration[8.1]
  def change
    create_table :prescription_rules do |t|
      t.string :name
      t.text :trigger_condition
      t.jsonb :training_plan
      t.boolean :active, default: true

      t.timestamps
    end
  end
end
