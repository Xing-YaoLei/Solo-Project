class CreateBenefitRules < ActiveRecord::Migration[7.2]
  def change
    create_table :benefit_rules do |t|
      t.string :name, null: false
      t.string :rule_type
      t.string :target_member_level
      t.jsonb :conditions, default: {}
      t.jsonb :benefits, default: {}
      t.boolean :is_active, default: true
      t.date :effective_date
      t.date :expiry_date
      t.references :creator, foreign_key: { to_table: :users }
      t.text :description
      t.timestamps
    end
  end
end
