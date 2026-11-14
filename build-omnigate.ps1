# Run from any directory: pwsh -File C:\Alex\apt\build-omnigate.ps1
$ErrorActionPreference = 'Stop'

$bundleFiles = @(
    'index.html', 'style.css', 'app.js', 'plan.js', 'wall-edges.js',
    'stool.js', 'stool2.js', 'favicon.svg', 'omnigate.json', 'README.md',
    'assets/stool-top.jpg', 'assets/stool-frame.jpg',
    'assets/tex-whiteoak.jpg', 'assets/tex-walnut.jpg',
    'assets/tex-kitchen-stone.jpg', 'assets/tex-mural.jpg'
)
foreach ($file in $bundleFiles) {
    $filePath = Join-Path $PSScriptRoot $file
    if (-not (Test-Path -LiteralPath $filePath -PathType Leaf)) {
        throw "Missing bundle file: $file"
    }
}

$destination = Join-Path $PSScriptRoot 'apt.zip'
# Build beside the target and move into place, so a failed build never leaves a corrupt apt.zip.
$temporary = "$destination.tmp"
$stream = [System.IO.File]::Create($temporary)
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
Move-Item -LiteralPath $temporary -Destination $destination -Force
Write-Output "Built $destination"
