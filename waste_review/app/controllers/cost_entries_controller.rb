class CostEntriesController < ApplicationController
  def create
    @waste_report = WasteReport.find(params[:waste_report_id])
    @cost_entry = @waste_report.cost_entries.build(cost_entry_params)
    if @cost_entry.save
      @waste_report.recalculate_totals!
      redirect_to @waste_report, notice: "成本条目已添加"
    else
      redirect_to @waste_report, alert: "成本条目添加失败"
    end
  end

  def destroy
    @cost_entry = CostEntry.find(params[:id])
    @waste_report = @cost_entry.waste_report
    @cost_entry.destroy!
    @waste_report.recalculate_totals!
    redirect_to @waste_report, notice: "成本条目已删除"
  end

  private

  def cost_entry_params
    params.require(:cost_entry).permit(:amount, :cost_type, :responsible_store_id, :note)
  end
end
