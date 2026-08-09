# Frontend Phase 6: Quick Reference Guide

## What Was Implemented

### 1. Student My Research Page
**File:** `resources/js/pages/research/my-researches.tsx`

New student-specific research management page accessible at `/student/my-researches`.

**Features:**
- Lists all research entries where the student is a linked researcher
- Excludes archived research (revokes student access)
- Status badges with color coding
- Capability-driven action buttons
- Search by title/ID
- Filter by status (excludes archived)
- Read-only reason badges

**Action Logic:**
```
if (canEdit) → "Edit" button
else if (canSubmit) → "Submit for Review" button  
else if (canView) → "View" button
else → "No actions available"
```

### 2. Student Dashboard Link
**File:** `resources/js/pages/dashboard/student/index.tsx`

Added blue "My Research" button to student dashboard as primary call-to-action.

### 3. Activity History Component
**File:** `resources/js/components/research/status-history.tsx`

Refactored and enhanced to show human-readable activity entries instead of raw status changes.

**Display Improvements:**
- Human-readable action labels (e.g., "Research Created", "Submitted for Review")
- Colored icons for action types
- Separate display of notes and reasons
- Actor information and timestamps
- Chronologically ordered

### 4. Comprehensive Tests
**Files:**
- `status-badge.test.tsx` - Status color testing
- `research-read-only-banner.test.tsx` - Read-only state testing
- `research-save-decision-modal.test.tsx` - Modal variants
- `workflow-note-modal.test.tsx` - Hard-delete validation
- `status-history.test.tsx` - Activity history rendering
- `research-status.test.ts` - Status helper functions
- `workflow-actions-capability.test.tsx` - Capability-driven actions

### 5. Manual Test Scenarios
**File:** `MANUAL_ROLE_BASED_TESTS.md`

24 detailed browser-based test scenarios covering all roles and workflows.

---

## Key Features by User Role

### Student
- **Can See:** My Research page with linked research only
- **Cannot See:** Archived research, staff actions, researcher lists
- **Actions Available:**
  - Edit: draft_invited and returned research
  - Submit: returned research
  - View: submitted and posted research

### Faculty
- **No Changes:** Faculty My Research page works as before
- **Still Sees:** All statuses including archived (if adviser)
- **Still Can:** Create, submit, return, post research

### Staff
- **No Changes:** Staff Manage Research page works as before
- **Still Sees:** All research including archived
- **Still Can:** All staff actions (archive, restore, hard-delete)

### Public/Unlinked Users
- **No Changes:** Browse pages work as before
- **See:** Only Posted research

---

## Status Filter Options

All pages now support filtering by:
- **Draft** - Initial unsent research
- **Draft (Invited)** - Invitations sent to students
- **Submitted for Review** - Awaiting Faculty review
- **Returned for Revision** - Sent back to students for changes
- **Posted** - Published in repository
- **Archived** - No longer active (hidden from students)

**Note:** Status field is never "draft_restored" - restored research remains "draft".

---

## Status Badge Colors

| Status | Color |
|--------|-------|
| draft | Slate (gray) |
| draft_invited | Blue |
| submitted | Amber |
| returned | Rose (pink) |
| posted | Green |
| archived | Slate (gray) |

---

## Component Integration

### My Research Page Flow
```
Student Dashboard
    ↓
[My Research Button] (blue)
    ↓
/student/my-researches
    ├─ Search & Filter Section
    ├─ Research Cards Grid
    │  ├─ Title + Program
    │  ├─ Status Badge
    │  ├─ Read-only Reason (if applicable)
    │  └─ Action Button (Edit/Submit/View)
    └─ Empty State (if no research)
```

### Activity History Timeline
```
/research/{id}/show
    ↓
Activity History Card
    ├─ Recent Activity Entry
    │  ├─ Action Icon
    │  ├─ Action Label ("Research Created", etc.)
    │  ├─ Timestamp
    │  ├─ Actor Name
    │  └─ Note/Reason (if present)
    └─ ... (more entries chronologically)
```

---

## Testing Checklist

### Before Deploying Phase 6:

**Backend Verification:**
- [ ] `/student/my-researches` endpoint returns student's research
- [ ] Each research includes full `capabilities` object
- [ ] Archived research is filtered out for students
- [ ] `readOnlyReason` field populated correctly
- [ ] Activity history entries are role-filtered

**Frontend Tests:**
- [ ] All test files compile without errors
- [ ] Tests can be run with `npx vitest run`
- [ ] No TypeScript errors: `npm run types`
- [ ] No linting errors: `npm run lint`

**Manual Testing (Primary):**
1. Student navigates to My Research - [See MANUAL_ROLE_BASED_TESTS.md, Scenario 1-10]
2. Faculty still sees their research - [See MANUAL_ROLE_BASED_TESTS.md, Scenario 12]
3. Staff manage page works - [See MANUAL_ROLE_BASED_TESTS.md, Scenario 13]
4. Public Browse unaffected - [See MANUAL_ROLE_BASED_TESTS.md, Scenario 14]
5. Activity History displays - [See MANUAL_ROLE_BASED_TESTS.md, Scenario 15-16]
6. Hard-delete works - [See MANUAL_ROLE_BASED_TESTS.md, Scenario 19]
7. Responsive design works - [See MANUAL_ROLE_BASED_TESTS.md, Scenario 23]

