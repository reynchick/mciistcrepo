# Research Matrix Report Feature

## Overview
A comprehensive research matrix generator that displays research data grouped by program and year, with advanced filtering and search capabilities.

## Features Implemented

### 1. **Filtering Capabilities**
- Filter by Program (dropdown selection)
- Filter by Year (dropdown selection)
- Combined filtering (Program + Year simultaneously)
- Real-time search across multiple fields

### 2. **Grouping Structure**
- Primary grouping: By Program
- Secondary grouping: By Year (within each program)
- Automatic sorting: Programs alphabetically, Years descending

### 3. **Fields Displayed**
- Research ID (unique identifier)
- Title (with line clamping for long titles)
- Researchers (formatted names with middle initials)
- Research Adviser (formatted name)
- Month and Year (formatted display)
- Connected SDG (Sustainable Development Goals) - displayed as badges
- Connected SRIG (Strategic Research Interest Groups) - displayed as badges
- Connected Research Agenda - displayed as badges

### 4. **Search Functionality**
- Search by research title
- Search by abstract content
- Search by researcher names
- Search by adviser names
- Live search with Enter key support

### 5. **User Interface**
- Responsive table layout
- Card-based grouping for clear visual hierarchy
- Badge indicators for filtered state
- Research count display per year group
- Total vs filtered research count

## Technical Implementation

### Frontend (TypeScript/React)
**File**: `resources/js/pages/reports/index.tsx`

- Uses Inertia.js for server-side rendering
- Implements useMemo for efficient data grouping
- Responsive UI with Tailwind CSS
- Component-based architecture using shadcn/ui components

### Backend (PHP/Laravel)
**Controller**: `app/Http/Controllers/ResearchMatrixController.php`

- Handles filtering logic
- Eager loads relationships for performance
- Excludes archived research
- Supports search across multiple related tables

**Route**: Added to `routes/web.php`
```php
Route::get('/reports/matrix', [ResearchMatrixController::class, 'index'])->name('reports.matrix');
```

### Type Definitions
**File**: `resources/js/types/index.d.ts`

Added type definitions for:
- SDG (Sustainable Development Goals)
- SRIG (Strategic Research Interest Groups)
- Agenda (Research Agendas)
- Updated Research type to include these relationships

## Database Relationships

The feature leverages existing Laravel Eloquent relationships:
- `Research::sdgs()` - Many-to-Many via `research_sdg` pivot table
- `Research::srigs()` - Many-to-Many via `research_srig` pivot table
- `Research::agendas()` - Many-to-Many via `research_agenda` pivot table
- `Research::program()` - Belongs To relationship
- `Research::adviser()` - Belongs To relationship
- `Research::researchers()` - Has Many relationship

## How to Access

Navigate to: `/reports/matrix`

Or programmatically:
```javascript
router.visit(route('reports.matrix'))
```

## Future Enhancements (Not Yet Implemented)

### PDF Export
- Generate PDF report with filtered data
- Include grouping structure
- Professional formatting

### Excel Export
- Export to .xlsx format
- Multiple sheets per program
- Formatted columns

### Additional Features
- Column visibility toggle
- Custom date range filtering
- Export format selection modal
- Print-friendly view
- Sorting options within groups

## Usage Example

1. Navigate to Reports → Matrix
2. (Optional) Select a program from the dropdown
3. (Optional) Select a year from the dropdown
4. (Optional) Enter search terms in the search box
5. Click "Apply Filters" to filter the data
6. View grouped research data organized by program and year

## Notes

- All filters can be combined for precise data filtering
- Search is performed across title, abstract, researchers, and adviser names
- The page preserves state and scroll position during filtering
- Empty groups are automatically hidden
- Badge colors indicate different types of connections (SDG, SRIG, Agenda)
