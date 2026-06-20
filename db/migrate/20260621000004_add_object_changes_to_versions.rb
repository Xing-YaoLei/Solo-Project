class AddObjectChangesToVersions < ActiveRecord::Migration[8.1]
  def change
    add_column :versions, :object_changes, :text, limit: 1_073_741_823
  end
end
