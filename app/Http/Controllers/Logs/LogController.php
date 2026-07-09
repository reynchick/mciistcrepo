<?php

namespace App\Http\Controllers\Logs;

use App\Http\Controllers\Controller;
use App\Models\UserAuditLog;
use App\Models\FacultyAuditLog;
use App\Models\ResearchEntryLog;
use App\Models\ResearchAccessLog;
use App\Models\KeywordSearchLog;
use Illuminate\Http\Request;
use Inertia\Inertia;

class LogController extends Controller
{
    private const LOG_TYPES = [
        'user-audit' => [
            'model' => UserAuditLog::class,
            'title' => 'User Audit Logs',
            'description' => 'Track user account changes and modifications',
            'relations' => ['targetUser'],
        ],
        'faculty-audit' => [
            'model' => FacultyAuditLog::class,
            'title' => 'Faculty Audit Logs',
            'description' => 'Track faculty member changes and modifications',
            'relations' => ['targetFaculty'],
        ],
        'research-entry' => [
            'model' => ResearchEntryLog::class,
            'title' => 'Research Entry Logs',
            'description' => 'Track research entries and modifications',
            'relations' => ['targetResearch'],
        ],
        'research-access' => [
            'model' => ResearchAccessLog::class,
            'title' => 'Research Access Logs',
            'description' => 'Track research downloads and views',
            'relations' => ['research', 'research.keywords'],
        ],
        'keyword-search' => [
            'model' => KeywordSearchLog::class,
            'title' => 'Keyword Search Logs',
            'description' => 'Track keyword searches performed',
            'relations' => ['user', 'keyword'],
        ],
    ];

    public function index(Request $request, string $type)
    {
        abort_unless(isset(self::LOG_TYPES[$type]), 404);

        $config = self::LOG_TYPES[$type];
        $modelClass = $config['model'];
        $relations = $config['relations'] ?? [];

        $query = $modelClass::query()->with($relations);

        // Apply date filters
        $dateFrom = $request->input('date_from');
        $dateTo = $request->input('date_to');
        
        // Handle date presets
        if ($preset = $request->input('date_preset')) {
            $now = now();
            switch ($preset) {
                case 'today':
                    $dateFrom = $now->toDateString();
                    $dateTo = $now->toDateString();
                    break;
                case 'yesterday':
                    $dateFrom = $now->subDay()->toDateString();
                    $dateTo = $dateFrom;
                    break;
                case 'last7':
                    $dateFrom = $now->subDays(6)->toDateString();
                    $dateTo = now()->toDateString();
                    break;
                case 'last30':
                    $dateFrom = $now->subDays(29)->toDateString();
                    $dateTo = now()->toDateString();
                    break;
                case 'thisMonth':
                    $dateFrom = $now->startOfMonth()->toDateString();
                    $dateTo = now()->toDateString();
                    break;
                case 'lastMonth':
                    $dateFrom = $now->subMonth()->startOfMonth()->toDateString();
                    $dateTo = $now->subMonth()->endOfMonth()->toDateString();
                    break;
            }
        }
        
        if ($dateFrom) {
            $query->whereDate('created_at', '>=', $dateFrom);
        }

        if ($dateTo) {
            $query->whereDate('created_at', '<=', $dateTo);
        }

        // Apply action filter (user-audit, faculty-audit, research-entry)
        if ($action = $request->input('action')) {
            if (in_array($type, ['user-audit', 'faculty-audit', 'research-entry'])) {
                $query->where('action_type', $action);
            }
        }

        // Apply modified by user filter (research-entry)
        if ($modifiedByUserId = $request->input('modified_by_user_id')) {
            if ($type === 'research-entry') {
                $query->where('modified_by', $modifiedByUserId);
            }
        }

        // Apply research search filter (research-access)
        if ($researchSearch = $request->input('research_search')) {
            if ($type === 'research-access') {
                $searchTerm = trim($researchSearch);
                $query->whereHas('research', function ($q) use ($searchTerm) {
                    $q->where('research_title', 'like', '%' . $searchTerm . '%')
                      ->orWhereHas('keywords', function ($kq) use ($searchTerm) {
                          $kq->where('keyword_name', 'like', '%' . $searchTerm . '%');
                      });
                });
            }
        }

        // Apply keyword search filter (keyword-search)
        if ($keywordSearch = $request->input('keyword_search')) {
            if ($type === 'keyword-search') {
                $query->where(function ($q) use ($keywordSearch) {
                    $q->where('search_term', 'like', '%' . $keywordSearch . '%')
                      ->orWhereHas('keyword', function ($kq) use ($keywordSearch) {
                          $kq->where('keyword_name', 'like', '%' . $keywordSearch . '%');
                      });
                });
            }
        }

        // Sorting
        $sortBy = $request->input('sort_by', 'created_at');
        $sortOrder = $request->input('sort_order', 'desc');
        $query->orderBy($sortBy, $sortOrder);

        $logs = $query->paginate(15)->withQueryString();

        $availableTypes = array_map(fn($key, $value) => [
            'value' => $key,
            'label' => $value['title'],
        ], array_keys(self::LOG_TYPES), self::LOG_TYPES);

        $filterOptions = $this->getFilterOptions($type);

        return Inertia::render('Logs/Index', [
            'logs' => $logs,
            'logType' => $type,
            'logConfig' => [
                'title' => $config['title'],
                'description' => $config['description'],
            ],
            'availableTypes' => $availableTypes,
            'filters' => $request->only([
                'date_from', 
                'date_to', 
                'action', 
                'modified_by_user_id',
                'research_search',
                'keyword_search',
                'sort_by', 
                'sort_order'
            ]),
            'filterOptions' => $filterOptions,
        ]);
    }

