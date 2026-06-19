class CheckInDocumentsController < ApplicationController
  before_action :set_check_in_document, only: %i[show edit update destroy]

  def index
    @check_in_documents = CheckInDocument.all.order(created_at: :desc)
  end

  def show
    @document_change_logs = @check_in_document.document_change_logs.order(created_at: :desc)
  end

  def new
    @check_in_document = CheckInDocument.new
  end

  def create
    @check_in_document = CheckInDocument.new(check_in_document_params)

    if @check_in_document.save
      redirect_to @check_in_document, notice: "入住登记单已创建"
    else
      render :new, status: :unprocessable_entity
    end
  end

  def edit; end

  def update
    if @check_in_document.update(check_in_document_params)
      redirect_to @check_in_document, notice: "入住登记单已更新"
    else
      render :edit, status: :unprocessable_entity
    end
  end

  def destroy
    @check_in_document.destroy
    redirect_to check_in_documents_path, notice: "入住登记单已删除"
  end

  private

  def set_check_in_document
    @check_in_document = CheckInDocument.find(params[:id])
  end

  def check_in_document_params
    params.require(:check_in_document).permit(
      :channel_order_id,
      :guest_id,
      :id_type,
      :id_number,
      :name,
      :gender,
      :nationality
    )
  end
end
