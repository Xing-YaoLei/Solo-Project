class CreateCaseStages < ActiveRecord::Migration[8.1]
  def change
    create_table :case_stages do |t|
      t.references :legal_case, null: false, foreign_key: true
      t.string :name
      t.text :description
      t.datetime :start_date
      t.datetime :end_date
      t.string :status
      t.text :notes
      t.integer :order

      t.timestamps
    end
  end
end
