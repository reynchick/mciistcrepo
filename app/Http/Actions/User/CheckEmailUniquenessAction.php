<?php

namespace App\Http\Actions\User;

use App\Models\User;
use Illuminate\Http\JsonResponse;

class CheckEmailUniquenessAction
{
    /**
     * Check if an email is unique for user creation/edit.
     *
     * @param string $email The email to check
     * @param int|null $ignoreId Optional user ID to ignore (for edit mode)
     * @return JsonResponse
     */
    public function execute(string $email, ?int $ignoreId = null): JsonResponse
    {
        if (empty($email)) {
            return response()->json([
                'unique' => false,
                'error' => 'No email provided'
            ], 400);
        }

        $query = User::where('email', $email);
        
        if ($ignoreId) {
            $query->where('id', '!=', $ignoreId);
        }
        
        $exists = $query->exists();
        
        return response()->json(['unique' => !$exists]);
    }
}
