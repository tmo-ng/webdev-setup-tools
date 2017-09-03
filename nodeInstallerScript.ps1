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
}
function InstallMostRecentVersion
{


}
function UpdateToMostRecentVersion
{

}