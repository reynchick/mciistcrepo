<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ $title }} unavailable</title>
    <style>
        :root {
            color-scheme: light;
            font-family: Arial, Helvetica, sans-serif;
        }

        body {
            margin: 0;
            min-height: 100vh;
            display: grid;
            place-items: center;
            background: #f8fafc;
            color: #0f172a;
        }

        .card {
            width: min(560px, calc(100vw - 32px));
            background: #fff;
            border: 1px solid #e2e8f0;
            border-radius: 16px;
            padding: 28px;
            box-shadow: 0 20px 50px rgba(15, 23, 42, 0.08);
        }

        h1 {
            margin: 0 0 8px;
            font-size: 24px;
            line-height: 1.2;
        }

        p {
            margin: 0 0 20px;
            color: #475569;
            line-height: 1.5;
        }

        a {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 10px 16px;
            border-radius: 10px;
            background: #0f172a;
            color: #fff;
            text-decoration: none;
            font-weight: 600;
        }
    </style>
</head>
<body>
    <div class="card">
        <h1>{{ $title }} unavailable</h1>
        <p>{{ $message }}</p>
        <a href="{{ $backUrl }}">Go back</a>
    </div>
</body>
</html>