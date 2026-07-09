<?php

namespace App\Http\Actions\User;

use App\Models\User;
use Illuminate\Http\JsonResponse;

class CheckStudentIdUniquenessAction
{
    /**
     * Check if a student ID is unique for user creation/edit.
     *
     * @param string $studentId The student ID to check
     * @param int|null $ignoreId Optional user ID to ignore (for edit mode)
     * @return JsonResponse
     */
    public function execute(string $studentId, ?int $ignoreId = null): JsonResponse
    {
        if (empty($studentId)) {
            return response()->json([
                'unique' => false,
                'error' => 'No student ID provided'
            ], 400);
        }

        $query = User::where('student_id', $studentId);
        
        if ($ignoreId) {
            $query->where('id', '!=', $ignoreId);
        }
        
        $exists = $query->exists();
        
        return response()->json(['unique' => !$exists]);
    }
}
