class ApplicationService
  def self.call(*args, **kwargs, &block)
    new(*args, **kwargs, &block).call
  end

  attr_reader :result, :errors

  def initialize(*args, **kwargs)
    @result = nil
    @errors = []
    @success = false
  end

  def call
    raise NotImplementedError, "Subclasses must implement #call method"
  end

  def success?
    @success
  end

  def failure?
    !success?
  end

  private

  def succeed(result = nil)
    @success = true
    @result = result
    self
  end

  def fail(message, error_code = nil)
    @success = false
    @errors << { message: message, code: error_code }
    self
  end

  def fail_with_errors(errors)
    @success = false
    @errors += Array(errors)
    self
  end

  def transaction(&block)
    ActiveRecord::Base.transaction(&block)
  end
end
