class LegalCasesController < ApplicationController
  before_action :set_legal_case, only: [:show, :edit, :update, :destroy,
                                      :submit, :start_processing, :request_materials,
                                      :materials_received, :escalate_review,
                                      :review_approved, :complete, :close, :reopen]

  def index
    redirect_to dashboard_path
  end

  def show
    @case_stages = @legal_case.case_stages.ordered
    @evidence_attachments = @legal_case.evidence_attachments.order(created_at: :desc)
    @follow_ups = @legal_case.follow_ups
    @review_records = @legal_case.review_records
    @status_transitions = @legal_case.status_transitions.ordered

    @new_stage = @legal_case.case_stages.new
    @new_evidence = @legal_case.evidence_attachments.new
    @new_follow_up = @legal_case.follow_ups.new(follow_date: Time.current)
    @new_review = @legal_case.review_records.new(review_date: Time.current)
  end

  def new
    @legal_case = LegalCase.new
    @legal_case.build_client if params[:client_id].blank?
    @clients = Client.all.order(name: :asc)
  end

  def edit
    @clients = Client.all.order(name: :asc)
  end

  def create
    @legal_case = LegalCase.new(legal_case_params)
    @legal_case.status ||= :draft

    if params[:client_id].present?
      @legal_case.client_id = params[:client_id]
    elsif params[:legal_case][:client_attributes].present?
      client = Client.find_or_create_by(phone: params[:legal_case][:client_attributes][:phone]) do |c|
      c.assign_attributes(params[:legal_case][:client_attributes].permit(:name, :phone, :id_number, :email, :address, :source_channel, :contact_person, :notes))
      end
      @legal_case.client = client
    end

    if @legal_case.save
      if @legal_case.draft? && params[:commit] == "提交"
        @legal_case.submit!
      end
      redirect_to case_path(@legal_case), notice: "案件创建成功"
    else
      @clients = Client.all.order(name: :asc)
      render :new, status: :unprocessable_entity
    end
  end

  def update
    if @legal_case.update(legal_case_params)
      redirect_to case_path(@legal_case), notice: "案件更新成功"
    else
      @clients = Client.all.order(name: :asc)
      render :edit, status: :unprocessable_entity
    end
  end

  def destroy
    @legal_case.destroy
    redirect_to dashboard_path, notice: "案件已删除"
  end

  [:submit, :start_processing, :materials_received, :review_approved, :complete, :close, :reopen].each do |action|
    define_method(action) do
      @legal_case.send("#{action}!")
      redirect_to case_path(@legal_case), notice: "状态已更新"
    end
  end

  def request_materials
    @legal_case.request_materials!(reason: params[:reason])
    redirect_to case_path(@legal_case), notice: "已要求补资料"
  end

  def escalate_review
    @legal_case.escalate_review!(reason: params[:reason])
    redirect_to case_path(@legal_case), notice: "已升级复核"
  end

  private

  def set_legal_case
    @legal_case = LegalCase.find(params[:id])
  end

  def legal_case_params
    params.require(:legal_case).permit(
      :title, :case_number, :category, :status, :responsible_person,
      :accept_date, :close_date, :amount, :description, :source_channel,
      :material_missing, :missing_details, :client_id,
      client_attributes: [:name, :phone, :id_number, :email, :address, :source_channel, :contact_person, :notes]
    )
  end
end
