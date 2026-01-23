require "test_helper"

class Budget::VarianceCalculatorTest < ActiveSupport::TestCase
  setup do
    @family = families(:dylan_family)
    @start_date = Date.new(2024, 1, 1)
  end

  test "calculates monthly variance correctly" do
    calculator = Budget::VarianceCalculator.new(
      family: @family,
      start_date: @start_date,
      period_type: "month"
    )

    result = calculator.calculate

    assert_equal "month", result[:period_type]
    assert_equal @start_date, result[:start_date]
    assert_equal @start_date.end_of_month, result[:end_date]
    assert_kind_of Array, result[:budgets]
    assert_kind_of Numeric, result[:total_budgeted]
    assert_kind_of Numeric, result[:total_actual]
    assert_kind_of Numeric, result[:total_variance]
    assert_kind_of Array, result[:category_variances]
  end

  test "calculates quarterly variance correctly" do
    calculator = Budget::VarianceCalculator.new(
      family: @family,
      start_date: @start_date,
      period_type: "quarter"
    )

    result = calculator.calculate

    assert_equal "quarter", result[:period_type]
    assert_equal @start_date.end_of_quarter, result[:end_date]
    # Q1 2024 should have 3 months
    assert_equal 3, result[:budgets].length
  end

  test "calculates yearly variance correctly" do
    calculator = Budget::VarianceCalculator.new(
      family: @family,
      start_date: @start_date,
      period_type: "year"
    )

    result = calculator.calculate

    assert_equal "year", result[:period_type]
    assert_equal @start_date.end_of_year, result[:end_date]
    # Full year should have 12 months
    assert_equal 12, result[:budgets].length
  end

  test "category variances include category details" do
    calculator = Budget::VarianceCalculator.new(
      family: @family,
      start_date: @start_date,
      period_type: "month"
    )

    result = calculator.calculate

    result[:category_variances].each do |cv|
      assert cv.key?(:category)
      assert cv.key?(:budgeted)
      assert cv.key?(:actual)
      assert cv.key?(:variance)
      assert cv.key?(:variance_percent)
      assert cv.key?(:over_budget)
      
      # Verify variance calculation
      assert_equal cv[:budgeted] - cv[:actual], cv[:variance]
      
      # Verify over_budget flag
      assert_equal cv[:variance] < 0, cv[:over_budget]
    end
  end
end
