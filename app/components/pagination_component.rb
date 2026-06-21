class PaginationComponent < ViewComponent::Base
  def initialize(collection:, param_name: :page)
    @collection = collection
    @param_name = param_name
  end

  def total_pages
    @collection.total_pages
  end

  def current_page
    @collection.current_page
  end

  def previous_page
    current_page - 1 if current_page > 1
  end

  def next_page
    current_page + 1 if current_page < total_pages
  end

  def visible_pages
    return (1..total_pages).to_a if total_pages <= 7

    pages = []
    pages << 1
    pages << nil if current_page > 4
    pages += (current_page - 2..current_page + 2).to_a.select { |p| p > 1 && p < total_pages }
    pages << nil if current_page < total_pages - 3
    pages << total_pages
    pages
  end
end
