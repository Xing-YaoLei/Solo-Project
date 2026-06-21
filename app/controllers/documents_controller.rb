class DocumentsController < ApplicationController
  before_action :set_document, only: %i[show edit update destroy submit_for_review start_review approve reject resubmit schedule publish archive unarchive scan_risk_words history versions export]

  def index
    @q = Document.ransack(params[:q])
    @pagy, @documents = pagy(@q.result.order(created_at: :desc))
  end

  def show
    @review_opinions = @document.review_opinions.order(reviewed_at: :desc)
    @publish_schedules = @document.publish_schedules.order(planned_publish_at: :desc)
    @interaction_records = @document.interaction_records.order(created_at: :desc).limit(20)
    @risk_word_hits = @document.risk_word_hits.includes(:risk_word)
    @content_versions = @document.content_versions.ordered
    @status_histories = @document.status_histories.ordered
    @exception_orders = @document.exception_orders.order(created_at: :desc)
    @latest_review_opinion = @document.latest_review_opinion
  end

  def new
    @document = Document.new
  end

  def edit; end

  def create
    @document = Document.new(document_params)
    @document.creator = current_user
    @document.status = 'draft'

    if @document.save
      @document.record_interaction(current_user, 'create', '创建文书')
      @document.create_content_version(current_user, '初始版本')
      RiskWordScanJob.perform_later(@document.id)
      redirect_to @document, notice: '文书创建成功'
    else
      render :new, status: :unprocessable_entity
    end
  end

  def update
    old_content = @document.content
    if @document.update(document_params)
      if old_content != @document.content
        @document.create_content_version(current_user, params[:change_summary])
        @document.record_interaction(current_user, 'update', '更新内容')
        RiskWordScanJob.perform_later(@document.id)
      end
      redirect_to @document, notice: '文书更新成功'
    else
      render :edit, status: :unprocessable_entity
    end
  end

  def destroy
    @document.destroy
    redirect_to documents_url, notice: '文书已删除'
  end

  def submit_for_review
    if @document.may_submit_for_review?
      from_status = @document.status
      @document.submit_for_review!
      @document.record_status_history(current_user, from_status, @document.status, '提交审核')
      @document.record_interaction(current_user, 'submit', '提交审核')
      redirect_to @document, notice: '已提交审核'
    else
      redirect_to @document, alert: '无法提交审核'
    end
  end

  def start_review
    if @document.may_start_review?
      from_status = @document.status
      @document.start_review!
      @document.reviewer = current_user
      @document.save!
      @document.record_status_history(current_user, from_status, @document.status, '开始审核')
      @document.record_interaction(current_user, 'review_start', '开始审核')
      redirect_to @document, notice: '已开始审核'
    else
      redirect_to @document, alert: '无法开始审核'
    end
  end

  def approve
    if @document.may_approve?
      from_status = @document.status
      @document.approve!
      @document.record_status_history(current_user, from_status, @document.status, '审核通过')
      @document.record_interaction(current_user, 'review_approve', '审核通过')
      redirect_to @document, notice: '审核通过'
    else
      redirect_to @document, alert: '无法审核操作失败'
    end
  end

  def reject
    if @document.may_reject?
      from_status = @document.status
      @document.reject!
      @document.record_status_history(current_user, from_status, @document.status, '审核退回')
      @document.record_interaction(current_user, 'review_reject', '审核退回')
      create_exception_order(@document, current_user)
      redirect_to @document, notice: '已退回并生成异常单'
    else
      redirect_to @document, alert: '退回操作失败'
    end
  end

  def resubmit
    if @document.may_resubmit?
      from_status = @document.status
      @document.resubmit!
      @document.record_status_history(current_user, from_status, @document.status, '重新提交审核')
      @document.record_interaction(current_user, 'submit', '重新提交审核')
      redirect_to @document, notice: '已重新提交审核'
    else
      redirect_to @document, alert: '无法重新提交'
    end
  end

  def schedule
    if @document.may_schedule?
      from_status = @document.status
      @document.schedule!
      @document.record_status_history(current_user, from_status, @document.status, '排期发布')
      @document.record_interaction(current_user, 'schedule', '排期发布')
      redirect_to @document, notice: '已排期发布'
    else
      redirect_to @document, alert: '排期操作失败'
    end
  end

  def publish
    if @document.may_publish?
      from_status = @document.status
      @document.publish!
      if (schedule = @document.latest_publish_schedule)
        schedule.update(actual_publish_at: Time.current)
      end
      @document.record_status_history(current_user, from_status, @document.status, '已发布')
      @document.record_interaction(current_user, 'publish', '发布文书')
      redirect_to @document, notice: '已发布'
    else
      redirect_to @document, alert: '发布操作失败'
    end
  end

  def archive
    if @document.may_archive?
      from_status = @document.status
      @document.archive!
      @document.archived_at = Time.current
      @document.save!
      @document.record_status_history(current_user, from_status, @document.status, '归档')
      @document.record_interaction(current_user, 'archive', '归档文书')
      redirect_to @document, notice: '已归档'
    else
      redirect_to @document, alert: '归档操作失败'
    end
  end

  def unarchive
    if @document.may_unarchive?
      from_status = @document.status
      @document.unarchive!
      @document.archived_at = nil
      @document.save!
      @document.record_status_history(current_user, from_status, @document.status, '取消归档')
      @document.record_interaction(current_user, 'unarchive', '取消归档')
      redirect_to @document, notice: '已取消归档'
    else
      redirect_to @document, alert: '取消归档失败'
    end
  end

  def scan_risk_words
    count = @document.scan_risk_words
    @document.record_interaction(current_user, 'other', "风险词扫描，命中 #{count} 个")
    redirect_to @document, notice: "风险词扫描完成，命中 #{count} 个风险词"
  end

  def history
    @status_histories = @document.status_histories.ordered
    @interaction_records = @document.interaction_records.order(created_at: :desc)
  end

  def versions
    @content_versions = @document.content_versions.ordered
  end

  def export
    respond_to do |format|
      format.xlsx do
        response.headers['Content-Disposition'] = "attachment; filename=\"document_#{@document.id}_#{Time.current.strftime('%Y%m%d%H%M%S')}.xlsx"
      end
    end
  end

  private

  def set_document
    @document = Document.find(params[:id])
  end

  def document_params
    params.require(:document).permit(:title, :doc_type, :content, :reviewer_id)
  end

  def create_exception_order(document, reviewer)
    ExceptionOrder.create!(
      document: document,
      impact_scope: "文书「#{document.title}」审核退回，可能影响发布排期和后续归档进度",
      responsibility: "审核员：#{reviewer.name}",
      status: 'pending',
      handler: nil
    )
  end
end
