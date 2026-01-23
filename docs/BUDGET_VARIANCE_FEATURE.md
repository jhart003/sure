# Budget Variance Analysis Feature

## Overview
This feature adds comprehensive variance analysis to the budget view, allowing users to compare budgeted amounts against actual spending across different time periods.

## Features

### 1. Period Selection
Users can select from three time period types:
- **Month**: Single month variance analysis
- **Quarter**: Three-month rolling variance (Q1, Q2, Q3, Q4)
- **Year**: Full year variance analysis

### 2. Starting Month Selector
A dropdown menu allows users to select any month from the past 2 years (or earliest entry date) as the starting point for variance analysis.

### 3. Variance Summary Display
The variance component shows:
- **Total Budgeted Amount**: Sum of all budgeted spending for the period
- **Total Actual Spent**: Sum of all actual spending for the period
- **Total Variance**: Difference between budgeted and actual
  - Displays as positive (under budget) in green
  - Displays as negative (over budget) in red
  - Shows both absolute amount and percentage

### 4. Visual Progress Bar
A color-coded progress bar shows:
- Green fill: Actual spending (when under budget)
- Red fill: Actual spending (when over budget)
- Gray fill: Remaining budget
- Percentage labels on each end

### 5. Category Breakdown
Shows top 10 categories with:
- Category color indicator
- Category name
- Actual vs budgeted amounts (e.g., "$450 / $500")
- Variance amount with +/- indicator
- Color coding (green for under, red for over)

## Technical Implementation

### New Files Created

1. **app/models/budget/variance_calculator.rb**
   - Service class for multi-period variance calculations
   - Supports month, quarter, and year aggregation
   - Calculates category-level variances

2. **app/components/budget/variance_component.rb**
   - ViewComponent for rendering variance UI
   - Helper methods for period labels and formatting
   - Color coding logic for variance status

3. **app/components/budget/variance_component.html.erb**
   - Template for variance display
   - Responsive grid layout
   - Category breakdown table

4. **app/javascript/controllers/budget_variance_controller.js**
   - Stimulus controller for period selection
   - Handles dynamic updates via Turbo
   - Manages URL query parameters

5. **app/views/budgets/_variance_controls.html.erb**
   - Dropdown selectors for period type and starting month
   - Integrated with Stimulus controller
   - Turbo frame for dynamic updates

6. **config/locales/views/budgets/en.yml**
   - Internationalization strings for all variance labels
   - Supports multiple languages

### Modified Files

1. **app/models/budget.rb**
   - Added `spending_variance` method
   - Added `spending_variance_percent` method
   - Added `income_variance` method
   - Added `income_variance_percent` method

2. **app/controllers/budgets_controller.rb**
   - Modified `show` action to handle variance parameters
   - Initializes variance calculator with user selections

3. **app/views/budgets/show.html.erb**
   - Added variance section below categories
   - Conditional display based on budget initialization

### Tests

1. **test/models/budget/variance_calculator_test.rb**
   - Tests for monthly, quarterly, and yearly calculations
   - Validates variance formulas
   - Verifies category aggregation

2. **test/models/budget_test.rb**
   - Tests for new variance methods
   - Validates percentage calculations

## Usage

1. Navigate to any budget month (e.g., `/budgets/jan-2024`)
2. Scroll down to the "Budget Variance Analysis" section
3. Select desired period type from dropdown (Month/Quarter/Year)
4. Select starting month from dropdown
5. View variance summary and category breakdown
6. The display updates automatically when selections change

## Integration Points

- Uses existing `Budget` and `BudgetCategory` models
- Leverages `Period` model for date range calculations
- Integrates with `Money` gem for currency formatting
- Uses Turbo for dynamic updates without page refresh
- Follows existing design system (DS components, Tailwind CSS)
- Maintains i18n support for all user-facing text

## Future Enhancements

Potential improvements could include:
- Interactive variance chart/graph visualization
- Export variance report to CSV/PDF
- Comparison with previous period
- Budget vs actual trend over time
- Email alerts for budget overages
