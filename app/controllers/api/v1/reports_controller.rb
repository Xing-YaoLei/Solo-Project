module Api
  module V1
    class ReportsController < BaseController
      def payment_cycle_data
        authorize Settlement, :index?

        period = params[:period] || Date.today.strftime("%Y-%m")

        settlements = policy_scope(Settlement).by_period(period)

        data = {
          period: period,
          total_amount: settlements.sum(:merchant_amount),
          settlement_count: settlements.count,
          with_difference_count: settlements.with_difference.count,
          by_status: settlements.group(:status).count.transform_keys { |k| Settlement.statuses.key(k) },
          by_merchant: settlements.group(:merchant_id)
                                    .sum(:merchant_amount)
                                    .sort_by { |_, v| -v }
                                    .first(10)
                                    .to_h
                                    .transform_keys { |k| Merchant.find(k).name rescue "Merchant #{k}" },
          trend: settlements.group_by_day(:created_at, format: "%Y-%m-%d")
                             .sum(:merchant_amount)
        }

        render json: { report: data }
      end

      def by_date_data
        authorize Settlement, :index?

        start_date = params[:start_date] ? Date.parse(params[:start_date]) : 30.days.ago.to_date
        end_date = params[:end_date] ? Date.parse(params[:end_date]) : Date.today

        settlements = policy_scope(Settlement).by_payment_date(start_date, end_date)

        data = {
          start_date: start_date.to_s,
          end_date: end_date.to_s,
          total_amount: settlements.sum(:merchant_amount),
          settlement_count: settlements.count,
          settlements_by_date: settlements.group_by_day(:payment_date, format: "%Y-%m-%d").count,
          amount_by_date: settlements.group_by_day(:payment_date, format: "%Y-%m-%d").sum(:merchant_amount),
          by_status: settlements.group(:status).count.transform_keys { |k| Settlement.statuses.key(k) }
        }

        render json: { report: data }
      end

      def by_owner_data
        authorize Settlement, :index?

        period = params[:period] || Date.today.strftime("%Y-%m")

        settlements = policy_scope(Settlement).by_period(period)
        discrepancies = policy_scope(Discrepancy).joins(:settlement).where(settlements: { period: period })

        by_handler = settlements.group(:handler_id).count.sort_by { |_, v| -v }.to_h
        amount_by_handler = settlements.completed.group(:handler_id).sum(:merchant_amount).sort_by { |_, v| -v }.to_h
        discrepancies_by_handler = discrepancies.group("settlements.handler_id").count

        handler_ids = (by_handler.keys + amount_by_handler.keys + discrepancies_by_handler.keys).uniq
        handlers = User.where(id: handler_ids).index_by(&:id)

        data = {
          period: period,
          handlers: handler_ids.map do |handler_id|
            handler = handlers[handler_id]
            {
              handler_id: handler_id,
              handler_name: handler&.name,
              settlement_count: by_handler[handler_id] || 0,
              amount: amount_by_handler[handler_id] || 0,
              discrepancy_count: discrepancies_by_handler[handler_id] || 0
            }
          end.sort_by { |h| -h[:settlement_count] }
        }

        render json: { report: data }
      end
    end
  end
end
