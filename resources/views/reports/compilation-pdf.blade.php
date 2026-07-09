<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Book of Abstracts - Research Compilation</title>
    <style>
        /* Default page styling */
        @page {
            size: A4;
            margin: 1in;
            @bottom-center {
                content: counter(page);
                font-family: Arial, Helvetica, sans-serif;
                font-size: 11pt;
                color: #333;
            }
        }
        
        /* First page (cover) - no margins */
        @page :first {
            margin: 0;
            @bottom-center {
                content: normal;
            }
        }
        
        /* Table of Contents - reduced margin */
        .toc-page {
            page: toc;
        }
        
        @page toc {
            margin: 0.5in;
            @bottom-center {
                content: counter(page);
                font-family: Arial, Helvetica, sans-serif;
                font-size: 11pt;
                color: #333;
            }
        }
        
        @page:not(:first) {
            margin: 1in;
        }
        
        body {
            font-family: Arial, Helvetica, sans-serif;
            font-size: 12pt;
            line-height: 1.6;
            color: #1e1e1e;
            margin: 0;
            padding: 0;
            background: #fff;
            position: relative;
        }

        /* ========== REDESIGNED COVER PAGE ========== */
        .cover-page {
            page-break-after: always;
            width: 100%;
            height: 100vh;
            margin: 0;
            padding: 0;
            position: relative;
            background-color: white;
            color: black;
            display: flex;
            flex-direction: column;
        }

        /* Top color bar (wine/maroon) */
        .cover-top-bar {
            background-color: #8B1E3F; /* deep maroon/wine */
            height: 30px;
            width: 100%;
        }

        /* Main cover content container */
        .cover-content {
            flex: 1;
            display: flex;
            flex-direction: column;
            padding: 0.5in 0.8in;
            position: relative;
            z-index: 5;
        }

        /* College name and logo side-by-side */
        .cover-header-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 30px;
            font-size: 16pt;
            text-transform: uppercase;
            letter-spacing: 1.2px;
            font-weight: 500;
            color: #666666;
            border-bottom: 1px solid #aaa;
            padding-bottom: 12px;
            font-family: Arial, Helvetica, sans-serif;
        }

        .cover-college {
            font-weight: 600;
            font-size: 18pt;
            flex: 1;
            color: #555555;
        }

        .cover-logo {
            display: inline-block;
            width: 80px;
            height: 80px;
            object-fit: contain;
        }

        /* Main title: BOOK OF ABSTRACTS */
        .cover-main-title {
            font-size: 56pt;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 6px;
            line-height: 1.1;
            margin-top: 25px;
            margin-bottom: 25px;
            color: #333333;
            text-align: left;
            border-bottom: 3px solid #8B1E3F;
            padding-bottom: 20px;
            max-width: 80%;
            font-family: "Georgia", "Times New Roman", serif;
        }

        /* Date range (January 2020 - December 2023) */
        .cover-date-block {
            font-size: 24pt;
            font-weight: 600;
            margin-top: 30px;
            margin-bottom: 40px;
            color: #444444;
            text-align: left;
            letter-spacing: 1px;
            white-space: nowrap;
            font-family: Arial, Helvetica, sans-serif;
        }

        /* School image container */
        .cover-image-section {
            position: relative;
            margin-top: 30px;
            margin-bottom: 40px;
            display: flex;
            align-items: center;
            justify-content: flex-start;
        }

        .cover-school-image {
            max-width: 500px;
            height: 250px;
            object-fit: cover;
            object-position: center;
            position: relative;
            z-index: 2;
            overflow: hidden;
        }

        /* Geometric triangle element */
        .geometric-triangle {
            position: absolute;
            right: -40px;
            top: 50%;
            transform: translateY(-50%);
            width: 0;
            height: 0;
            border-left: 140px solid #8B1E3F;
            border-top: 125px solid transparent;
            border-bottom: 0px solid transparent;
            z-index: 4;
            opacity: 0.85;
            filter: drop-shadow(-8px 0 0 white) drop-shadow(-6px 0 0 white) drop-shadow(-4px 0 0 white) drop-shadow(-2px 0 0 white);
        }

        /* filter / additional info remains, but placed lower */
        .cover-footer-info {
            margin-top: auto;
            padding-top: 30px;
            font-size: 12pt;
            color: #666666;
            border-top: 1px dashed #8B1E3F;
            width: 100%;
            font-family: Arial, Helvetica, sans-serif;
        }

        .filter-info {
            margin-top: 15px;
            padding: 15px 0;
            font-size: 11pt;
            color: #555555;
        }

        .filter-item {
            margin: 4px 0;
            padding: 4px 8px;
            background: #f5f5f5;
            display: inline-block;
            border-left: 3px solid #8B1E3F;
        }

        /* watermark behind text on main content pages */
        .watermark {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-45deg);
            font-size: 40pt;
            color: rgba(180, 180, 180, 0.40);
            font-family: Arial, Helvetica, sans-serif;
            font-weight: normal;
            white-space: nowrap;
            z-index: -1;
            pointer-events: none;
            letter-spacing: 2px;
            width: 100%;
            text-align: center;
        }

        /* Table of Contents Styles - polished */
        .toc-page {
            page-break-after: always;
            padding: 0;
            background: white;
            font-family: Arial, Helvetica, sans-serif;
            page: toc;
            position: relative;
            page-break-before: always;
            z-index: 1;
        }

        .toc-page h2 {
            font-size: 28pt;
            font-weight: 600;
            margin-bottom: 20px;
            margin-top: 0;
            border-bottom: 2px solid #8B1E3F;
            padding-bottom: 12px;
            display: inline-block;
            text-transform: uppercase;
            letter-spacing: 3px;
            color: #333333;
        }

        .toc-entries {
            margin: 30px 0;
            font-family: Arial, Helvetica, sans-serif;
            color: #333333;
        }

        .toc-section {
            margin-bottom: 28px;
        }

        .toc-section-header {
            font-weight: 700;
            font-size: 14pt;
            margin-bottom: 12px;
            color: #8B1E3F;
            text-transform: uppercase;
            letter-spacing: 1px;
            font-family: Arial, Helvetica, sans-serif;
        }

        .toc-entry {
            margin: 8px 0 8px 20px;
            line-height: 1.5;
            font-size: 11.5pt;
            display: flex;
            justify-content: space-between;
            align-items: baseline;
            border-bottom: 1px dotted #aaa;
            padding-bottom: 5px;
            font-family: Arial, Helvetica, sans-serif;
            color: #333333;
        }

        .toc-entry .entry-title {
            font-style: italic;
            max-width: 75%;
        }

        .toc-entry .entry-page {
            font-weight: 500;
            color: #333333;
        }

        /* Research Entry Styles - keep elegant, less colorful, more classic */
        .research-entry {
            page-break-inside: avoid;
            page-break-before: always;
            margin: 0;
            padding: 0;
            position: relative;
            z-index: 1;
            text-align: center;
        }

        .research-entry .entry-header {
            display: none;
        }

        .research-entry .entry-number-badge {
            display: none;
        }

        .research-entry h3 {
            font-size: 18pt;
            margin: 0 0 20px 0;
            font-weight: 700;
            line-height: 1.3;
            color: #222222;
            font-family: Arial, Helvetica, sans-serif;
            text-transform: none;
            letter-spacing: normal;
        }

        .research-meta {
            margin-bottom: 25px;
            font-size: 11pt;
            padding: 0;
            background: transparent;
            border-left: none;
            font-family: Arial, Helvetica, sans-serif;
            color: #333333;
            display: none;
        }

        .research-entry-researchers {
            font-size: 12pt;
            margin-bottom: 15px;
            color: #333333;
            font-family: Arial, Helvetica, sans-serif;
            font-weight: 600;
            text-align: center;
            line-height: 1.8;
        }

        .research-entry-date {
            font-size: 11pt;
            margin-bottom: 20px;
            color: #555555;
            font-family: Arial, Helvetica, sans-serif;
            text-align: center;
        }

        .info-row {
            margin: 6px 0;
        }

        .info-row .label {
            font-weight: 700;
            display: inline-block;
            min-width: 130px;
            color: #555555;
            font-family: Arial, Helvetica, sans-serif;
        }

        .research-meta .researchers {
            margin-left: 20px;
            color: #333333;
            font-family: Arial, Helvetica, sans-serif;
        }

        .research-meta .researcher {
            display: block;
            margin: 3px 0;
            padding-left: 15px;
            position: relative;
        }

        .research-meta .researcher:before {
            content: "—";
            position: absolute;
            left: 0;
            color: #8B1E3F;
        }

        .research-abstract {
            text-align: justify;
            margin-top: 20px;
            margin-bottom: 20px;
            line-height: 1.7;
            padding: 0;
            background: transparent;
            border: none;
            font-family: Arial, Helvetica, sans-serif;
            color: #333333;
        }

        .research-abstract .abstract-label {
            font-weight: 700;
            font-size: 12pt;
            color: #8B1E3F;
            margin-bottom: 10px;
            display: block;
            text-transform: uppercase;
            letter-spacing: 1.5px;
        }

        .research-abstract p {
            margin: 0;
            text-indent: 0;
        }

        .keywords {
            margin-top: 15px;
            padding: 0;
            background: transparent;
            font-size: 11pt;
            font-family: Arial, Helvetica, sans-serif;
            color: #333333;
            text-align: center;
        }

        .keywords strong {
            color: #8B1E3F;
            margin-right: 8px;
            font-family: Arial, Helvetica, sans-serif;
        }

        .keyword-tag {
            display: none;
        }

        .keywords-text {
            display: inline;
            color: #333333;
        }

        /* ensure alignment with image format */
        .cover-college-name {
            display: none;
        }

        .cover-body {
            width: 100%;
        }
    </style>
