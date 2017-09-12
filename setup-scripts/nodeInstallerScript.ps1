function FindMostRecentVersion
{
  $URI = "https://nodejs.org/dist/latest/"
  $HTML = Invoke-WebRequest -Uri $URI
  $nodeVersions = ($HTML.ParsedHtml.getElementsByTagName('a') | Select-Object -Expand href )
  Foreach ($version in $nodeVersions)
  {
    $versionId = $version -match 'v[0-9]+\.[0-9]+\.[0-9]+'
    if ($versionId) {
        return $matches[0]
    }
  }
  return 'False'
}
function InstallMostRecentVersion
{


}
function UpdateToMostRecentVersion
{

}
function FindPowershellVersion
{
    $output = Get-Host | Select-Object Version
    $version = $output -match '(?<major_version>[0-9]+)(?:\.[0-9]+)+'
    if ($version) {
        return $matches['major_version'] -ge 3
    }
    return 'False'
}
