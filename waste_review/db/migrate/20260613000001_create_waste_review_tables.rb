class CreateWasteReviewTables < ActiveRecord::Migration[8.0]
  def change
    create_table :stores do |t|
      t.string :name, null: false
      t.string :code, null: false
      t.string :region
      t.boolean :active, default: true

      t.timestamps
    end

    add_index :stores, :name, unique: true
    add_index :stores, :code, unique: true

    create_table :waste_reports do |t|
      t.references :store, null: false, foreign_key: true
      t.date :report_date, null: false
      t.integer :status, default: 0
      t.decimal :total_cost, precision: 12, scale: 2, default: 0
      t.decimal :waste_rate, precision: 5, scale: 2, default: 0
      t.string :reporter, null: false
      t.text :notes

      t.timestamps
    end

    create_table :waste_items do |t|
      t.references :waste_report, null: false, foreign_key: true
      t.string :product_name, null: false
      t.string :product_sku
      t.integer :quantity, null: false
      t.string :unit
      t.decimal :unit_cost, precision: 10, scale: 2, null: false
      t.decimal :subtotal, precision: 12, scale: 2
      t.string :waste_reason, null: false
      t.string :category

      t.timestamps
    end

    create_table :review_opinions do |t|
      t.references :waste_report, null: false, foreign_key: true
      t.string :reviewer, null: false
      t.text :opinion
      t.integer :result, default: 0

      t.timestamp :created_at
    end

    create_table :cost_entries do |t|
      t.references :waste_report, null: false, foreign_key: true
      t.references :responsible_store, foreign_key: { to_table: :stores }
      t.decimal :amount, precision: 12, scale: 2
      t.integer :cost_type, default: 0
      t.text :note

      t.timestamps
    end

    create_table :status_logs do |t|
      t.references :waste_report, null: false, foreign_key: true
      t.integer :from_status
      t.integer :to_status
      t.string :operator
      t.text :note

      t.timestamp :created_at
    end

    create_table :abnormal_reports do |t|
      t.references :waste_report, null: false, foreign_key: true
      t.integer :severity, default: 0
      t.text :impact_scope
      t.text :responsibility_attribution
      t.text :handling_result
      t.boolean :resolved, default: false
      t.datetime :resolved_at

      t.timestamp :created_at
    end
  end
end
