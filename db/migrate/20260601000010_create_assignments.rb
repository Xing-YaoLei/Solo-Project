class CreateAssignments < ActiveRecord::Migration[7.2]
  def change
    create_table :assignments do |t|
      t.string :title, null: false
      t.references :community, foreign_key: true
      t.references :creator, foreign_key: { to_table: :users }
      t.text :description
      t.date :due_date
      t.decimal :total_score, precision: 5, scale: 2
      t.boolean :enable_plagiarism_check, default: true
      t.float :plagiarism_threshold, default: 30.0
      t.text :requirements
      t.timestamps
    end
  end
end
