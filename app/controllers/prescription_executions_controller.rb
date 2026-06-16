class PrescriptionExecutionsController < ApplicationController
  def index
    @prescriptions = TrainingPrescription.includes(:assessment_record, :therapist, :training_sessions)
    @prescriptions = @prescriptions.where(status: params[:status]) if params[:status].present?
    @prescriptions = @prescriptions.where(therapist_id: params[:therapist_id]) if params[:therapist_id].present?
    @prescriptions = @prescriptions.order(created_at: :desc)
    @therapists = User.where(role: :therapist)
  end

  def show
    @prescription = TrainingPrescription.includes(training_sessions: :equipment).find(params[:id])
    @sessions = @prescription.training_sessions.order(:session_date)
  end
end
