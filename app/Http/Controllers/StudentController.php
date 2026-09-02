<?php

namespace App\Http\Controllers;

use App\Models\Student;
use App\Models\User;
use App\Models\Role;
use App\Mail\StudentAccessApprovedMail;
use App\Models\UserAuditLog;
use App\Observers\UserObserver;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class StudentController extends Controller
{
    /**
     * Display a listing of students.
     */
    public function index(Request $request): Response
    {
        $query = User::whereHas('roles', function ($q) {
            $q->where('name', 'Student');
        });

        // Search by name, email, or student ID
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->whereRaw("CONCAT(first_name, ' ', COALESCE(middle_name, ''), ' ', last_name) LIKE ?", ["%{$search}%"])
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('student_id', 'like', "%{$search}%");
            });
        }

        // Filter by access status
        if ($request->filled('status')) {
            $status = $request->input('status');
            if ($status === 'approved') {
                $query->where('student_access_approved', true);
            } elseif ($status === 'unapproved') {
                $query->where('student_access_approved', false);
            } elseif ($status === 'revoked') {
                $query->whereNotNull('student_access_revoked_at');
            }
        }

        // Sort
        $sortBy = $request->input('sort_by', 'last_name');
        $sortOrder = $request->input('sort_order', 'asc');
        
        if (in_array($sortBy, ['first_name', 'middle_name', 'last_name', 'student_id', 'email', 'student_access_approved_at', 'created_at', 'last_login'])) {
            $query->orderBy($sortBy, $sortOrder);
        }

        $students = $query->paginate(50)->appends($request->query());

        // Add display data
        $students->transform(function ($student) {
            return [
                'id' => $student->id,
                'first_name' => $student->first_name,
                'middle_name' => $student->middle_name,
                'last_name' => $student->last_name,
                'student_id' => $student->student_id,
                'email' => $student->email,
                'access_status' => $student->student_access_revoked_at ? 'revoked' : ($student->student_access_approved ? 'approved' : 'unapproved'),
                'access_approved' => $student->student_access_approved,
                'access_approved_at' => $student->student_access_approved_at?->format('M d, Y'),
                'access_revoked_at' => $student->student_access_revoked_at?->format('M d, Y'),
                'created_at' => $student->created_at->format('M d, Y'),
                'last_login' => $student->last_login_at?->format('M d, Y H:i') ?? 'Never',
                'deleted_at' => $student->deleted_at,
            ];
        });

        return Inertia::render('admin/students/index', [
            'students' => $students,
            'filters' => [
                'search' => $request->input('search'),
                'status' => $request->input('status'),
                'sort_by' => $sortBy,
                'sort_order' => $sortOrder,
            ],
        ]);
    }

    /**
     * Show the form for creating a new student.
     */
    public function create(): Response
    {
        return Inertia::render('admin/students/create');
    }

    /**
     * Store a newly created student.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'first_name' => ['required', 'string', 'max:255'],
            'middle_name' => ['nullable', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'student_id' => ['required', 'regex:/^\d{4}-\d{5}$/', 'unique:users,student_id'],
            'email' => ['required', 'email', 'ends_with:@usep.edu.ph', 'unique:users,email'],
        ], [
            'student_id.regex' => 'Student ID must be in format YYYY-NNNNN (e.g., 2023-00800)',
            'email.ends_with' => 'Email must be a USeP email address (@usep.edu.ph)',
        ]);

        $studentRole = Role::where('name', 'Student')->firstOrFail();

        // Create user with student access already approved
        $user = User::create(array_merge($validated, [
            'student_access_approved' => true,
            'student_access_approved_at' => now(),
            'created_by_admin' => true,
            'password' => null,
            'email_verified_at' => now(),
        ]));

        // Attach Student role
        $user->roles()->attach($studentRole->id);

        // Log this creation
        UserObserver::$customMetadata = [
            'source' => UserAuditLog::SOURCE_ADMIN_CREATED,
            'context' => UserAuditLog::CONTEXT_STUDENT_CREATED,
            'note' => 'Student record created by administrator',
        ];

        // Send welcome email
        Mail::to($user->email)->send(new StudentAccessApprovedMail($user));

        return redirect()->route('admin.students.index')
            ->with('success', "Student {$user->full_name} added successfully.");
    }

    /**
     * Show the form for editing a student.
     */
    public function edit(User $student): Response|RedirectResponse
    {
        // Verify this is a student
        if (!$student->roles()->where('name', 'Student')->exists()) {
            return redirect()->route('admin.students.index')
                ->with('error', 'User is not a student.');
        }

        return Inertia::render('admin/students/edit', [
            'student' => [
                'id' => $student->id,
                'first_name' => $student->first_name,
                'middle_name' => $student->middle_name,
                'last_name' => $student->last_name,
                'student_id' => $student->student_id,
                'email' => $student->email,
                'access_approved' => $student->student_access_approved,
                'access_status' => $student->student_access_revoked_at ? 'revoked' : ($student->student_access_approved ? 'approved' : 'unapproved'),
            ],
        ]);
    }

    /**
     * Update a student record.
     */
    public function update(Request $request, User $student): RedirectResponse
    {
        // Verify this is a student
        if (!$student->roles()->where('name', 'Student')->exists()) {
            return redirect()->route('admin.students.index')
                ->with('error', 'User is not a student.');
        }

        $validated = $request->validate([
            'first_name' => ['required', 'string', 'max:255'],
            'middle_name' => ['nullable', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'student_id' => ['required', 'regex:/^\d{4}-\d{5}$/', Rule::unique('users', 'student_id')->ignore($student->id)],
            'email' => ['required', 'email', 'ends_with:@usep.edu.ph', Rule::unique('users', 'email')->ignore($student->id)],
        ], [
            'student_id.regex' => 'Student ID must be in format YYYY-NNNNN (e.g., 2023-00800)',
            'email.ends_with' => 'Email must be a USeP email address (@usep.edu.ph)',
        ]);

        UserObserver::$customMetadata = [
            'source' => UserAuditLog::SOURCE_ADMIN_CREATED,
            'context' => UserAuditLog::CONTEXT_PROFILE_UPDATE,
            'note' => 'Student record updated by administrator',
        ];

        $student->update($validated);

        return redirect()->route('admin.students.index')
            ->with('success', "Student {$student->full_name} updated successfully.");
    }

    /**
     * Approve student access.
     */
    public function approveAccess(Request $request, User $student): RedirectResponse
    {
        // Verify this is a student
        if (!$student->roles()->where('name', 'Student')->exists()) {
            return redirect()->route('admin.students.index')
                ->with('error', 'User is not a student.');
        }

        if ($student->student_access_approved && !$student->student_access_revoked_at) {
            return redirect()->back()->with('error', 'This student is already approved.');
        }

        UserObserver::$customMetadata = [
            'source' => UserAuditLog::SOURCE_ADMIN_CREATED,
            'context' => UserAuditLog::CONTEXT_STUDENT_ACCESS_APPROVED,
            'note' => 'Student access approved by administrator',
        ];

        $student->update([
            'student_access_approved' => true,
            'student_access_approved_at' => now(),
            'student_access_revoked_at' => null,
        ]);

        Mail::to($student->email)->send(new StudentAccessApprovedMail($student));

        return redirect()->back()
            ->with('success', "Access approved for {$student->full_name}.");
    }

    /**
     * Revoke/deactivate student access.
     */
    public function revokeAccess(Request $request, User $student): RedirectResponse
    {
        // Verify this is a student
        if (!$student->roles()->where('name', 'Student')->exists()) {
            return redirect()->route('admin.students.index')
                ->with('error', 'User is not a student.');
        }

        if ($student->student_access_revoked_at) {
            return redirect()->back()->with('error', 'This student access is already revoked.');
        }

        UserObserver::$customMetadata = [
            'source' => UserAuditLog::SOURCE_ADMIN_CREATED,
            'context' => UserAuditLog::CONTEXT_STUDENT_ACCESS_REVOKED,
            'note' => 'Student access revoked by administrator',
        ];

        $student->update([
            'student_access_revoked_at' => now(),
        ]);

        return redirect()->back()
            ->with('success', "Access revoked for {$student->full_name}.");
    }

    /**
     * Delete a student record.
     * Only safe if no associated data exists.
     */
    public function destroy(User $student): RedirectResponse
    {
        // Verify this is a student
        if (!$student->roles()->where('name', 'Student')->exists()) {
            return redirect()->route('admin.students.index')
                ->with('error', 'User is not a student.');
        }

        $name = $student->full_name;

        UserObserver::$customMetadata = [
            'source' => UserAuditLog::SOURCE_ADMIN_CREATED,
            'context' => UserAuditLog::CONTEXT_RECORD_DELETED,
            'note' => 'Student record deleted by administrator',
        ];

        $student->delete();

        return redirect()->route('admin.students.index')
            ->with('success', "Student {$name} has been deleted.");
    }

    /**
     * Download CSV template for bulk import.
     */
    public function downloadTemplate(): \Symfony\Component\HttpFoundation\BinaryFileResponse
    {
        $headers = ['first_name', 'middle_name', 'last_name', 'student_id', 'email'];
        
        $filename = 'student-import-template-' . now()->format('Y-m-d') . '.csv';
        
        return response()->streamDownload(function () use ($headers) {
            $out = fopen('php://output', 'w');
            fputcsv($out, $headers);
            fputcsv($out, ['John', 'Michael', 'Doe', '2023-00800', 'john.doe@usep.edu.ph']);
            fputcsv($out, ['Maria', null, 'Santos', '2023-00801', 'maria.santos@usep.edu.ph']);
            fclose($out);
        }, $filename);
    }

    /**
     * Import students from CSV.
     */
    public function importCsv(Request $request): RedirectResponse
    {
        $request->validate([
            'csv_file' => ['required', 'file', 'mimes:csv,txt', 'max:5120'], // 5MB max
        ]);

        $file = $request->file('csv_file');
        $path = $file->getRealPath();
        
        $handle = fopen($path, 'r');
        $headers = fgetcsv($handle);

        // Validate headers
        $requiredHeaders = ['first_name', 'middle_name', 'last_name', 'student_id', 'email'];
        $headersDiff = array_diff($requiredHeaders, $headers);

        if (!empty($headersDiff)) {
            fclose($handle);
            return redirect()->back()->with('error', 'CSV is missing required columns: ' . implode(', ', $headersDiff));
        }

        // Parse and validate all rows first
        $rows = [];
        $errors = [];
        $rowNumber = 2; // Start at 2 (after header)
        
        $existingEmails = User::pluck('email')->flip();
        $existingStudentIds = User::pluck('student_id')->flip();
        $uploadedEmails = [];
        $uploadedStudentIds = [];

        while (($row = fgetcsv($handle)) !== false) {
            if (empty(array_filter($row))) {
                $rowNumber++;
                continue; // Skip empty rows
            }

            if (count($row) < count($headers)) {
                $errors[] = "Row {$rowNumber}: Insufficient columns";
                $rowNumber++;
                continue;
            }

            $data = array_combine($headers, array_slice($row, 0, count($headers)));

            // Validate each field
            $rowErrors = [];

            if (empty($data['first_name'])) {
                $rowErrors[] = 'first_name is required';
            }

            if (empty($data['last_name'])) {
                $rowErrors[] = 'last_name is required';
            }

            if (empty($data['student_id'])) {
                $rowErrors[] = 'student_id is required';
            } elseif (!preg_match('/^\d{4}-\d{5}$/', $data['student_id'])) {
                $rowErrors[] = 'student_id must be in format YYYY-NNNNN';
            } elseif (isset($existingStudentIds[$data['student_id']])) {
                $rowErrors[] = 'student_id already exists in system';
            } elseif (isset($uploadedStudentIds[$data['student_id']])) {
                $rowErrors[] = 'student_id is duplicated in this upload';
            }

            if (empty($data['email'])) {
                $rowErrors[] = 'email is required';
            } elseif (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
                $rowErrors[] = 'email format is invalid';
            } elseif (!str_ends_with($data['email'], '@usep.edu.ph')) {
                $rowErrors[] = 'email must be a USeP email (@usep.edu.ph)';
            } elseif (isset($existingEmails[$data['email']])) {
                $rowErrors[] = 'email already exists in system';
            } elseif (isset($uploadedEmails[$data['email']])) {
                $rowErrors[] = 'email is duplicated in this upload';
            }

            if (!empty($rowErrors)) {
                $errors[] = "Row {$rowNumber}: " . implode('; ', $rowErrors);
                $rowNumber++;
                continue;
            }

            $uploadedEmails[$data['email']] = true;
            $uploadedStudentIds[$data['student_id']] = true;
            
            $rows[] = array_merge($data, ['row_number' => $rowNumber]);
            $rowNumber++;
        }

        fclose($handle);

        if (!empty($errors)) {
            return redirect()->back()
                ->with('errors', $errors)
                ->with('error_count', count($errors));
        }

        if (empty($rows)) {
            return redirect()->back()->with('error', 'No valid rows found in CSV.');
        }

        // Import the rows
        $studentRole = Role::where('name', 'Student')->firstOrFail();
        $successCount = 0;
        $importErrors = [];

        foreach ($rows as $data) {
            try {
                $rowNum = $data['row_number'];
                unset($data['row_number']);

                UserObserver::$customMetadata = [
                    'source' => UserAuditLog::SOURCE_ADMIN_CREATED,
                    'context' => UserAuditLog::CONTEXT_BULK_IMPORT,
                    'note' => 'Student imported via CSV by administrator',
                ];

                $user = User::create(array_merge($data, [
                    'student_access_approved' => true,
                    'student_access_approved_at' => now(),
                    'created_by_admin' => true,
                    'password' => null,
                    'email_verified_at' => now(),
                ]));

                $user->roles()->attach($studentRole->id);

                Mail::to($user->email)->send(new StudentAccessApprovedMail($user));

                $successCount++;
            } catch (\Exception $e) {
                $importErrors[] = "Row {$rowNum}: " . $e->getMessage();
            }
        }

        if (!empty($importErrors)) {
            return redirect()->back()
                ->with('partial_success', true)
                ->with('success_count', $successCount)
                ->with('errors', $importErrors);
        }

        return redirect()->route('admin.students.index')
            ->with('success', "Successfully imported {$successCount} student(s).");
    }

    /**
     * Check email uniqueness.
     */
    public function checkEmail(Request $request): JsonResponse
    {
        $email = $request->input('email', '');
        $ignoreId = $request->input('ignore') ? (int) $request->input('ignore') : null;

        $exists = User::where('email', $email);
        if ($ignoreId) {
            $exists->where('id', '!=', $ignoreId);
        }

        return response()->json([
            'unique' => !$exists->exists(),
        ]);
    }

    /**
     * Check student ID uniqueness.
     */
    public function checkStudentId(Request $request): JsonResponse
    {
        $studentId = $request->input('student_id', '');
        $ignoreId = $request->input('ignore') ? (int) $request->input('ignore') : null;

        $exists = User::where('student_id', $studentId);
        if ($ignoreId) {
            $exists->where('id', '!=', $ignoreId);
        }

        return response()->json([
            'unique' => !$exists->exists(),
        ]);
    }
}
