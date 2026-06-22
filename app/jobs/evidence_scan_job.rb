class EvidenceScanJob < ApplicationJob
  queue_as :default

  def perform(audit_id = nil)
    if audit_id.present?
      scan_single_audit(audit_id)
    else
      scan_all_audits
    end
  end

  private

  def scan_single_audit(audit_id)
    audit = Audit.find_by(id: audit_id)
    return unless audit

    result = EvidenceMissingDetectionService.call(
      audit,
      auto_create_exception: true,
      severity_threshold: 3
    )

    if result.success? && result.result[:missing_items].any?
      NotificationJob.perform_later(
        :evidence_missing,
        audit_id: audit.id,
        missing_count: result.result[:missing_items].count
      )
    end

    result
  end

  def scan_all_audits
    audits = Audit.active.where(status: %i[in_progress pending_evidence pending_checklist pending_notification])
    processed_count = 0
    issues_found = 0

    audits.find_each do |audit|
      result = EvidenceMissingDetectionService.call(
        audit,
        auto_create_exception: true,
        severity_threshold: 3
      )

      processed_count += 1
      if result.success? && result.result[:missing_items].any?
        issues_found += 1
        NotificationJob.perform_later(
          :evidence_missing,
          audit_id: audit.id,
          missing_count: result.result[:missing_items].count
        )
      end
    rescue StandardError => e
      Rails.logger.error("EvidenceScanJob failed for audit #{audit.id}: #{e.message}")
    end

    check_material_expiration

    Rails.logger.info("EvidenceScanJob completed: processed=#{processed_count} issues_found=#{issues_found}")
  end

  def check_material_expiration
    expiring_materials = SupplierMaterial.approved.where(
      "expire_at BETWEEN ? AND ?",
      Date.today,
      30.days.from_now
    )

    expired_materials = SupplierMaterial.approved.where(
      "expire_at <= ?",
      Date.today
    )

    expiring_ids = expiring_materials.pluck(:id) + expired_materials.pluck(:id)

    if expiring_ids.any?
      expired_materials.find_each do |material|
        material.update!(status: :expired)
      end

      NotificationJob.perform_later(
        :material_expiring,
        supplier_material_ids: expiring_ids
      )
    end
  end
end