    private function getFilterOptions(string $type): array
    {
        $options = [];

        // Action filters for user-audit
        if ($type === 'user-audit') {
            $options['actions'] = [
                ['value' => 'create_user', 'label' => 'Created'],
                ['value' => 'update_user', 'label' => 'Updated'],
                ['value' => 'deactivate_user', 'label' => 'Deactivated'],
            ];
        }

        // Action filters for faculty-audit
        if ($type === 'faculty-audit') {
            $options['actions'] = [
                ['value' => 'create_faculty', 'label' => 'Created'],
                ['value' => 'update_faculty', 'label' => 'Updated'],
                ['value' => 'delete_faculty', 'label' => 'Deleted'],
            ];
        }

        // Action filters for research-entry with archive
        if ($type === 'research-entry') {
            $options['actions'] = [
                ['value' => 'create_research_entry', 'label' => 'Created'],
                ['value' => 'update_research_entry', 'label' => 'Updated'],
                ['value' => 'archive_research_entry', 'label' => 'Archive'],
            ];
        }

        // Modified by users filter for research-entry
        if ($type === 'research-entry') {
            $options['users'] = \App\Models\User::whereIn('role', ['Administrator', 'MCIIS Staff'])
                ->orderBy('name')
                ->get()
                ->map(fn($user) => ['value' => $user->id, 'label' => $user->name])
                ->toArray();
        }

        // No predefined options for research-access (using search bar instead)
        // No predefined options for keyword-search (using search bar instead)

        return $options;
    }

    public function show(Request $request, string $type, int $id)
    {
        abort_unless(isset(self::LOG_TYPES[$type]), 404);

        $config = self::LOG_TYPES[$type];
        $modelClass = $config['model'];
        
        // Define relations based on log type
        $relations = [];
        
        switch ($type) {
            case 'user-audit':
                $relations = ['targetUser', 'modifiedByUser'];
                break;
            case 'faculty-audit':
                $relations = ['targetFaculty', 'modifiedByUser'];
                break;
            case 'research-entry':
                $relations = ['targetResearch', 'modifiedByUser'];
                break;
            case 'research-access':
                $relations = ['research', 'user'];
                break;
            case 'keyword-search':
                $relations = ['keyword', 'user'];
                break;
        }

        $log = $modelClass::with($relations)->findOrFail($id);

        return response()->json([
            'data' => $log,
        ]);
    }
}
