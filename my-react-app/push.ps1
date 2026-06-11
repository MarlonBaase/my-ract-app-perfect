$parts = (Get-Content version.txt).Split('.')

$major = [int]$parts[0]
$minor = [int]$parts[1]

$minor++

$newVersion = "$major.$minor"

Set-Content version.txt $newVersion

$timestamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'

git add .
git commit -m "Version $newVersion - $timestamp"
git push