PaperTrail.config.version_limit = 100
PaperTrail.config.serializer = JSON

module PaperTrail
  class Version < ::ActiveRecord::Base
    include PaperTrail::VersionConcern

    belongs_to :actor, class_name: "User", foreign_key: :whodunnit, optional: true

    def user
      User.find_by(id: whodunnit) if whodunnit.present?
    end

    def display_changes
      changeset.except("updated_at", "created_at", "lock_version")
    end
  end
end
