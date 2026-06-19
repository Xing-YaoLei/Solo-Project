class SearchController < ApplicationController
  def index
    @query = params[:q]
    @results = []

    if @query.present?
      @heat_points = HeatPoint.where("name LIKE ?", "%#{@query}%").limit(10)
      @guide_contents = GuideContent.where("title LIKE ?", "%#{@query}%").limit(10)
      @performances = Performance.where("name LIKE ?", "%#{@query}%").limit(10)
      @merchant_contracts = MerchantContract.where("merchant_name LIKE ? OR contract_number LIKE ?", "%#{@query}%", "%#{@query}%").limit(10)
      @processing_records = ProcessingRecord.where("action_type LIKE ? OR notes LIKE ?", "%#{@query}%", "%#{@query}%").limit(10)
      @todos = Todo.where("title LIKE ?", "%#{@query}%").limit(10)
    end
  end
end
