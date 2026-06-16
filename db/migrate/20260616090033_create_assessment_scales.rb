class CreateAssessmentScales < ActiveRecord::Migration[8.1]
  def change
    create_table :assessment_scales do |t|
      t.string :name
      t.string :category
      t.string :version, default: '1.0'
      t.boolean :active, default: true
      t.jsonb :scoring_config

      t.timestamps
    end
  end
end
