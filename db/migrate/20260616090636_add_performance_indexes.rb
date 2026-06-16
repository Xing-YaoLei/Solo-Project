class AddPerformanceIndexes < ActiveRecord::Migration[8.1]
  def change
    add_index :assessment_records, :patient_id, name: :idx_assessment_records_patient
    add_index :assessment_records, :assessor_id, name: :idx_assessment_records_assessor
    add_index :assessment_records, :status, name: :idx_assessment_records_status
    add_index :assessment_records, :assessed_at, name: :idx_assessment_records_assessed_at
    add_index :scale_items, :scale_id, name: :idx_scale_items_scale
    add_index :training_prescriptions, :status, name: :idx_training_prescriptions_status
    add_index :training_sessions, :prescription_id, name: :idx_training_sessions_prescription
    add_index :training_sessions, :session_date, name: :idx_training_sessions_date
    add_index :training_sessions, :status, name: :idx_training_sessions_status
    add_index :settlements, :status, name: :idx_settlements_status
    add_index :settlements, :patient_id, name: :idx_settlements_patient
    add_index :denial_actions, :settlement_id, name: :idx_denial_actions_settlement
    add_index :notifications, :user_id, name: :idx_notifications_user
    add_index :notifications, :read, name: :idx_notifications_read
    add_index :nursing_logs, :patient_id, name: :idx_nursing_logs_patient
    add_index :nursing_logs, :logged_at, name: :idx_nursing_logs_date
    add_index :equipment, :status, name: :idx_equipment_status
    add_index :equipment, :area_id, name: :idx_equipment_area
    add_foreign_key :training_sessions, :equipment
  end
end
