web: bin/rails server -p ${PORT:-3000} -e ${RAILS_ENV:-production}
worker: bundle exec sidekiq -C config/queue.yml
