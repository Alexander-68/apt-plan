# Run from any directory: pwsh -File C:\Alex\apt\build-omnigate.ps1
$ErrorActionPreference = 'Stop'

$bundleFiles = @(
    'index.html', 'style.css', 'app.js', 'plan.js', 'wall-edges.js',
    'stool.js', 'stool2.js', 'favicon.svg', 'omnigate.json', 'README.md',
    '260801-apartm-plan-F.pdf',
    'assets/plan.png', 'assets/stool-top.jpg', 'assets/stool-frame.jpg',
    'assets/plan-2026-10-07.jpg', 'assets/tex-whiteoak.jpg', 'assets/tex-walnut.jpg',
    'assets/tex-kitchen-stone.jpg', 'assets/tex-mural.jpg'
)
foreach ($file in $bundleFiles) {
    $filePath = Join-Path $PSScriptRoot $file
    if (-not (Test-Path -LiteralPath $filePath -PathType Leaf)) {
        throw "Missing bundle file: $file"
    }
}

$destination = Join-Path $PSScriptRoot 'apt.zip'
$stream = [System.IO.File]::Create($destination)
$archive = [System.IO.Compression.ZipArchive]::new($stream, [System.IO.Compression.ZipArchiveMode]::Create)
try {
    foreach ($file in $bundleFiles) {
        [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile(
            $archive, (Join-Path $PSScriptRoot $file), $file,
            [System.IO.Compression.CompressionLevel]::Optimal
        ) | Out-Null
    }
} finally {
    $archive.Dispose()
    $stream.Dispose()
}
Write-Output "Built $destination"
