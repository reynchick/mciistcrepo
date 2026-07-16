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
            'relations' => ['targetUser', 'modifiedByUser'],
        ],
        'faculty-audit' => [
            'model' => FacultyAuditLog::class,
            'title' => 'Faculty Audit Logs',
            'description' => 'Track faculty member changes and modifications',
            'relations' => ['targetFaculty', 'modifiedByUser'],
        ],
        'research-entry' => [
            'model' => ResearchEntryLog::class,
            'title' => 'Research Entry Logs',
            'description' => 'Track research entries and modifications',
            'relations' => ['targetResearch.researchers', 'modifiedByUser'],
        ],
        'research-access' => [
            'model' => ResearchAccessLog::class,
            'title' => 'Research Access Logs',
            'description' => 'Track research downloads and views',
            'relations' => ['research.researchers', 'research.keywords', 'user'],
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
        $logs->setCollection($logs->getCollection()->map(function ($log) {
            $this->hydrateLogDisplayAttributes($log);

            return $log;
        }));

        $availableTypes = array_map(fn($key, $value) => [
            'value' => $key,
            'label' => $value['title'],
        ], array_keys(self::LOG_TYPES), self::LOG_TYPES);

        $filterOptions = $this->getFilterOptions($type);

        return Inertia::render('logs/index', [
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
                $relations = ['targetResearch.researchers', 'modifiedByUser'];
                break;
            case 'research-access':
                $relations = ['research.researchers', 'research.keywords', 'user'];
                break;
            case 'keyword-search':
                $relations = ['keyword', 'user'];
                break;
        }

        $log = $modelClass::with($relations)->findOrFail($id);
        $this->hydrateLogDisplayAttributes($log);

        return response()->json([
            'data' => $log,
        ]);
    }

    private function hydrateLogDisplayAttributes($log): void
    {
        $targetUser = $log->relationLoaded('targetUser') ? $log->targetUser : null;
        $modifiedByUser = $log->relationLoaded('modifiedByUser') ? $log->modifiedByUser : null;
        $targetFaculty = $log->relationLoaded('targetFaculty') ? $log->targetFaculty : null;
        $user = $log->relationLoaded('user') ? $log->user : null;
        $keyword = $log->relationLoaded('keyword') ? $log->keyword : null;
        $research = $log->relationLoaded('research') ? $log->research : null;
        $targetResearch = $log->relationLoaded('targetResearch') ? $log->targetResearch : null;

        if ($name = $this->resolveDisplayName($targetUser)) {
            $log->setAttribute('target_user_name', $name);
        }

        if ($name = $this->resolveDisplayName($modifiedByUser)) {
            $log->setAttribute('modified_by_user_name', $name);
        }

        if ($name = $this->resolveDisplayName($targetFaculty)) {
            $log->setAttribute('target_faculty_name', $name);
        }

        if ($name = $this->resolveDisplayName($user)) {
            $log->setAttribute('user_name', $name);
        }

        if ($name = $this->resolveKeywordName($keyword)) {
            $log->setAttribute('keyword_name', $name);
        }

        if ($title = $research?->title ?? $targetResearch?->title) {
            $log->setAttribute('research_title', $title);
        }

        if ($researchers = $research?->researchers ?? $targetResearch?->researchers) {
            $researcherNames = $this->resolveResearcherNames($researchers);
            if ($researcherNames) {
                $log->setAttribute('researcher_names', $researcherNames);
            }
        }
    }

    private function resolveDisplayName($model): ?string
    {
        if (! $model) {
            return null;
        }

        $directName = $model->full_name ?? $model->name;
        if (is_string($directName) && trim($directName) !== '') {
            return trim($directName);
        }

        $parts = array_values(array_filter([
            $model->first_name,
            $model->middle_name,
            $model->last_name,
        ], fn ($part) => is_string($part) && trim($part) !== ''));

        return count($parts) > 0 ? trim(implode(' ', $parts)) : null;
    }

    private function resolveKeywordName($model): ?string
    {
        if (! $model) {
            return null;
        }

        $keywordName = $model->keyword_name;

        return is_string($keywordName) && trim($keywordName) !== '' ? trim($keywordName) : null;
    }

    private function resolveResearcherNames($researchers): ?string
    {
        if (! is_iterable($researchers)) {
            return null;
        }

        $items = $researchers instanceof \Illuminate\Support\Collection
            ? $researchers->all()
            : $researchers;

        $names = array_values(array_filter(array_map(fn ($researcher) => $this->resolveDisplayName($researcher), $items)));

        return count($names) > 0 ? implode(', ', $names) : null;
    }
}
