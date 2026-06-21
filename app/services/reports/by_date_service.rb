module Reports
  class ByDateService
    def initialize(params = {})
      @start_date = params[:start_date]&.to_date || 1.month.ago.to_date
      @end_date = params[:end_date]&.to_date || Date.current
      @group_by = params[:group_by] || :day
      @merchant_id = params[:merchant_id]
    end

    def generate
      settlements = filtered_settlements

      {
        summary: generate_summary(settlements),
        daily_data: generate_daily_data(settlements),
        comparison: generate_comparison(settlements),
        trends: generate_trends(settlements)
      }
    end

    def chart_data
      data = generate
      {
        labels: data[:daily_data].map { |d| d[:date] },
        datasets: [
          {
            name: "系统金额",
            data: data[:daily_data].map { |d| d[:system_amount] }
          },
          {
            name: "商家金额",
            data: data[:daily_data].map { |d| d[:merchant_amount] }
          },
          {
            name: "差异金额",
            data: data[:daily_data].map { |d| d[:difference_amount] }
          }
        ]
      }
    end

    private

    def filtered_settlements
      scope = Settlement.includes(:merchant)
      scope = scope.by_merchant(@merchant_id) if @merchant_id

      case @group_by
      when :day
        scope.where(created_at: @start_date.beginning_of_day..@end_date.end_of_day)
      when :week
        scope.where(created_at: @start_date.beginning_of_week..@end_date.end_of_week)
      when :month
        scope.where(created_at: @start_date.beginning_of_month..@end_date.end_of_month)
      else
        scope.where(created_at: @start_date..@end_date)
      end
    end

    def generate_summary(settlements)
      {
        date_range: "#{@start_date} 至 #{@end_date}",
        total_settlements: settlements.count,
        total_system_amount: settlements.sum(:system_amount),
        total_merchant_amount: settlements.sum(:merchant_amount),
        total_difference: settlements.sum(:difference_amount),
        avg_daily_settlements: (settlements.count.to_f / days_in_range).round(2),
        avg_daily_amount: (settlements.sum(:system_amount) / days_in_range).round(2),
        peak_day: find_peak_day(settlements),
        lowest_day: find_lowest_day(settlements)
      }
    end

    def generate_daily_data(settlements)
      grouped = settlements.group_by { |s| s.created_at.send("beginning_of_#{@group_by}").to_date }

      (@start_date..@end_date).step(step_size).map do |date|
        items = grouped[date] || []
        {
          date: date.strftime(date_format),
          count: items.count,
          system_amount: items.sum(:system_amount).round(2),
          merchant_amount: items.sum(:merchant_amount).round(2),
          difference_amount: items.sum(:difference_amount).round(2),
          avg_amount: items.count.zero? ? 0 : (items.sum(:system_amount) / items.count).round(2),
          discrepancy_count: items.with_difference.count,
          merchant_count: items.map(&:merchant_id).uniq.count
        }
      end
    end

    def generate_comparison(settlements)
      current_period = settlements.sum(:system_amount)
      previous_period = calculate_previous_period_sum

      {
        current_period:,
        previous_period:,
        absolute_change: current_period - previous_period,
        percentage_change: previous_period.zero? ? 0 : ((current_period - previous_period) / previous_period * 100).round(2),
        settlement_count_change: calculate_settlement_count_change(settlements),
        average_daily_change: calculate_average_daily_change(settlements)
      }
    end

    def generate_trends(settlements)
      daily_sums = settlements.group_by_day(:created_at).sum(:system_amount)
      values = daily_sums.values

      return { moving_average: [], growth_rate: [] } if values.size < 2

      {
        moving_average: calculate_moving_average(values, 7),
        growth_rate: calculate_growth_rate(values),
        volatility: calculate_volatility(values),
        trend: determine_trend(values)
      }
    end

    def days_in_range
      (@end_date - @start_date).to_i + 1
    end

    def step_size
      case @group_by
      when :day then 1.day
      when :week then 1.week
      when :month then 1.month
      else 1.day
      end
    end

    def date_format
      case @group_by
      when :day then "%Y-%m-%d"
      when :week then "W%W %Y"
      when :month then "%Y-%m"
      else "%Y-%m-%d"
      end
    end

    def find_peak_day(settlements)
      daily = settlements.group_by { |s| s.created_at.to_date }.transform_values { |v| v.sum(:system_amount) }
      return nil if daily.empty?

      peak = daily.max_by { |_, v| v }
      { date: peak[0].to_s, amount: peak[1].round(2) }
    end

    def find_lowest_day(settlements)
      daily = settlements.group_by { |s| s.created_at.to_date }.transform_values { |v| v.sum(:system_amount) }
      return nil if daily.empty?

      lowest = daily.min_by { |_, v| v }
      { date: lowest[0].to_s, amount: lowest[1].round(2) }
    end

    def calculate_previous_period_sum
      days = days_in_range
      prev_start = @start_date - days.days
      prev_end = @start_date - 1.day

      scope = Settlement.where(created_at: prev_start..prev_end)
      scope = scope.by_merchant(@merchant_id) if @merchant_id
      scope.sum(:system_amount)
    end

    def calculate_settlement_count_change(settlements)
      days = days_in_range
      prev_start = @start_date - days.days
      prev_end = @start_date - 1.day

      scope = Settlement.where(created_at: prev_start..prev_end)
      scope = scope.by_merchant(@merchant_id) if @merchant_id
      prev_count = scope.count

      { current: settlements.count, previous: prev_count, change: settlements.count - prev_count }
    end

    def calculate_average_daily_change(settlements)
      daily_data = generate_daily_data(settlements)
      return 0 if daily_data.size < 2

      amounts = daily_data.map { |d| d[:system_amount] }
      changes = amounts.each_cons(2).map { |a, b| b - a }
      (changes.sum / changes.size.to_f).round(2)
    end

    def calculate_moving_average(values, window)
      return [] if values.size < window

      values.each_cons(window).map { |window_values| (window_values.sum / window.to_f).round(2) }
    end

    def calculate_growth_rate(values)
      values.each_cons(2).map do |prev, curr|
        prev.zero? ? 0 : ((curr - prev) / prev * 100).round(2)
      end
    end

    def calculate_volatility(values)
      return 0 if values.size < 2

      mean = values.sum / values.size.to_f
      variance = values.sum { |v| (v - mean)**2 } / values.size.to_f
      Math.sqrt(variance).round(2)
    end

    def determine_trend(values)
      return :stable if values.size < 2

      first_half = values[0...values.size / 2]
      second_half = values[values.size / 2..]
      first_avg = first_half.sum / [first_half.size, 1].max.to_f
      second_avg = second_half.sum / [second_half.size, 1].max.to_f

      if second_avg > first_avg * 1.05
        :upward
      elsif second_avg < first_avg * 0.95
        :downward
      else
        :stable
      end
    end
  end
end
