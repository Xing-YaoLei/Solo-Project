class PaginationComponent < ViewComponent::Base
  def initialize(pagy:, collection: nil, param_name: :page)
    @pagy = pagy
    @collection = collection
    @param_name = param_name
  end

  def total_pages
    @pagy.pages
  end

  def current_page
    @pagy.page
  end

  def previous_page
    @pagy.prev
  end

  def next_page
    @pagy.next
  end

  def total_count
    @pagy.count
  end

  def from
    @pagy.from
  end

  def to
    @pagy.to
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
