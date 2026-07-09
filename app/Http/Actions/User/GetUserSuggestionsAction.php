<?php

namespace App\Http\Actions\User;

use App\Models\User;
use Illuminate\Support\Collection;

class GetUserSuggestionsAction
{
    /**
     * Get user suggestions for autocomplete based on search query.
     *
     * @param string $query Search term
     * @param int $limit Maximum number of suggestions to return
     * @return Collection
     */
    public function execute(string $query, int $limit = 10): Collection
    {
        if (strlen($query) < 2) {
            return collect([]);
        }

        $searchTerm = strtolower($query);

        // Search users - case insensitive using LOWER()
        $users = User::with('roles')
            ->where(function($q) use ($searchTerm, $query) {
                $q->whereRaw('LOWER(first_name) LIKE ?', ["%{$searchTerm}%"])
                  ->orWhereRaw('LOWER(middle_name) LIKE ?', ["%{$searchTerm}%"])
                  ->orWhereRaw('LOWER(last_name) LIKE ?', ["%{$searchTerm}%"])
                  ->orWhereRaw('LOWER(email) LIKE ?', ["%{$searchTerm}%"])
                  ->orWhere('student_id', 'like', "%{$query}%")
                  ->orWhere('faculty_id', 'like', "%{$query}%");
            })
            ->limit($limit)
            ->get();

        $suggestions = collect();

        // Add user name suggestions
        foreach ($users as $user) {
            $name = trim(implode(' ', array_filter([
                $user->first_name,
                $user->middle_name,
                $user->last_name
            ])));
            
            $identifiers = [];
            if ($user->student_id) {
                $identifiers[] = "Student ID: {$user->student_id}";
            }
            if ($user->faculty_id) {
                $identifiers[] = "Faculty ID: {$user->faculty_id}";
            }
            if ($user->email) {
                $identifiers[] = $user->email;
            }
            
            $label = $name;
            if (!empty($identifiers)) {
                $label .= ' (' . implode(', ', $identifiers) . ')';
            }
            
            $suggestions->push([
                'id' => $user->id,
                'name' => $label,
            ]);
        }

        // Add email-only suggestions if query looks like an email
        if (strpos($query, '@') !== false) {
            $emailUsers = User::whereRaw('LOWER(email) LIKE ?', ["%{$searchTerm}%"])
                ->limit(5)
                ->get();
            
            foreach ($emailUsers as $user) {
                // Check if not already in suggestions
                $exists = $suggestions->contains('id', $user->id);
                if (!$exists) {
                    $suggestions->push([
                        'id' => $user->id,
                        'name' => $user->email,
                    ]);
                }
            }
        }

        return $suggestions->take($limit);
    }
}
