# Manual Role-Based Test Scenarios for Frontend Phase 6

## Overview
The following scenarios require browser-based manual testing across different user roles. These tests verify that:
- Backend capabilities are correctly translated to UI permissions
- No unrelated dashboards, reports, or public Browse features are broken
- The workflow state machine is properly reflected in the UI
- Student My Research entry points are clearly accessible and functional

---

## Test Setup

### Users to Create
1. **Student (Jane Student)** - email: jane@student.edu
   - Linked to one or more research entries via researcher relationship
   - Complete profile

2. **Student (Bob Unlinked)** - email: bob@student.edu
   - No research relationships
   - Can only browse public Posted research

3. **Faculty (Dr. Smith)** - email: smith@faculty.edu
   - Adviser on multiple research entries across different statuses
   - Can submit, return, and post research

4. **MCIIS Staff (Sarah Admin)** - email: sarah@staff.edu
   - Can create, archive, restore, hard-delete research
   - Can manage researcher lists and invitations

5. **Administrator** - email: admin@system.edu
   - Full system access

### Research Test Data
Create research in the following statuses (all by Staff initially):
- **Research A** (draft, invited via initial Faculty invitations)
- **Research B** (draft_invited, students linked)
- **Research C** (submitted, students linked)
- **Research D** (returned, students linked)
- **Research E** (posted, students linked)
- **Research F** (archived, previously had student access)
- **Research G** (draft, no student researchers)

---

## Test Scenarios

### Scenario 1: Student Dashboard - My Research Link
**Setup:** Logged in as Jane Student (linked to Research A, B, C, D, E)

**Steps:**
1. Navigate to `/student/dashboard`
2. Verify "My Research" button is prominently displayed and blue
3. Click "My Research" button
4. Verify redirect to `/student/my-researches`
5. Verify page title is "My Research"
6. Verify descriptive text mentions "Archived research is no longer available"

**Expected Results:**
- ✓ My Research link visible and accessible from student dashboard
- ✓ Page loads without errors
- ✓ Navigation is clear and intuitive

---

### Scenario 2: Student My Research - Card Display
**Setup:** Logged in as Jane Student (linked to Research A, B, C, D, E)

**Steps:**
1. Navigate to `/student/my-researches`
2. Verify research cards display for Research A, B, C, D, E (5 cards)
3. Verify Research F (archived) is NOT displayed
4. For each card, verify:
   - Research title is visible
   - Program name is displayed
   - Status badge is shown with correct color:
     - Draft = slate
     - Draft (Invited) = blue
     - Submitted for Review = amber
     - Returned for Revision = rose
     - Posted = green
   - Appropriate action button is present

**Expected Results:**
- ✓ Only non-archived research shown to students
- ✓ All cards display correctly
- ✓ Status badges use correct colors
- ✓ No archived research visible even if student was previously linked

---

### Scenario 3: Student My Research - Action Buttons (Draft)
**Setup:** Logged in as Jane Student, Research A is draft with invitations sent

**Steps:**
1. Navigate to `/student/my-researches`
2. Locate Research A card (draft with student linked)
3. Verify "Edit" button is displayed
4. Click "Edit" button
5. Verify redirect to `/research/{id}/edit`
6. Verify form loads with full editing capabilities for the student

**Expected Results:**
- ✓ "Edit" button visible for draft_invited research
- ✓ Button navigates correctly
- ✓ Student can edit research details
- ✓ Student can manage their own researcher information

---

### Scenario 4: Student My Research - Action Buttons (Returned)
**Setup:** Logged in as Jane Student, Research D is returned for revision

**Steps:**
1. Navigate to `/student/my-researches`
2. Locate Research D card (returned)
3. Verify "Edit" button is displayed
4. Click button and navigate to edit page
5. Verify form is editable
6. Verify "Submit for Review" action is available in workflow panel
7. Attempt to submit (verify flow works without submitting)

**Expected Results:**
- ✓ "Edit" button visible for returned research
- ✓ Form is fully editable
- ✓ Student can re-submit after making changes
- ✓ No irrelevant actions (Archive, Hard Delete) visible to student

---

### Scenario 5: Student My Research - Action Buttons (Submitted)
**Setup:** Logged in as Jane Student, Research C is submitted

**Steps:**
1. Navigate to `/student/my-researches`
2. Locate Research C card (submitted)
3. Verify button shows "View" only (NOT "Edit" or "Submit")
4. Click "View" button
5. Verify redirect to `/research/{id}`
6. Verify show page displays read-only banner: "Read-only workflow: This research is submitted for review and cannot be edited."
7. Verify all form fields are disabled/read-only
8. Verify workflow panel shows NO edit/submit actions, only view actions

