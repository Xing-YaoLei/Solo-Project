require "ostruct"

module Paginatable
  extend ActiveSupport::Concern

  included do
    helper_method :pagination_info
  end

  private

  def paginate(scope, per_page: 20)
    page = (params[:page] || 1).to_i
    per_page_val = (params[:per_page] || per_page).to_i
    total_count = scope.count
    total_pages = (total_count.to_f / per_page_val).ceil
    offset_val = (page - 1) * per_page_val

    @pagination = OpenStruct.new(
      page: page,
      per_page: per_page_val,
      total_count: total_count,
      total_pages: total_pages,
      next_page: page < total_pages ? page + 1 : nil,
      prev_page: page > 1 ? page - 1 : nil
    )

    scope.offset(offset_val).limit(per_page_val)
  end

  def pagination_info
    @pagination
  end
end