---

## Common Issues & Solutions

### Issue: My Research page shows no research for linked student
**Solution:** 
- Check backend returns research list for `/student/my-researches`
- Verify student is actually linked via researcher relationship
- Check capabilities are not all false

### Issue: Status badge shows wrong color
**Solution:**
- Verify status value is lowercase (draft_invited, not draft-invited)
- Check research-status.ts has correct badge colors
- Clear browser cache (hard refresh Ctrl+Shift+R)

### Issue: Activity History shows raw action_type instead of label
**Solution:**
- Check action_type spelling matches expected values
- Verify new action types added to ACTION_TYPE_LABELS in status-history.tsx
- Backend action type enum must match frontend expectations

### Issue: Student sees staff buttons or actions
**Solution:**
- Never show actions based on role alone - always check capabilities
- Backend must return false for staff-only capabilities for student users
- Do not hard-code role checks in component conditionals

### Issue: Hard-delete dialog not accepting input
**Solution:**
- Ensure DELETE input field is case-sensitive (must be exact "DELETE")
- Verify reason field has content
- Check both validations pass before enabling button

---

## Files Reference

### Core Pages
- `resources/js/pages/research/my-researches.tsx` - Student My Research
- `resources/js/pages/dashboard/student/index.tsx` - Dashboard with link

### Components
- `resources/js/components/research/status-badge.tsx` - Status display
- `resources/js/components/research/status-history.tsx` - Activity History
- `resources/js/components/research/research-read-only-banner.tsx` - Read-only notice
- `resources/js/components/research/workflow-actions.tsx` - Action buttons
- `resources/js/components/modals/research-save-decision-modal.tsx` - Invitation modal
- `resources/js/components/modals/workflow-note-modal.tsx` - Reason modals

### Types
- `resources/js/types/models.ts` - TypeScript contracts

### Libraries
- `resources/js/lib/research-status.ts` - Status helpers and filters

### Tests
- `resources/js/**/*.test.tsx` - Component tests
- `resources/js/**/*.test.ts` - Unit tests

### Documentation
- `FRONTEND_PHASE_6_SUMMARY.md` - Detailed implementation summary
- `MANUAL_ROLE_BASED_TESTS.md` - 24 browser test scenarios
- (This file) Quick Reference Guide

---

## Backend Response Contract

### GET /student/my-researches
```typescript
{
  researches: Array<{
    id: number
    research_title: string
    program: { id: number; name: string }
    status: ResearchStatus // "draft" | "draft_invited" | "submitted" | "returned" | "posted"
    capabilities: {
      canView: boolean
      canEdit: boolean
      canManageResearchers: boolean
      canSendInitialInvitations: boolean
      canUseInvitationSaveDecision: boolean
      canSubmit: boolean
      canReturnForRevision: boolean
      canPost: boolean
      canArchive: boolean
      canRestore: boolean
      canHardDelete: boolean
      readOnlyReason?: string | null
    }
  }>
  filters?: {
    search?: string
    status?: string
  }
}
```

### GET /research/{id}/status-history
```typescript
{
  data: Array<{
    id: number
    action_type: string // e.g., "create_research_entry", "submit_research_entry"
    created_at?: string // ISO 8601 datetime
    modified_by?: string | null // Actor name
    metadata?: {
      note?: string
      reason?: string
      [key: string]: unknown
    }
  }>
}
```

---

## Performance Considerations

### Optimizations Built-in
- Activity History entries lazy-loaded via separate API call
- Research list uses efficient column selection
- Status filters reduce rendered DOM nodes
- No unnecessary re-renders (React.memo on expensive components)

### Potential Future Optimizations
- Paginate My Research if 100+ entries
- Debounce search input
- Virtualize long activity history lists
- Cache status filter options

---

## Accessibility Notes

All components support:
- ✅ Keyboard navigation (Tab, Enter, Escape)
- ✅ Screen reader labels and ARIA attributes
- ✅ Color-blind friendly status badges + icons
- ✅ Focus indicators
- ✅ Touch-friendly button sizes (48px minimum)
- ✅ Responsive on mobile/tablet

---

## Version History

**Phase 6 (Current):**
- Initial implementation
- Student My Research page
- Activity History enhancement
- Status filter updates
- Comprehensive tests

**Previous Phases:**
- Phase 1-5: Types, Status UI, Pages, Form, Modals, Workflows

---

## Contact & Support

For issues or questions:
1. Check MANUAL_ROLE_BASED_TESTS.md for specific scenarios
2. Review FRONTEND_PHASE_6_SUMMARY.md for detailed technical info
3. Check this guide's "Common Issues & Solutions" section
4. Run tests with `npx vitest run --reporter=verbose` for details
5. Check browser console for JavaScript errors
6. Check network tab for API response issues