**Expected Results:**
- ✓ Only "View" button shown for submitted research
- ✓ Redirect to show page (not edit)
- ✓ Read-only banner displays with correct reason
- ✓ Form is entirely read-only
- ✓ No workflow actions available except viewing

---

### Scenario 6: Student My Research - Action Buttons (Posted)
**Setup:** Logged in as Jane Student, Research E is posted

**Steps:**
1. Navigate to `/student/my-researches`
2. Locate Research E card (posted)
3. Verify button shows "View" only
4. Click "View" button
5. Navigate to show page
6. Verify read-only banner states: "Read-only workflow: This research has been posted to the repository."
7. Verify form is read-only
8. Verify Activity History is displayed instead of "Status History"

**Expected Results:**
- ✓ Only "View" button for posted research
- ✓ Proper read-only reason displayed
- ✓ Activity History panel shows with human-readable action labels:
  - "Research Created", "Submitted for Review", "Posted to Repository", etc.
- ✓ Timeline shows actors and timestamps

---

### Scenario 7: Student My Research - Read-Only Reason
**Setup:** Logged in as Jane Student viewing multiple statuses

**Steps:**
1. Navigate to `/student/my-researches`
2. Hover over or view each research card
3. For submitted and posted research, verify concise read-only reason is displayed on the card itself

**Expected Results:**
- ✓ Read-only reasons visible on cards without opening details
- ✓ Reasons are concise and user-friendly
- ✓ Layout handles reason text without breaking card layout on mobile

---

### Scenario 8: Student My Research - Search and Filter
**Setup:** Logged in as Jane Student with multiple research entries

**Steps:**
1. Navigate to `/student/my-researches`
2. In search box, type a partial research title
3. Click "Search" or press Enter
4. Verify results are filtered correctly
5. Select different status filters from dropdown:
   - All Statuses
   - Draft
   - Draft (Invited)
   - Submitted for Review
   - Returned for Revision
   - Posted
6. Verify each filter correctly shows/hides research
7. Test combination: select status filter AND search term
8. Click "Reset" button
9. Verify all research is displayed again

**Expected Results:**
- ✓ Search filters by title and ID correctly
- ✓ All statuses except "Archived" available in filter
- ✓ Status filter works independently and in combination with search
- ✓ Reset clears all filters and displays full list
- ✓ No performance issues with filtering

---

### Scenario 9: Student My Research - No Results State
**Setup:** Logged in as Jane Student

**Steps:**
1. Navigate to `/student/my-researches`
2. Search for a non-existent research title
3. Verify message: "No research entries match your search criteria."
4. Click "Reset"
5. Navigate back to `/student/my-researches`
6. Create a filter that returns no results (e.g., filter by a status with no research)
7. Verify appropriate message is shown

**Expected Results:**
- ✓ Clear "no results" message when search yields nothing
- ✓ "Reset" button appears and works
- ✓ No errors or broken UI

---

### Scenario 10: Unlinked Student My Research
**Setup:** Logged in as Bob Unlinked (not linked to any research)

**Steps:**
1. Navigate to `/student/dashboard`
2. Click "My Research" button
3. Verify redirect to `/student/my-researches`
4. Verify empty state message: "You have no research entries yet."

**Expected Results:**
- ✓ Unlinked students can access the page
- ✓ Appropriate empty state message shown
- ✓ No errors or confusion

---

### Scenario 11: Student Cannot Access Archived Research
**Setup:** Logged in as Jane Student (previously linked to Research F before it was archived)

**Steps:**
1. Navigate to `/student/my-researches`
2. Verify Research F does NOT appear in the list
3. Attempt direct navigation to `/research/{F_id}` or `/research/{F_id}/edit`
4. Verify access is denied or redirect to My Research occurs
5. Verify message indicates research is no longer available

**Expected Results:**
- ✓ Archived research never shown to students in My Research
- ✓ Backend enforces access revocation for archived research
- ✓ No accidental access to archived records

---

### Scenario 12: Faculty My Research - Not Affected
**Setup:** Logged in as Dr. Smith (Faculty adviser)

**Steps:**
1. Navigate to `/faculty/my-researches`
2. Verify page still works as before (Phase 6 should NOT change faculty pages)
3. Verify all research entries (including archived) are visible if Dr. Smith is adviser
4. Verify status filters work and include draft_invited and posted
5. Verify existing faculty actions are unchanged

**Expected Results:**
- ✓ Faculty My Research page unaffected
- ✓ All capabilities and filters functional
- ✓ No regressions in existing faculty workflow

---

### Scenario 13: Staff Manage Research - Not Affected
**Setup:** Logged in as Sarah Admin (MCIIS Staff)

