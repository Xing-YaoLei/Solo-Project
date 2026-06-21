module Reports
  class ByOwnerService
    def initialize(params = {})
      @start_date = params[:start_date]&.to_date || 1.month.ago.to_date
      @end_date = params[:end_date]&.to_date || Date.current
      @role = params[:role]
      @city_id = params[:city_id]
    end

    def generate
      users = filtered_users

      {
        summary: generate_summary(users),
        owners: generate_owner_data(users),
        rankings: generate_rankings(users),
        performance_matrix: generate_performance_matrix(users)
      }
    end

    def export(format = :xlsx)
      data = generate
      filename = "owner_performance_report_#{Time.current.strftime("%Y%m%d%H%M%S")}"

      case format
      when :csv
        generate_csv(data[:owners], filename)
      when :xlsx
        generate_xlsx(data, filename)
      else
        raise ArgumentError, "Unsupported format: #{format}"
      end
    end

    private

    def filtered_users
      scope = User.includes(:assigned_todo_items, :settlements, :approval_records)
      scope = scope.by_role(@role) if @role
      scope = scope.by_city(@city_id) if @city_id
      scope.active
    end

    def generate_summary(users)
      settlements = Settlement.where(created_at: @start_date..@end_date)
      todos = TodoItem.where(created_at: @start_date..@end_date)

      {
        total_owners: users.count,
        total_settlements: settlements.count,
        total_amount: settlements.sum(:system_amount),
        total_todos: todos.count,
        completed_todos: todos.by_status(:completed).count,
        avg_completion_rate: calculate_avg_completion_rate(users),
        avg_settlements_per_owner: (settlements.count.to_f / [users.count, 1].max).round(2),
        performance_distribution: calculate_performance_distribution(users)
      }
    end

    def generate_owner_data(users)
      users.map do |user|
        user_settlements = user.settlements.where(created_at: @start_date..@end_date)
        user_todos = user.assigned_todo_items.where(created_at: @start_date..@end_date)
        completed_todos = user_todos.by_status(:completed)

        {
          owner_id: user.id,
          owner_name: user.name,
          role: user.role,
          phone: user.phone,
          settlement_count: user_settlements.count,
          total_settlement_amount: user_settlements.sum(:system_amount).round(2),
          avg_settlement_amount: user_settlements.count.zero? ? 0 : (user_settlements.sum(:system_amount) / user_settlements.count).round(2),
          approved_count: user_settlements.by_status(:approved).count,
          rejected_count: user_settlements.by_status(:rejected).count,
          discrepancy_count: user_settlements.with_difference.count,
          todo_count: user_todos.count,
          completed_todo_count: completed_todos.count,
          todo_completion_rate: user_todos.count.zero? ? 0 : (completed_todos.count.to_f / user_todos.count * 100).round(2),
          avg_completion_days: calculate_avg_completion_days(user_todos),
          overdue_todos: user_todos.overdue.count,
          approval_count: user.approval_records.where(created_at: @start_date..@end_date).count,
          performance_score: calculate_performance_score(user, user_settlements, user_todos),
          ranking: nil
        }
      end.sort_by { |o| -o[:performance_score] }.each_with_index { |o, i| o[:ranking] = i + 1 }
    end

    def generate_rankings(owners)
      data = generate_owner_data(owners)

      {
        by_settlement_amount: data.sort_by { |o| -o[:total_settlement_amount] }.first(10),
        by_completion_rate: data.sort_by { |o| -o[:todo_completion_rate] }.first(10),
        by_performance: data.sort_by { |o| -o[:performance_score] }.first(10),
        most_overdue: data.sort_by { |o| -o[:overdue_todos] }.first(10)
      }
    end

    def generate_performance_matrix(owners)
      data = generate_owner_data(owners)

      {
        high_performers: data.select { |o| o[:performance_score] >= 80 }.count,
        medium_performers: data.select { |o| o[:performance_score] >= 50 && o[:performance_score] < 80 }.count,
        low_performers: data.select { |o| o[:performance_score] < 50 }.count,
        role_distribution: data.group_by { |o| o[:role] }.transform_values(&:count),
        city_distribution: owners.group_by(&:city_id).transform_values(&:count),
        avg_score_by_role: calculate_avg_score_by_role(data)
      }
    end

    def calculate_performance_score(user, settlements, todos)
      score = 0

      settlement_score = [settlements.count * 2, 40].min
      score += settlement_score

      amount_score = [(settlements.sum(:system_amount) / 10_000).to_i * 2, 30].min
      score += amount_score

      completion_score = todos.count.zero? ? 0 : (todos.by_status(:completed).count.to_f / todos.count * 30)
      score += completion_score

      overdue_penalty = [todos.overdue.count * 5, 20].min
      score -= overdue_penalty

      [score.round(2), 0].max
    end

    def calculate_avg_completion_days(todos)
      completed = todos.by_status(:completed).where.not(completed_at: nil)
      return 0 if completed.empty?

      total_days = completed.sum do |todo|
        next 0 unless todo.created_at && todo.completed_at

        (todo.completed_at.to_date - todo.created_at.to_date).to_i
      end

      (total_days.to_f / completed.count).round(2)
    end

    def calculate_avg_completion_rate(users)
      return 0 if users.empty?

      rates = users.map do |user|
        todos = user.assigned_todo_items.where(created_at: @start_date..@end_date)
        next 0 if todos.count.zero?

        todos.by_status(:completed).count.to_f / todos.count * 100
      end

      (rates.sum / users.count.to_f).round(2)
    end

    def calculate_performance_distribution(users)
      data = generate_owner_data(users)
      {
        excellent: data.count { |o| o[:performance_score] >= 90 },
        good: data.count { |o| o[:performance_score] >= 70 && o[:performance_score] < 90 },
        average: data.count { |o| o[:performance_score] >= 50 && o[:performance_score] < 70 },
        needs_improvement: data.count { |o| o[:performance_score] < 50 }
      }
    end

    def calculate_avg_score_by_role(data)
      data.group_by { |o| o[:role] }.transform_values do |group|
        (group.sum { |o| o[:performance_score] } / group.count.to_f).round(2)
      end
    end

    def generate_csv(data, filename)
      require "csv"

      filepath = Rails.root.join("tmp", "#{filename}.csv")
      CSV.open(filepath, "wb") do |csv|
        headers = ["排名", "处理人", "角色", "结算单数", "结算总额", "通过率(%)", "待办完成率(%)", "逾期待办", "绩效得分"]
        csv << headers
        data.each do |row|
          csv << [
            row[:ranking],
            row[:owner_name],
            row[:role],
            row[:settlement_count],
            row[:total_settlement_amount],
            row[:todo_completion_rate],
            row[:overdue_todos],
            row[:performance_score]
          ]
        end
      end

      filepath
    end

    def generate_xlsx(data, filename)
      require "rubyXL"

      workbook = RubyXL::Workbook.new
      worksheet = workbook[0]
      worksheet.sheet_name = "人员绩效"

      headers = ["排名", "处理人", "角色", "结算单数", "结算总额", "平均结算额", "通过数", "驳回数", "差异数", "待办数", "完成数", "完成率(%)", "平均完成天数", "逾期数", "绩效得分"]
      headers.each_with_index { |h, i| worksheet.add_cell(0, i, h) }

      data[:owners].each_with_index do |owner, idx|
        row = idx + 1
        worksheet.add_cell(row, 0, owner[:ranking])
        worksheet.add_cell(row, 1, owner[:owner_name])
        worksheet.add_cell(row, 2, owner[:role])
        worksheet.add_cell(row, 3, owner[:settlement_count])
        worksheet.add_cell(row, 4, owner[:total_settlement_amount])
        worksheet.add_cell(row, 5, owner[:avg_settlement_amount])
        worksheet.add_cell(row, 6, owner[:approved_count])
        worksheet.add_cell(row, 7, owner[:rejected_count])
        worksheet.add_cell(row, 8, owner[:discrepancy_count])
        worksheet.add_cell(row, 9, owner[:todo_count])
        worksheet.add_cell(row, 10, owner[:completed_todo_count])
        worksheet.add_cell(row, 11, owner[:todo_completion_rate])
        worksheet.add_cell(row, 12, owner[:avg_completion_days])
        worksheet.add_cell(row, 13, owner[:overdue_todos])
        worksheet.add_cell(row, 14, owner[:performance_score])
      end

      ranking_sheet = workbook.add_worksheet("排名情况")
      ranking_headers = ["排名类型", "排名", "处理人", "数值"]
      ranking_headers.each_with_index { |h, i| ranking_sheet.add_cell(0, i, h) }

      row_idx = 1
      data[:rankings].each do |type, items|
        type_name = case type
                    when :by_settlement_amount then "结算金额排名"
                    when :by_completion_rate then "完成率排名"
                    when :by_performance then "绩效排名"
                    when :most_overdue then "逾期排名"
                    else type.to_s
                    end

        items.each_with_index do |item, idx|
          ranking_sheet.add_cell(row_idx, 0, type_name)
          ranking_sheet.add_cell(row_idx, 1, idx + 1)
          ranking_sheet.add_cell(row_idx, 2, item[:owner_name])

          value = case type
                  when :by_settlement_amount then item[:total_settlement_amount]
                  when :by_completion_rate then "#{item[:todo_completion_rate]}%"
                  when :by_performance then item[:performance_score]
                  when :most_overdue then item[:overdue_todos]
                  end
          ranking_sheet.add_cell(row_idx, 3, value)
          row_idx += 1
        end
      end

      filepath = Rails.root.join("tmp", "#{filename}.xlsx")
      workbook.write(filepath)

      filepath
    end
  end
end
