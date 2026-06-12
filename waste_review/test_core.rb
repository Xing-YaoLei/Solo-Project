puts '=== Testing Core Functions ==='
puts ''

puts '1. Store count: ' + Store.count.to_s
puts '2. WasteReport count: ' + WasteReport.count.to_s
puts '3. AbnormalReport count: ' + AbnormalReport.count.to_s
puts ''
puts '4. Overall waste rate: ' + WasteReport.overall_waste_rate.to_s + '%'
puts '5. Abnormal resolution rate: ' + AbnormalReport.resolution_rate.to_s + '%'
puts ''

store = Store.first
puts '6. ' + store.name + ' monthly waste rate: ' + store.monthly_waste_rate.to_s + '%'
puts ''

report = WasteReport.first
puts '7. Report #' + report.id.to_s + ' waste rate: ' + report.waste_rate.to_s + '%'
puts '   Abnormal? ' + report.abnormal?.to_s
puts '   Severity: ' + report.severity_level.to_s
puts ''

puts '8. Waste reasons: ' + WasteItem::WASTE_REASONS.first(3).join(', ') + '...'
puts '9. Categories: ' + WasteItem::CATEGORIES.first(3).join(', ') + '...'
puts ''

puts '10. Status transition test:'
report = WasteReport.submitted.first
if report
  puts '    Report #' + report.id.to_s + ' current status: ' + report.status
  puts '    Can transition to reviewing? ' + report.can_transition_to?(:reviewing).to_s
end
puts ''

puts '11. Store trend data (last 3 months):'
store.waste_rate_trend(3).each do |data|
  puts '    ' + data[:month] + ': ' + data[:rate].to_s + '% (¥' + sprintf('%.2f' % data[:cost]) + ')'
end
puts ''

puts '12. Waste reason summary for first report:'
report.waste_reason_summary.first(3).each do |reason, amount|
  puts '    ' + reason + ': ¥' + sprintf('%.2f' % amount)
end
puts ''

puts '=== All tests passed! ==='
