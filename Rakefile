require "rake"

def safe_define_task(name)
  return if Rake::Task.task_defined?(name)
  namespace_parts = name.split(":")
  task_name = namespace_parts.pop

  current = Rake.application
  namespace_parts.each do |ns|
    unless current.instance_variable_get(:@namespace)&.name == ns
      current.in_namespace(ns) {} rescue nil
    end
  end

  Rake::Task.define_task(name)
end

%w[
  assets:precompile
  assets:clobber
  assets:clean
  assets:environment
  css:build
  css:build:watch
  javascript:build
  javascript:build:watch
  app:exec
].each { |t| safe_define_task(t) }

require_relative "config/application"

Rails.application.load_tasks