</head>
<body>
    {{-- REDESIGNED COVER PAGE --}}
    <div class="cover-page">
        <div class="cover-top-bar"></div>
        
        <div class="cover-content">
            {{-- Header: College of Information and Computing / Logo --}}
            <div class="cover-header-row">
                <span class="cover-college">College of Information and Computing</span>
                <img src="{{ public_path('images/cic-logo.png') }}" alt="CIC Logo" class="cover-logo">
            </div>

            {{-- Main title exactly as in image --}}
            <div class="cover-main-title">
                BOOK OF<br>ABSTRACTS
            </div>
            
            {{-- Date range --}}
            <div class="cover-date-block">
                @if(!empty($dateRange))
                    {{ $dateRange }}
                @else
                    January 2020 - December 2023
                @endif
            </div>
            
            {{-- School image with geometric element --}}
            <div class="cover-image-section">
                <img src="{{ public_path('images/school.png') }}" alt="University Building" class="cover-school-image">
                <div class="geometric-triangle"></div>
            </div>
            
            {{-- Optional filter info, repositioned at bottom --}}
            <div class="cover-footer-info">
                @if(isset($selectedPrograms) && count($selectedPrograms) > 0)
                <div class="filter-info">
                    <span style="font-weight:700;">FILTERS APPLIED:</span>
                    @foreach($selectedPrograms as $prog)
                        <span class="filter-item">{{ $prog }}</span>
                    @endforeach
                </div>
                @endif
                
                @if(isset($selectedKeywords) && count($selectedKeywords) > 0)
                <div class="filter-info">
                    <span style="font-weight:700;">KEYWORDS:</span>
                    @foreach($selectedKeywords as $kw)
                        <span class="filter-item">{{ $kw }}</span>
                    @endforeach
                </div>
                @endif
                
                @if(isset($dateRange) && !empty($dateRange))
                <div style="margin-top:12px; font-size:10pt; color:#555;">
                    <span>Generated on: {{ now()->format('F d, Y') }}</span>
                </div>
                @endif
            </div>
        </div>
    </div>

    {{-- Table of Contents --}}
    <div class="toc-page">
        <div class="watermark">For USeP-CIC Use Only</div>
        <h2>Table of Contents</h2>
        <div class="toc-entries">
            @php
                $romanNumerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV'];
                $sectionIndex = 0;
                // Page numbering: Cover page = 1, TOC = 2, Content starts at page 3
                $pageNumber = 3;
            @endphp
            
            @foreach($groupedByProgram as $programName => $programResearches)
                <div class="toc-section">
                    <div class="toc-section-header">
                        {{ $romanNumerals[$sectionIndex] ?? ($sectionIndex + 1) }}. {{ $programName }}
                    </div>
                    
                    @foreach($programResearches as $research)
                    <div class="toc-entry">
                        <span class="entry-title">{{ $research->research_title }}</span>
                        <span class="entry-page">{{ $pageNumber }}</span>
                    </div>
                    @php $pageNumber++; @endphp
                    @endforeach
                </div>
                @php $sectionIndex++; @endphp
            @endforeach
        </div>
    </div>

    {{-- Research Entries --}}
    @foreach($researches as $index => $research)
    <div class="research-entry">
        <div class="watermark">For USeP-CIC Use Only</div>
        <h3>{{ $research->research_title }}</h3>
        
        @if($research->researchers && $research->researchers->count() > 0)
        <div class="research-entry-researchers">
            @foreach($research->researchers as $researcher)
                <div>
                    {{ $researcher->first_name }} 
                    @if($researcher->middle_name)
                        {{ substr($researcher->middle_name, 0, 1) }}.
                    @endif
                    {{ $researcher->last_name }}
                </div>
            @endforeach
        </div>
        @endif
        
        <div class="research-entry-date">
            @if($research->published_month && $research->published_year)
                {{ \Carbon\Carbon::create($research->published_year, $research->published_month)->format('F Y') }}
            @elseif($research->published_year)
                {{ $research->published_year }}
            @endif
        </div>
        
        <div class="research-meta">
        </div>
        @if($research->research_abstract)
        <div class="research-abstract">
            <span class="abstract-label">Abstract</span>
            <p>{{ $research->research_abstract }}</p>
        </div>
        @endif
        
        @if($research->keywords && $research->keywords->count() > 0)
        <div class="keywords">
            <strong>Keywords:</strong>
            <span class="keywords-text">
                @foreach($research->keywords as $keyword)
                    {{ $keyword->keyword_name }}{{ !$loop->last ? ',' : '' }}
                @endforeach
            </span>
        </div>
        @endif
    </div>
    @endforeach
</body>
</html>
