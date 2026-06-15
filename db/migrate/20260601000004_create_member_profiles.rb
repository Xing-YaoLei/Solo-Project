class CreateMemberProfiles < ActiveRecord::Migration[7.2]
  def change
    create_table :member_profiles do |t|
      t.references :student, null: false, foreign_key: true
      t.string :member_level, default: "basic"
      t.date :membership_start_date
      t.date :membership_end_date
      t.integer :total_points, default: 0
      t.integer :available_points, default: 0
      t.string :payment_status, default: "unpaid"
      t.decimal :total_amount, precision: 10, scale: 2, default: 0
      t.text :benefits_overview
      t.timestamps
    end
  end
end