**Steps:**
1. Navigate to `/staff/research`
2. Verify page still works (Phase 6 should NOT change staff pages)
3. Verify status filters include draft_invited and posted
4. Verify all staff actions are available
5. Verify archived research is visible to staff

**Expected Results:**
- ✓ Staff Manage Research page unaffected
- ✓ All staff capabilities functional
- ✓ No regressions

---

### Scenario 14: Public Browse - Not Affected
**Setup:** Any role

**Steps:**
1. Navigate to `/browse` (public browse)
2. Verify page loads correctly
3. Verify only "Posted" research is visible
4. Verify status filter (if present) is not affected
5. Navigate to `/student/browse`, `/faculty/browse`, `/staff/browse`
6. Verify these pages are unaffected

**Expected Results:**
- ✓ Public Browse unaffected by Phase 6 changes
- ✓ Only posted research shown
- ✓ Role-specific browse pages functional

---

### Scenario 15: Activity History - Student View
**Setup:** Logged in as Jane Student, viewing Research C (submitted)

**Steps:**
1. Navigate to `/research/{C_id}` (Research C - submitted)
2. Scroll to Activity History panel
3. Verify panel title is "Activity History" (NOT "Status History")
4. Verify entries show:
   - Human-readable action labels: "Research Created", "Submitted for Review", etc.
   - Actor name or "System"
   - Timestamp in user's local timezone
   - Notes/reasons if applicable (e.g., return reasons, archive reasons)
5. Verify icons appear next to each action type
6. Verify entries are chronologically ordered (newest first)

**Expected Results:**
- ✓ Panel titled "Activity History"
- ✓ All actions have human-readable labels
- ✓ Timestamps are accurate and formatted correctly
- ✓ Actor information is visible
- ✓ Notes and reasons display properly (e.g., in styled note blocks)
- ✓ No sensitive data exposed (e.g., invitation tokens)

---

### Scenario 16: Activity History - Faculty View
**Setup:** Logged in as Dr. Smith, viewing Research C (submitted)

**Steps:**
1. Navigate to `/research/{C_id}` (Research C - submitted)
2. Verify Activity History is visible
3. Verify can see actions taken by students (e.g., "submitted", "returned")
4. Verify can see actions taken by faculty (e.g., "return for revision")
5. Verify notes from returns/archives are visible and readable

**Expected Results:**
- ✓ Faculty can see full activity history
- ✓ All action types and notes visible
- ✓ Timeline is useful for understanding research status

---

### Scenario 17: Draft Invited Research - Restored Draft Behavior
**Setup:** Research restored from archive (backend should set isRestoredDraft=true)

**Steps:**
1. Create test research A, send initial invitations, archive it
2. Restore it via backend API
3. As Faculty adviser, navigate to edit page
4. Verify "Invite Researchers" button is NOT visible initially
5. Make changes to researchers (add new researcher)
6. Click "Save Draft"
7. Verify "Save & Send Invitations" modal appears
8. Verify modal explains: "Previous researcher access was revoked when this research was archived."
9. Accept the invitation decision
10. Verify research saved and invitation sent

**Expected Results:**
- ✓ Initial Invite button hidden for restored Draft
- ✓ Invitation modal appears on next save with researcher changes
- ✓ Modal properly explains archive revocation
- ✓ Student can accept invitation to restored research
- ✓ Restored research status remains "draft" (not "draft_restored")

---

### Scenario 18: Removal-Only Confirmation Modal
**Setup:** Faculty removing a researcher from a submitted/returned research

**Steps:**
1. Open a Submitted or Returned research for editing
2. Remove one or more researchers from the list
3. Click "Save Changes"
4. Verify modal appears with title about saving changes
5. Verify "Removed researchers" section shows removed names
6. Verify modal has ONLY two buttons:
   - Cancel
   - Save Changes (NOT "Save Only" or "Save & Send")
7. Click "Save Changes"
8. Verify confirmation closes and research is saved

**Expected Results:**
- ✓ Removal-only modal displays correctly
- ✓ Only Cancel and Save Changes buttons present
- ✓ No invitation-send options for removal-only flow
- ✓ Action completes successfully

---

### Scenario 19: Hard-Delete Confirmation Dialog
**Setup:** Staff or Admin user viewing an archived research

**Steps:**
1. Open archived research show page
2. Locate "Hard Delete" or "Permanently Delete" button in workflow actions
3. Click button
4. Verify dialog appears with:
   - Clear title: "Permanently Delete Research"
   - Warning text about permanent deletion
   - "Reason for deletion" input field
   - Text input that requires typing "DELETE"
