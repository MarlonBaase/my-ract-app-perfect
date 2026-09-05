# 1. Sicherstellen, dass wir auf dem Staging-Branch sind
git checkout staging

# 2. Version hochzählen
$parts = (Get-Content version.txt).Split('.')
$major = [int]$parts[0]
$minor = [int]$parts[1]
$minor++

$newVersion = "$major.$minor"
Set-Content version.txt $newVersion

# 3. Commit & Push explizit auf Staging
$timestamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'

git add .
git commit -m "Staging Build v$newVersion - $timestamp"
git push origin staging