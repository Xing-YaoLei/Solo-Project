class EvidenceAttachmentsController < ApplicationController
  before_action :set_legal_case

  def create
    @evidence = @legal_case.evidence_attachments.new(evidence_params)
    if @evidence.save
      if params[:evidence_attachment][:file].present?
        @evidence.file.attach(params[:evidence_attachment][:file])
      end
      redirect_to case_path(@legal_case), notice: "证据已添加"
    else
      redirect_to case_path(@legal_case), alert: "证据添加失败"
    end
  end

  def upload
    @evidence = @legal_case.evidence_attachments.find(params[:id])
    if params[:file].present?
      @evidence.file.attach(params[:file])
      @evidence.update(is_missing: false)
      redirect_to case_path(@legal_case), notice: "文件已上传"
    else
      redirect_to case_path(@legal_case), alert: "请选择文件"
    end
  end

  def update
    @evidence = @legal_case.evidence_attachments.find(params[:id])
    if @evidence.update(evidence_params)
      if params[:evidence_attachment][:file].present?
        @evidence.file.attach(params[:evidence_attachment][:file])
      end
      redirect_to case_path(@legal_case), notice: "证据已更新"
    else
      redirect_to case_path(@legal_case), alert: "证据更新失败"
    end
  end

  def destroy
    @evidence = @legal_case.evidence_attachments.find(params[:id])
    @evidence.destroy
    redirect_to case_path(@legal_case), notice: "证据已删除"
  end

  private

  def set_legal_case
    @legal_case = LegalCase.find(params[:legal_case_id])
  end

  def evidence_params
    params.require(:evidence_attachment).permit(:name, :category, :description, :uploaded_by, :page_count, :is_missing, :missing_notes, :file)
  end
end
