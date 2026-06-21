class InteractionRecordsController < ApplicationController
  before_action :set_document

  def create
    @interaction_record = @document.interaction_records.new(interaction_record_params)
    @interaction_record.operator = current_user

    if @interaction_record.save
      redirect_to @document, notice: '互动记录已添加'
    else
      redirect_to @document, alert: '添加失败'
    end
  end

  private

  def set_document
    @document = Document.find(params[:document_id])
  end

  def interaction_record_params
    params.require(:interaction_record).permit(:action_type, :content)
  end
end
