class CreateStatusTransitions < ActiveRecord::Migration[8.1]
  def change
    create_table :status_transitions do |t|
      t.references :legal_case, null: false, foreign_key: true
      t.string :from_status
      t.string :to_status
      t.text :reason
      t.string :operator

      t.timestamps
    end
  end
end