5. Leave both fields empty
6. Verify "Permanently Delete" button is DISABLED
7. Enter reason but leave "DELETE" field empty
8. Verify button still DISABLED
9. Enter "DELETE" text but leave reason empty
10. Verify button still DISABLED
11. Fill both fields correctly
12. Verify button becomes ENABLED
13. Click button
14. Verify confirmation closes and research is deleted (or navigate confirms deletion)

**Expected Results:**
- ✓ Hard-delete dialog requires both reason and "DELETE" confirmation
- ✓ Button states are correct (disabled/enabled based on validation)
- ✓ Deletion is permanent and removes research from system
- ✓ Activity log shows hard-delete action with reason

---

### Scenario 20: Status Filters Include All Statuses
**Setup:** Navigate to any staff/faculty research list page

**Steps:**
1. Open `/staff/research` or `/faculty/my-researches`
2. Locate status filter dropdown
3. Verify all statuses present:
   - Draft
   - Draft (Invited)
   - Submitted for Review
   - Returned for Revision
   - Posted
   - Archived
4. Select each status individually
5. Verify correct research entries appear

**Expected Results:**
- ✓ All statuses available in filters
- ✓ draft_invited and posted filters functional
- ✓ Filter correctly displays only matching statuses
- ✓ No "published" filter (replaced by "posted")

---

## Cross-Scenario Regression Tests

### Test 21: Form Data Preservation
**Setup:** Student editing research with pending changes

**Steps:**
1. Navigate to edit research
2. Make changes (title, abstract, etc.)
3. Click away or trigger a modal (e.g., invitation decision)
4. Verify form data is NOT lost
5. Cancel modal and verify all changes still present
6. Resubmit form successfully

**Expected Results:**
- ✓ Form data preserved across modals and cancellations
- ✓ No data loss on page interactions
- ✓ Local draft saved and recovered

---

### Test 22: No Unintended Permission Grants
**Setup:** Student trying to access staff-only actions

**Steps:**
1. Logged in as Jane Student
2. Inspect page HTML for hidden/disabled staff buttons
3. Attempt direct API calls to staff-only endpoints (e.g., hard-delete)
4. Verify backend rejects all requests
5. Verify no UI exposes staff-only actions to students

**Expected Results:**
- ✓ No hidden staff buttons in student UI
- ✓ Backend enforces authorization
- ✓ Student cannot accidentally trigger staff actions

---

### Test 23: Responsive Design - Mobile
**Setup:** View My Research page on mobile device or browser at 375px width

**Steps:**
1. Navigate to `/student/my-researches`
2. Verify layout is readable and functional
3. Verify cards stack vertically
4. Verify buttons are clickable without scrolling horizontally
5. Verify search and filter controls are accessible
6. Test on tablet width (768px)

**Expected Results:**
- ✓ Mobile layout is readable
- ✓ Touch-friendly button sizes
- ✓ No horizontal scrolling needed
- ✓ Tablet layout works well

---

### Test 24: Accessibility - Keyboard Navigation
**Setup:** Using keyboard only (no mouse)

**Steps:**
1. Tab through My Research page
2. Verify all buttons are reachable
3. Verify focus indicators are visible
4. Press Enter on focused buttons to trigger actions
5. Tab through modals and dialogs
6. Verify Escape key closes dialogs

**Expected Results:**
- ✓ Full keyboard navigation possible
- ✓ Focus indicators visible
- ✓ No keyboard traps
- ✓ Modals handle escape key properly

---

## Summary Checklist

- [ ] Student My Research page created and accessible
- [ ] Status filters include draft_invited and posted
- [ ] Activity History displays with proper action labels
- [ ] Student cards show only capability-driven actions
- [ ] Archived research not shown to students
- [ ] Read-only banner displays with backend reason
- [ ] No changes to Faculty My Research
- [ ] No changes to Staff Manage Research
- [ ] No changes to Public Browse
- [ ] Hard-delete dialog validates properly
- [ ] Removal-only modal displays correctly
- [ ] Restored Draft hides initial invite button
- [ ] All tests pass in browser across roles
- [ ] No regressions in existing features
- [ ] Responsive design works on mobile/tablet
- [ ] Keyboard navigation functional
- [ ] All accessibility requirements met

---

## Notes for Test Execution

1. **Test in order:** Start with Scenarios 1-6 as they cover the main flow
2. **Use test data:** Create the 7 test research entries in various statuses
3. **Switch roles:** Test each scenario with the appropriate user role
4. **Check browser console:** Verify no JavaScript errors or warnings
5. **Check network tab:** Verify all API calls return expected status codes
6. **Verify database:** Ensure changes are persisted (e.g., after hard-delete)
7. **Document failures:** Record any discrepancies with screenshots/videos
8. **Report issues:** Note if any scenarios do NOT match expected results
