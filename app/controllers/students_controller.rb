class StudentsController < ApplicationController
  before_action :set_student, only: [:show, :edit, :update, :destroy]

  def index
    @students = Student.all
    @students = @students.by_community(params[:community_id])
    @students = @students.where(status: params[:status]) if params[:status].present?
    @students = @students.where("name LIKE ?", "%#{params[:keyword]}%") if params[:keyword].present?
    @students = @students.includes(:community, :member_profile).page(params[:page]).per(20)

    @communities = Community.all
  end

  def show
    @member_profile = @student.member_profile
    @redemption_records = @student.redemption_records.order(redeemed_at: :desc).limit(10)
    @refund_records = @student.refund_records.order(created_at: :desc).limit(10)
    @exam_results = @student.exam_results.includes(:exam).order(created_at: :desc).limit(10)
    @assignment_submissions = @student.assignment_submissions.includes(:assignment).order(created_at: :desc).limit(10)
    @plagiarism_logs = @student.plagiarism_logs.order(created_at: :desc).limit(10)
  end

  def new
    @student = Student.new
    @communities = Community.all
  end

  def create
    @student = Student.new(student_params)
    if @student.save
      log_operation("create", target: @student, details: "创建学员：#{@student.name}")
      redirect_to @student, notice: "学员创建成功"
    else
      @communities = Community.all
      render :new
    end
  end

  def edit
    @communities = Community.all
  end

  def update
    before_data = @student.attributes.slice("name", "phone", "email", "community_id", "status")
    if @student.update(student_params)
      after_data = @student.attributes.slice("name", "phone", "email", "community_id", "status")
      log_operation("update", target: @student, before_data: before_data, after_data: after_data, details: "更新学员信息")
      redirect_to @student, notice: "学员信息更新成功"
    else
      @communities = Community.all
      render :edit
    end
  end

  def destroy
    log_operation("delete", target: @student, details: "删除学员：#{@student.name}")
    @student.destroy
    redirect_to students_path, notice: "学员已删除"
  end

  private

  def set_student
    @student = Student.find(params[:id])
  end

  def student_params
    params.require(:student).permit(
      :name, :phone, :email, :id_number, :birthday, :gender,
      :education, :occupation, :community_id, :status, :enrollment_date, :notes
    )
  end
end
