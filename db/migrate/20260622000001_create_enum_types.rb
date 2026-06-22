class CreateEnumTypes < ActiveRecord::Migration[7.2]
  def up
    execute <<~SQL
      CREATE TYPE audit_status AS ENUM (
        'draft',
        'pending_materials',
        'in_progress',
        'pending_evidence',
        'pending_checklist',
        'pending_notification',
        'pending_approval',
        'approved',
        'rejected',
        'archived'
      );

      CREATE TYPE exception_status AS ENUM (
        'open',
        'assigned',
        'in_progress',
        'resolved',
        'closed'
      );

      CREATE TYPE severity_level AS ENUM (
        'low',
        'medium',
        'high',
        'critical'
      );

      CREATE TYPE user_role AS ENUM (
        'auditor',
        'supervisor',
        'admin'
      );

      CREATE TYPE material_status AS ENUM (
        'pending',
        'approved',
        'expired',
        'rejected'
      );
    SQL
  end

  def down
    execute <<~SQL
      DROP TYPE IF EXISTS audit_status;
      DROP TYPE IF EXISTS exception_status;
      DROP TYPE IF EXISTS severity_level;
      DROP TYPE IF EXISTS user_role;
      DROP TYPE IF EXISTS material_status;
    SQL
  end
end
