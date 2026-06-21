module Cs
  class DocumentsController < BaseController
    def index
      authorize Settlement, :export?

      @q = policy_scope(Settlement).ransack(params[:q])
      @settlements = @q.result.includes(:merchant, :discrepancies)
                        .recent.page(params[:page])

      @sensitive_fields = sensitive_fields_for(:cs)
    end

    def show
      @settlement = policy_scope(Settlement).find(params[:id])
      authorize @settlement, :show?

      @sensitive_fields = sensitive_fields_for(:cs)
    end

    def export
      authorize Settlement, :export?

      @q = policy_scope(Settlement).ransack(params[:q])
      @settlements = @q.result.includes(:merchant, :discrepancies, :settlement_items)

      respond_to do |format|
        format.xlsx do
          workbook = RubyXL::Workbook.new
          worksheet = workbook[0]
          worksheet.sheet_name = "结算单列表"

          headers = [ "周期", "商户", "系统金额", "商户金额", "差异金额", "状态", "付款日期", "处理人", "备注" ]
          headers.each_with_index do |header, index|
            worksheet.add_cell(0, index, header)
            worksheet[0][index].change_fill("cccccc")
            worksheet[0][index].change_font_bold(true)
          end

          @settlements.each_with_index do |settlement, row_idx|
            row = row_idx + 1
            worksheet.add_cell(row, 0, settlement.period)
            worksheet.add_cell(row, 1, settlement.merchant&.name)
            worksheet.add_cell(row, 2, settlement.system_amount)
            worksheet.add_cell(row, 3, settlement.merchant_amount)
            worksheet.add_cell(row, 4, settlement.difference_amount)
            worksheet.add_cell(row, 5, I18n.t("enums.settlement.status.#{settlement.status}"))
            worksheet.add_cell(row, 6, settlement.payment_date&.to_s)
            worksheet.add_cell(row, 7, settlement.handler&.name)
            worksheet.add_cell(row, 8, settlement.remarks)
          end

          filename = "settlements_#{Time.now.strftime('%Y%m%d%H%M%S')}.xlsx"
          send_data workbook.stream.read, filename: filename, type: "application/xlsx"
        end
      end
    end
  end
end
