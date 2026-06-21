class CreateStatusHistories < ActiveRecord::Migration[8.1]
  def change
    create_table :status_histories do |t|
      t.references :document, null: false, foreign_key: true
      t.string :from_status
      t.string :to_status
      t.references :operator, null: false, foreign_key: { to_table: :users }
      t.text :remark

      t.timestamps
    end
  end
end
