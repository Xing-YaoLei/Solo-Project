class HealthController < ApplicationController
  skip_before_action :authenticate_user!
  skip_after_action :verify_authorized

  def index
    status = {
      status: "ok",
      timestamp: Time.current.iso8601,
      version: Rails.application.config.version || "1.0.0",
      checks: {
        database: database_ok?,
        redis: redis_ok?,
        migrations: migrations_ok?
      }
    }

    status[:status] = if status[:checks].values.all?
                        "ok"
                      else
                        "degraded"
                      end

    render json: status, status: status[:status] == "ok" ? :ok : :service_unavailable
  end

  def check
    render plain: "OK"
  end

  private

  def database_ok?
    ActiveRecord::Base.connection.execute("SELECT 1").any?
  rescue StandardError
    false
  end

  def redis_ok?
    Redis.current.ping == "PONG"
  rescue StandardError
    false
  end

  def migrations_ok?
    !ActiveRecord::Base.connection.migration_context.needs_migration?
  rescue StandardError
    false
  end
end
