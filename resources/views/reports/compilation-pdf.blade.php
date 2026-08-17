<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Research Compilation</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            font-size: 11pt;
            line-height: 1.5;
            color: #222;
            margin: 0;
            padding: 24px;
        }

        h1 {
            font-size: 18pt;
            margin-bottom: 8px;
        }

        .meta {
            color: #555;
            margin-bottom: 20px;
            font-size: 10pt;
        }

        .section {
            margin-bottom: 20px;
            page-break-inside: avoid;
        }

        .section-title {
            font-size: 13pt;
            font-weight: bold;
            border-bottom: 1px solid #ccc;
            padding-bottom: 4px;
            margin-bottom: 8px;
        }

        .entry {
            margin-bottom: 10px;
        }

        .entry-title {
            font-weight: bold;
            display: block;
        }

        .entry-meta {
            color: #555;
            font-size: 9.5pt;
            margin-top: 2px;
        }

        .badge {
            display: inline-block;
            background: #dbeafe;
            color: #1e40af;
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 8.5pt;
            margin-right: 4px;
        }
    </style>
</head>
<body>
    <h1>Research Compilation</h1>
    <div class="meta">
        @if(!empty($dateRange))
            <div>Date Range: {{ $dateRange }}</div>
        @endif
        @if(!empty($appliedFilters))
            <div>
                Filters:
                @foreach($appliedFilters as $key => $value)
                    {{ $loop->first ? '' : ', ' }}{{ ucfirst($key) }}: {{ is_array($value) ? implode($value, ', ') : $value }}
                @endforeach
            </div>
        @endif
    </div>

    @foreach($researches as $research)
        <div class="section">
            <div class="section-title">{{ $research->research_title ?? 'Untitled Research' }}</div>
            <div class="entry">
                <span class="entry-title">Program</span>
                <div class="entry-meta">{{ $research->program->name ?? 'N/A' }}</div>
            </div>
            <div class="entry">
                <span class="entry-title">Adviser</span>
                <div class="entry-meta">{{ $research->adviser->last_name ?? '' }}, {{ $research->adviser->first_name ?? '' }}</div>
            </div>
            @if(!empty($showStatusBadge))
                <div class="entry">
                    <span class="entry-title">Status</span>
                    <div class="entry-meta"><span class="badge">{{ $research->displayStatusLabel() }}</span></div>
                </div>
            @endif
            @if(!empty($research->research_abstract))
                <div class="entry">
                    <span class="entry-title">Abstract</span>
                    <div class="entry-meta">{{ $research->research_abstract }}</div>
                </div>
            @endif
            @if($research->keywords && $research->keywords->count())
                <div class="entry">
                    <span class="entry-title">Keywords</span>
                    <div class="entry-meta">{{ $research->keywords->pluck('keyword_name')->implode(', ') }}</div>
                </div>
            @endif
        </div>
    @endforeach
</body>
</html>
