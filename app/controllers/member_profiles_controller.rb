class MemberProfilesController < ApplicationController
  before_action :set_student
  before_action :set_member_profile, only: [:show, :edit, :update]

  def show
  end

  def new
    @member_profile = @student.build_member_profile
  end

  def create
    @member_profile = @student.build_member_profile(member_profile_params)
    if @member_profile.save
      log_operation("create", target: @member_profile, details: "为学员 #{@student.name} 创建会员档案")
      redirect_to student_member_profile_path(@student, @member_profile), notice: "会员档案创建成功"
    else
      render :new
    end
  end

  def edit
  end

  def update
    before_data = @member_profile.attributes.slice("member_level", "membership_end_date", "payment_status", "total_amount")
    if @member_profile.update(member_profile_params)
      after_data = @member_profile.attributes.slice("member_level", "membership_end_date", "payment_status", "total_amount")
      log_operation("update", target: @member_profile, before_data: before_data, after_data: after_data, details: "更新学员 #{@student.name} 的会员档案")
      redirect_to student_member_profile_path(@student, @member_profile), notice: "会员档案更新成功"
    else
      render :edit
    end
  end

  private

  def set_student
    @student = Student.find(params[:student_id])
  end

  def set_member_profile
    @member_profile = @student.member_profile || @student.create_member_profile
  end

  def member_profile_params
    params.require(:member_profile).permit(
      :member_level, :membership_start_date, :membership_end_date,
      :total_points, :available_points, :payment_status, :total_amount,
      :benefits_overview
    )
  end
end
