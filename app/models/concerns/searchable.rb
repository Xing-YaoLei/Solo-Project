module Searchable
  extend ActiveSupport::Concern

  class_methods do
    def ransackable_attributes(auth_object = nil)
      searchable_columns + %w[created_at updated_at]
    end

    def ransackable_associations(auth_object = nil)
      reflect_on_all_associations.map(&:name).map(&:to_s)
    end

    def ransackable_scopes(auth_object = nil)
      []
    end

    private

    def searchable_columns
      column_names.reject do |col|
        col.end_with?("_id", "encrypted_", "token", "password")
      end
    end
  end
end
