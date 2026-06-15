class RecordsController < ApplicationController
  def index
    @filter_params = {
      student_id: params[:student_id],
      community_id: params[:community_id],
      start_date: params[:start_date],
      end_date: params[:end_date],
      status: params[:status],
      refund_reason_code: params[:refund_reason_code],
      member_level: params[:member_level],
      keyword: params[:keyword]
    }

    load_records
    load_summary_stats
  end

  private

  def load_records
    redemptions = RedemptionRecord.all
    refunds = RefundRecord.all

    if params[:student_id].present?
      redemptions = redemptions.by_student(params[:student_id])
      refunds = refunds.by_student(params[:student_id])
    end

    if params[:community_id].present?
      student_ids = Student.by_community(params[:community_id]).pluck(:id)
      redemptions = redemptions.where(student_id: student_ids)
      refunds = refunds.where(student_id: student_ids)
    end

    if params[:start_date].present? && params[:end_date].present?
      sd = Date.parse(params[:start_date]).beginning_of_day
      ed = Date.parse(params[:end_date]).end_of_day
      redemptions = redemptions.by_date_range(sd, ed)
      refunds = refunds.by_date_range(sd, ed)
    end

    redemptions = redemptions.by_status(params[:status]) if params[:status].present?
    refunds = refunds.by_status(params[:refund_status] || params[:status]) if params[:status].present? || params[:refund_status].present?
    refunds = refunds.by_reason(params[:refund_reason_code]) if params[:refund_reason_code].present?

    if params[:keyword].present?
      student_ids = Student.where("name LIKE ? OR phone LIKE ?", "%#{params[:keyword]}%", "%#{params[:keyword]}%").pluck(:id)
      redemptions = redemptions.where(student_id: student_ids)
      refunds = refunds.where(student_id: student_ids)
    end

    if params[:member_level].present?
      student_ids = MemberProfile.by_level(params[:member_level]).pluck(:student_id)
      redemptions = redemptions.where(student_id: student_ids)
      refunds = refunds.where(student_id: student_ids)
    end

    @redemption_records = redemptions.includes(:student, :benefit_rule, :operator).order(redeemed_at: :desc, created_at: :desc).page(params[:r_page]).per(15)
    @refund_records = refunds.includes(:student, :member_profile, :operator).order(created_at: :desc).page(params[:f_page]).per(15)

    load_member_profiles
  end

  def load_member_profiles
    student_ids = (@redemption_records.pluck(:student_id) + @refund_records.pluck(:student_id)).uniq
    student_ids = Student.all.pluck(:id).take(50) if student_ids.empty? && params[:student_id].blank?

    profiles_query = MemberProfile.includes(:student)
    profiles_query = profiles_query.by_level(params[:member_level]) if params[:member_level].present?
    profiles_query = profiles_query.where(student_id: student_ids) if student_ids.any?
    profiles_query = profiles_query.where(student_id: params[:student_id]) if params[:student_id].present?

    if params[:community_id].present?
      community_student_ids = Student.by_community(params[:community_id]).pluck(:id)
      profiles_query = profiles_query.where(student_id: community_student_ids)
    end

    @member_profiles = profiles_query.order(created_at: :desc).page(params[:m_page]).per(15)
  end

  def load_summary_stats
    base_students = Student.all
    base_students = base_students.by_community(params[:community_id]) if params[:community_id].present?
    base_student_ids = base_students.pluck(:id)

    redemptions_scope = RedemptionRecord.where(student_id: base_student_ids)
    refunds_scope = RefundRecord.where(student_id: base_student_ids)

    if params[:start_date].present? && params[:end_date].present?
      sd = Date.parse(params[:start_date]).beginning_of_day
      ed = Date.parse(params[:end_date]).end_of_day
      redemptions_scope = redemptions_scope.where(redeemed_at: sd..ed)
      refunds_scope = refunds_scope.where(created_at: sd..ed)
    end

    @total_redemptions = redemptions_scope.count
    @completed_redemptions = redemptions_scope.where(status: "completed").count
    @total_refunds = refunds_scope.count
    @approved_refunds = refunds_scope.where(refund_status: %w[approved completed]).count
    @total_refund_amount = refunds_scope.where(refund_status: %w[approved completed]).sum(:refund_amount).to_f.round(2)

    member_query = MemberProfile.where(student_id: base_student_ids)
    member_query = member_query.by_level(params[:member_level]) if params[:member_level].present?
    @active_members = member_query.active.count
    @expired_members = member_query.expired.count
    @total_member_value = member_query.sum(:total_amount).to_f.round(2)
  end
end
