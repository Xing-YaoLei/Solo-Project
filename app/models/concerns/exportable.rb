module Exportable
  extend ActiveSupport::Concern

  class_methods do
    def data_scope_description
      "取数口径：#{name} 表，#{export_scope_description}"
    end

    def export_scope_description
      "全量数据"
    end

    def export_columns
      column_names - %w[created_at updated_at]
    end

    def export_scope
      all
    end
  end

  def to_export_row
    self.class.export_columns.map { |col| send(col) }
  end
end
