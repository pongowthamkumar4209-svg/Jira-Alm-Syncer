param(
	[string] $SSchema,
	[string] $Ttoken,
	[string] $AAlmusername,
	[string] $AAlmpassword,
	[string] $DDomain,
	[string] $PProject,
	[string] $DB_Host,
	[string] $DB_Name,
	[string] $DBUserName,
	[string] $DBPassword,
	[string] $jiraUrl, #Example "https://jira.domain"
	[string] $almHost  #example 'mfalm.Domain'


)

$startTime = Get-Date

function Add-ScriptError {
    param(
        [ref]$ScriptErrorsRef,  # Reference to the ScriptErrors array
        [System.Exception]$exception   # The exception object
    )
    
    # Extract trace error message from the exception
    $Traceerror = $exception.Message
    
    # Extract the response stream if it exists
    $errorMessage = ""
    if ($exception.Response) {
        $responseStream = $exception.Response.GetResponseStream()
        $errorReader = New-Object System.IO.StreamReader($responseStream)
        $errorReader.BaseStream.Position = 0
        $errorReader.DiscardBufferedData()
        $errorMessage = $errorReader.ReadToEnd()
        $errorReader.Close()
    }
    
    # If errorMessage is not null or empty, extract the title from JSON
    if (![string]::IsNullOrEmpty($errorMessage)) {
        try {
            # Convert the JSON string to a PowerShell object
            $jsonObject = $errorMessage | ConvertFrom-Json

            # Access the 'Title' property
            $errorMessageTitle = $jsonObject.Title

            # Combine Traceerror and Title into the final error message
            $finalErrorMessage = $Traceerror + " - " + $errorMessageTitle
        } catch {
            # If JSON conversion fails, fallback to a basic error message
            $finalErrorMessage = $Traceerror + " - Unable to parse JSON"
        }
    } else {
        # If no error message is returned, just use Traceerror
        $finalErrorMessage = $Traceerror
    }
    
    # Add the final error message to the ScriptErrors array
    $ScriptErrorsRef.Value += $finalErrorMessage
}

function Write-ToDatabase {
    param (
        [string]$jiraIssueKey,
        [string]$almRequirementID,
        [string]$syncType,
        [string]$result,
        [string]$almSchema,
		[string]$Name,
        [string]$RequirementType,
        [string]$RequirementStatus,
        [string]$OTITProject,
        [string]$parentRTMID,
        [string]$TraceStatus,
        [string]$Warnings,
        [string]$ScriptErrors,
        [string]$PlannedRelease
    )
    try {
        $sqlConnection = New-Object System.Data.SqlClient.SqlConnection("Data Source=$DB_Host;Database=$DB_Name;Integrated Security=False;User ID=$DBUserName;Password='$DBPassword';Connect Timeout=30;")
        $sqlConnection.Open()

        # $sqlQuery = "INSERT INTO JiraToAlmSyncLogs([DateTime], Jira_IssueKey, ALM_RequestID, SyncType, Result, ALM_Schema, RequirementName, RequirementType, RequirementStatus, OTITProject, ParentRtmID, TraceStatus) VALUES(GETDATE(), @jiraIssueKey, @almRequirementID, @syncType, @result, @almSchema, @Name, @RequirementType, @RequirementStatus, @OTITProject, @parentRTMID, @TraceStatus);"
        $sqlQuery = "INSERT INTO JiraToAlmSyncLogs([DateTime], Jira_IssueKey, ALM_RequestID, SyncType, Result, ALM_Schema, RequirementName, RequirementType, RequirementStatus, OTITProject, ParentRtmID, TraceStatus,Warnings,ScriptErrors,PlannedRelease) VALUES(GETDATE(), @jiraIssueKey, @almRequirementID, @syncType, @result, @almSchema, @Name, @RequirementType, @RequirementStatus, @OTITProject, @parentRTMID, @TraceStatus, @Warnings, @ScriptErrors,@PlannedRelease);"
        $sqlCommand = New-Object System.Data.SqlClient.SqlCommand($sqlQuery, $sqlConnection)

        $sqlCommand.Parameters.Add([System.Data.SqlClient.SqlParameter]::new('@jiraIssueKey', $jiraIssueKey)) | Out-Null
        $sqlCommand.Parameters.Add([System.Data.SqlClient.SqlParameter]::new('@almRequirementID', $almRequirementID)) | Out-Null
        $sqlCommand.Parameters.Add([System.Data.SqlClient.SqlParameter]::new('@syncType', $syncType)) | Out-Null
        $sqlCommand.Parameters.Add([System.Data.SqlClient.SqlParameter]::new('@result', $result)) | Out-Null
        $sqlCommand.Parameters.Add([System.Data.SqlClient.SqlParameter]::new('@almSchema', $almSchema)) | Out-Null
		$sqlCommand.Parameters.Add([System.Data.SqlClient.SqlParameter]::new('@Name', $Name)) | Out-Null
        $sqlCommand.Parameters.Add([System.Data.SqlClient.SqlParameter]::new('@RequirementType', $RequirementType)) | Out-Null
        $sqlCommand.Parameters.Add([System.Data.SqlClient.SqlParameter]::new('@RequirementStatus', $RequirementStatus)) | Out-Null
        $sqlCommand.Parameters.Add([System.Data.SqlClient.SqlParameter]::new('@OTITProject', $OTITProject)) | Out-Null
        $sqlCommand.Parameters.Add([System.Data.SqlClient.SqlParameter]::new('@parentRTMID', $parentRTMID)) | Out-Null
        $sqlCommand.Parameters.Add([System.Data.SqlClient.SqlParameter]::new('@TraceStatus', $TraceStatus)) | Out-Null
        $sqlCommand.Parameters.Add([System.Data.SqlClient.SqlParameter]::new('@Warnings', $Warnings)) | Out-Null
        $sqlCommand.Parameters.Add([System.Data.SqlClient.SqlParameter]::new('@ScriptErrors', $ScriptErrors)) | Out-Null
        $sqlCommand.Parameters.Add([System.Data.SqlClient.SqlParameter]::new('@PlannedRelease', $PlannedRelease)) | Out-Null


        $sqlCommand.ExecuteNonQuery() | Out-Null
    } finally {
        if ($null -ne $sqlCommand) {
            $sqlCommand.Dispose()
        }
        if ($null -ne $sqlConnection -and $sqlConnection.State -ne [System.Data.ConnectionState]::Closed) {
            $sqlConnection.Close()
        }
    }
}


function Add-ResultAndUpload {
    param (
        [ref]$syncResults,
        [string]$RTM_ID,
        [string]$ALMReqID,
        [string]$synctype,
        [string]$Result,
        [string]$Schema,
        [string]$Name,
        [string]$RequirementType,
        [string]$Status,
        [string]$OTITProject,
        [string]$parentRTMID,
        [string]$TraceStatus,
        [string]$Warnings,
        [string]$ScriptErrors,
        [string]$PlannedRelease

    )
    


    # Create a PSCustomObject for the current result
    $currentResult = [PSCustomObject]@{
        'Sl.No'              = $syncResults.Value.Count + 1
        'RTM_ID'            = $RTM_ID
        'ALM Requirement ID' = $ALMReqID
        'Sync Type'         = $synctype
        'Result'            = $Result
        'Schema'            = $Schema
        'Name'              = $Name
        'RequirementType'   = $RequirementType
        'Status'            = $Status
        'OTITProject'       = $OTITProject
        'parentRTMID'       = $parentRTMID
        'TraceStatus'       = $TraceStatus
        'Warnings'          = $Warnings
        'ScriptErrors'      = $ScriptErrors
        'PlannedRelease'    = $PlannedRelease
    }

    # Add the current result to syncResults
    $syncResults.Value += $currentResult

    # Upload to the database immediately
    Write-ToDatabase -jiraIssueKey $currentResult.'RTM_ID' `
                     -almRequirementID $currentResult.'ALM Requirement ID' `
                     -syncType $currentResult.'Sync Type' `
                     -result $currentResult.'Result' `
                     -almSchema $currentResult.'Schema' `
                     -Name $currentResult.'Name' `
                     -RequirementType $currentResult.'RequirementType' `
                     -RequirementStatus $currentResult.'Status' `
                     -OTITProject $currentResult.'OTITProject' `
                     -parentRTMID $currentResult.'parentRTMID' `
                     -TraceStatus $currentResult.'TraceStatus' `
                     -Warnings $currentResult.'Warnings' `
                     -ScriptErrors $currentResult.'ScriptErrors' `
                     -PlannedRelease $currentResult.'PlannedRelease'
}

function Get-NewStatus {
    param (
        [string]$Status
    )

    # Check if the status matches any of the specified values
    if ($Status -in @("Approved", "Done", "In Development", "Testing", "QA", "To Do/New", "To Do / Re-Opened", "SubSys. Det. Des")) {
        return "3-Approved"
    } elseif ($Status -in @("On Hold", "Blocked / On Hold", "Draft", "Proposed- Not Ready for Review", "Proposed- Ready for Approval", "Proposed- Ready for Review", "Ready for Review", "Modified")) {
        return "2-Under Maintenance"
    } elseif ($Status -in @("Out of Scope")) {
        return "4-Out of Scope"
    }elseif($Status -in @("Cancelled")){
        return "5-Obsolete"  
    }elseif($Status -in @("Approved - Delivered", "Closed")){
        return "6-Delivered"  
    }else {
        return $Status
    }
}

function Get-NewCriticality {
    param (
        [string]$Criticality
    )

    # Check if the status matches any of the specified values
    if ($Criticality -eq @("Critical")) {
        return "1-Critical"
    }elseif ($Criticality -eq @("High")) {
        return "2-High"
    }elseif ($Criticality -eq @("Medium")) {
        return "3-Medium"
    }else{
        return $Criticality
    }
}
function Get-NewType {
    param (
        [string]$RequirementType,
        [string]$almProject
    )

    # Check if the status matches any of the specified values
    if ($RequirementType -eq "Feature") {
        if ($almProject -in @("CE828001_PTC_LVVR_001", "PTC_ETAV_001", "Rollaway_Protection", "CD366007_Crossing_Monitoring", "CB945241_OT_GIS_001", "CD115011_OT_ATIP_001", "CC726101_Automated_Inspection", "CC486001_OT_TROPT_001","Automation","CB945071_PTC_Phoenix_00001")) {
            return "109"
        } elseif ($almProject -eq "A956001_PTC_Program_000000") {
            return "110"
        }
    } elseif ($RequirementType -eq "L1 Business Requirement") {
        if ($almProject -in @("CE828001_PTC_LVVR_001", "PTC_ETAV_001", "Rollaway_Protection", "CD366007_Crossing_Monitoring", "CB945241_OT_GIS_001", "CD115011_OT_ATIP_001", "CC726101_Automated_Inspection", "CC486001_OT_TROPT_001","Automation")) {
            return "111"
        } elseif ($almProject -eq "CB945071_PTC_Phoenix_00001") {
            return "114"
        } elseif ($almProject -eq "A956001_PTC_Program_000000") {
            return "115"
        }
    } elseif ($RequirementType -eq "L2 Requirement") {
        if ($almProject -in @("CE828001_PTC_LVVR_001", "PTC_ETAV_001", "Rollaway_Protection", "CD366007_Crossing_Monitoring", "CB945241_OT_GIS_001", "CD115011_OT_ATIP_001", "CC726101_Automated_Inspection", "CC486001_OT_TROPT_001","Automation")) {
            return "112"
        } elseif ($almProject -eq "CB945071_PTC_Phoenix_00001") {
            return "115"
        } elseif ($almProject -eq "A956001_PTC_Program_000000") {
            return "116"
        }
    } else {
        return $RequirementType
    }
}

function Get-NewName {
    param (
        [string]$Name,
        [string]$RequirementType
    )

    # Check if the RequirementType matches "Feature"
    if ($RequirementType -eq "Feature") {
        # Trim leading/trailing spaces first, then check for dot at the start
        $Name = $Name.Trim()

        if ($Name.StartsWith('.')) {
            # Remove the dot and any spaces after it
            return $Name.TrimStart('.').Trim()
        } else {
            return $Name
        }
    } else {
        return $Name
    }
}

function Get-NewSafetyAssesment {
    param (
        [string]$SafetyAssesment
    )

    # Check if the SafetyAssesment is null or an empty string
    if (-not $SafetyAssesment) {
        return "Not Assessed"
    }else {
        return $SafetyAssesment
    }
}
function Get-NewPTCValidationMethod {
    param (
        [string]$PTCValidationMethod,
        [string]$RequirementType,
        [ref]$Warnings
    )
    if ($RequirementType -like "*L1*" -or $RequirementType -like "*L2*"){
    # Check if the status matches any of the specified values
        if (-not $PTCValidationMethod -or $PTCValidationMethod -eq "Null") {
            $Warnings.Value +="Warning: Null value substituted with 1-Test for PTC Validation method"
            return "1-Test"
        }else{
            return $PTCValidationMethod
        }
    }else{
        if (-not $PTCValidationMethod -or $PTCValidationMethod -eq "Null") {
            return "2-Parent Children"
        }else{
            return $PTCValidationMethod
        }
    }
}
function Get-PlannedRelease {
    param (
        [string]$RequirementType,
        [string]$FinalProd,
        [string]$FinalPreProd,
        [string]$FinalAnp,
        [string]$FinalProdL2,
        [string]$FinalPreProdL2,
        [string]$FinalAnpL2
    )

    if ($RequirementType -like "*L1*") {
        if (-not [string]::IsNullOrEmpty($FinalProd)) {
            return $FinalProd
        } elseif (-not [string]::IsNullOrEmpty($FinalPreProd)) {
            return $FinalPreProd
        } elseif (-not [string]::IsNullOrEmpty($FinalAnp)) {
            return $FinalAnp
        } else {
            return "TBD"
        }
    } elseif($RequirementType -like "*L2*") {
        if (-not [string]::IsNullOrEmpty($FinalProdL2)) {
            return $FinalProdL2
        } elseif (-not [string]::IsNullOrEmpty($FinalPreProdL2)) {
            return $FinalPreProdL2
        } elseif (-not [string]::IsNullOrEmpty($FinalAnpL2)) {
            return $FinalAnpL2
        } else {
            return "TBD"
        }
    }
}
function Get-ParentRTMID {
    param (
        [string]$Name,
        [string]$RequirementType
    )

    # Split the Name by the dot
    $parts = $Name -split '\.' 

    # Check if the split operation produced at least two parts
    if ($parts.Count -ge 2) {
        # Return the first part as the parent RTM ID
        return $parts[0].Trim()
    } else {
        #Write-Host "The input string does not contain a valid parent RTM ID."
        return $null
    }
}
function Get-ReqCategory {
    param (
        [string]$RequirementType,
        [string]$ReqCategory,
        [ref]$Warnings

    )
    if ($RequirementType -like "*L2*") {
        if (-not $ReqCategory -or $ReqCategory -eq "Null") {
            $Warnings.Value +="Warning: Null value substituted with Functional for Requirement Category"
            return "Functional"
        }else{
            return $ReqCategory
        }
    }else{    
        if (-not $ReqCategory -or $ReqCategory -eq "Null") {
            return "None"
        }else{
            return $ReqCategory
        }
    }
}

# Set global error action preference to stop on errors
$global:ErrorActionPreference = "Stop"

$syncResults = @() 

# Define your schema variable
$Schema = $SSchema



$jqlQuery = "((filter in (36582) OR filter in (36567)) AND filter not in (36860) AND `"ALM Schema Name`" = `"$($Schema)`") ORDER BY issuekey ASC"
$searchEndpoint = "$jiraUrl/rest/api/2/search"

$Jheaders = @{
    'Authorization' = "Bearer $Ttoken"
    'Content-Type'  = 'application/json'
    'Accept' = 'application/json'
}
$headers = @{
     'Content-Type'  = 'application/json'
     'Accept' = 'application/json'
}

[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12 -bor [Net.SecurityProtocolType]::Tls11 -bor [Net.SecurityProtocolType]::Tls

$startAt = 0
$maxResults = 100
$issues = @()

do {
    $requestBody = @{
        jql = $jqlQuery
        startAt = $startAt
        maxResults = $maxResults
    } | ConvertTo-Json -Depth 3

    try {
        $response = Invoke-RestMethod -Uri $searchEndpoint -Method Post -Headers $Jheaders -Body $requestBody -UseBasicParsing -TimeoutSec 600 
        $currentIssues = $response.issues
        $issues += $currentIssues
        $startAt += $maxResults
        $total = $response.total
    } catch {
        Write-Error "Failed to retrieve JIRA issues at startAt=$startAt. $($_.Exception.Message)"
        break
    }
} while ($startAt -lt $total)

# Final result
$syncCount = $issues.Count


if ($syncCount -eq 0) {
    #Write-Host "No Requirements retrieved from JIRA for $Schema."
    #exit
}

# Prompt for ALM credentials
$almUsername = $AAlmusername
$almPassword = $AAlmpassword

$almDomain = $DDomain
$almProject = $PProject

$basicAuthenticationHeader = "Basic $([System.Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes("$($almUsername):$($almPassword)")))"
       
#Check
# Add-RequirementTraceability -AlmServer $almHost -AlmUsername $almUsername -AlmPassword $almPassword -AlmDomain $almDomain -AlmProject $almProject -newALMReqID "3597" -ParentALMReqID "3589"
# Authenticate to ALM
try {
    Invoke-RestMethod -Method Post -Uri "https://$almHost/qcbin/authentication-point/authenticate" -Headers @{ Authorization = $basicAuthenticationHeader } -SessionVariable 'webSession' -UseBasicParsing
    #Write-Host 'Successfully authenticated to ALM' -ForegroundColor Green
} catch {
    Write-Error "Failed to authenticate to ALM. $($_.Exception.Message)"
    exit
}
        
# Start ALM session
try {
    Invoke-RestMethod -Method Post -Uri "https://$almHost/qcbin/rest/site-session" -ContentType 'application/json' -WebSession $webSession -UseBasicParsing
    #Write-Host 'Successfully opened an ALM session' -ForegroundColor Green
} catch {
    Write-Error "Failed to open ALM session. $($_.Exception.Message)"
    exit
}

# Iterate through JIRA issues and find corresponding ALM ID
foreach ($issue in $issues) {
        # Initialize a list to hold warning messages
    $Warnings = @()
    $WarningsRef = [ref]$Warnings
    $ScriptErrors = @()
    $ScriptErrorsRef = [ref]$ScriptErrors
    $synctype=''

    $ALMReqID = $issue.fields.customfield_16723
    $RTM_ID = $issue.key
    # $RequirementType = $issue.fields.customfield_19105
    $RequirementType = $issue.fields.issuetype.name
    $Name = $issue.fields.customfield_19914 
    $JiraParentChild = $issue.fields.customfield_19912
    $Status = $issue.fields.status.name
    $Criticality = $issue.fields.priority.name
    $SafetyAssesment = $issue.fields.customfield_18335.value
    $PTCValidationMethod = $issue.fields.customfield_18508.value
    $OTITTeam = $issue.fields.customfield_17404.value
    $OTITProgram=$issue.fields.customfield_18506.value
    $ReqCategory=$issue.fields.customfield_18309.value
    $OTITProject=$issue.fields.customfield_20636.value
    $NegativeTest='3-TBD'
    $Author=$issue.fields.reporter.name
    $AuthorName=$issue.fields.reporter.displayName
    $Description=[string]$issue.fields.description
    $FinalProd=$issue.fields.customfield_18389.value
    $FinalPreProd=$issue.fields.customfield_18388.value
    $FinalAnp=$issue.fields.customfield_18385.value
    $FinalProdL2=$issue.fields.customfield_18519.value
    $FinalPreProdL2=$issue.fields.customfield_18517.value
    $FinalAnpL2=$issue.fields.customfield_18513.value
    $SchemaJira=$issue.fields.customfield_18356.value
    $DeliveryTeam=$issue.fields.customfield_17404.value



	$Description = $Description `
        -replace [char]8221, '"' `
        -replace [char]8220, '"' `
        -replace '”', '"' `
        -replace '“', '"'
	$EncodedDescription = [System.Web.HttpUtility]::HtmlEncode($Description)
	$ProcessedDescription = $EncodedDescription `
        -replace '&trade;', '™' `
        -replace '&#160;', ' ' `
        -replace '&#39;', "'" `
        -replace '&quot;', '"' `
        -replace '&amp;', '&' `
        -replace '&lt;', '<' `
        -replace '&gt;', '>' `
        -replace ' ', ' ' `
        -replace '&copy;', '©' `
        -replace '&reg;', '®' `
        -replace '&bull;', '•' `
        -replace '&#200;', 'E' `
        -replace '&#224;', 'a' `
        -replace '&#225;', 'a' `
        -replace '&#226;', 'a' `
        -replace '&#227;', 'a' `
        -replace '&#228;', 'a' `
        -replace '&#229;', 'a' `
        -replace '&#232;', 'e' `
        -replace '&#233;', 'e' `
        -replace '&#234;', 'e' `
        -replace '&#235;', 'e' `
        -replace '&#240;', 'o' `
        -replace '&#243;', 'o' `
        -replace '&#244;', 'o' `
        -replace '&#245;', 'o' `
        -replace '&#246;', 'o' `
        -replace '&#249;', 'u' `
        -replace '&#250;', 'u' `
        -replace '&#251;', 'u' `
        -replace '&#252;', 'u' `
        -replace '&#253;', 'y' `
        -replace '&#255;', 'y' `
        -replace '&#201;', 'E' `
        -replace '&#202;', 'E' `
        -replace '&#203;', 'E' `
        -replace '&nbsp;', ' '  


	$ProcessedDescription = $ProcessedDescription `
        -replace '”', '"' `
        -replace '“', '"'

    $NewRequirementType = Get-NewType -RequirementType $RequirementType -almProject $almProject
    $NewName = Get-NewName -Name $Name -RequirementType $RequirementType
    $NewStatus = Get-NewStatus -Status $Status
    $NewCriticality = Get-NewCriticality -Criticality $Criticality
    $NewSafetyAssesment = Get-NewSafetyAssesment -SafetyAssesment $SafetyAssesment
    $NewPTCValidationMethod = Get-NewPTCValidationMethod -PTCValidationMethod $PTCValidationMethod -RequirementType $RequirementType -Warnings $WarningsRef
    $PlannedRelease = Get-PlannedRelease -RequirementType $RequirementType -FinalProd $FinalProd -FinalPreProd $FinalPreProd -FinalAnp $FinalAnp -FinalProdl2 $FinalProdL2 -FinalPreProdL2 $FinalPreProdL2 -FinalAnpL2 $FinalAnpL2
    $ReqCategoryNew = Get-ReqCategory -RequirementType $RequirementType -ReqCategory $ReqCategory -Warnings $WarningsRef
	$EncodedName = [System.Web.HttpUtility]::HtmlEncode($NewName)
    $ProcessedNameOld = $EncodedName `
        -replace '&trade;', '™' `
        -replace '&#160;', ' ' `
        -replace '&#39;', "'" `
        -replace '&quot;', '"' `
        -replace '&amp;', '&' `
        -replace '&lt;', '<' `
        -replace '&gt;', '>' `
        -replace ' ', ' ' `
        -replace '&copy;', '©' `
        -replace '&reg;', '®' `
        -replace '&bull;', '•' `
        -replace '&#200;', 'E' `
        -replace '&#224;', 'a' `
        -replace '&#225;', 'a' `
        -replace '&#226;', 'a' `
        -replace '&#227;', 'a' `
        -replace '&#228;', 'a' `
        -replace '&#229;', 'a' `
        -replace '&#232;', 'e' `
        -replace '&#233;', 'e' `
        -replace '&#234;', 'e' `
        -replace '&#235;', 'e' `
        -replace '&#240;', 'o' `
        -replace '&#243;', 'o' `
        -replace '&#244;', 'o' `
        -replace '&#245;', 'o' `
        -replace '&#246;', 'o' `
        -replace '&#249;', 'u' `
        -replace '&#250;', 'u' `
        -replace '&#251;', 'u' `
        -replace '&#252;', 'u' `
        -replace '&#253;', 'y' `
        -replace '&#255;', 'y' `
        -replace '&#201;', 'E' `
        -replace '&#202;', 'E' `
        -replace '&#203;', 'E' `
        -replace '&nbsp;', ' '  

    $parentRTMID = Get-ParentRTMID -Name $Name -RequirementType $RequirementType
    $ProcessedName=$ProcessedNameOld


    # Condition b: Replace '*' with '..' and add a warning
    if ($ProcessedName -match '\*') {
        $ProcessedName = $ProcessedName -replace '\*', '..'
        $Warnings += "Warning: * substituted with .. in Name"
    }

    # Condition c: Replace '\' with '-' and add a warning
    if ($ProcessedName -like "*\*") {
        $ProcessedName = $ProcessedName -replace '\\', '..'
        $Warnings += "Warning: \ substituted with .. in Name"
    }

    # Condition a: Truncate if length is more than 255 characters
    # if ($ProcessedName.Length -gt 255) {
    #     $ProcessedName = $ProcessedName.Substring(0, 255)
    #     $Warnings += "Warning: Name Truncated"
    # }
    if ($ProcessedName.Length -gt 255) {
        $ProcessedName = $ProcessedName.Substring(0, 255 - " Name Truncated".Length) + " Name Truncated"
        $Warnings += "Warning: Name Truncated"
    }    
    
    # $SchemaJira="PTC_CB945021_PTC_OTDS_0001_DB"
    # $DeliveryTeam="OTDS-OTDS"
#$Warnings -join '; '

    if ($SchemaJira -eq "PTC_CB945021_PTC_OTDS_0001_DB" -and $DeliveryTeam -eq "OTDS-OTDS" -and $RequirementType -eq 'L2 Requirement'){
        $NewRequirementType="114"
        $RequirementType="SURROGATE"
    }
    # Decode special characters for better readability
    $Warnings = $Warnings -replace '\u0027', "'" -replace '\u005C', '\'


    $filterField = 'user-template-10' 
    $parentRTMIDList = $parentRTMID -split ','

# Initialize an empty array to store the ParentALMReqID values
    $AllParentALMReqIDs = @()    

    # Loop through each parentRTMID and process
    foreach ($currentRTMID in $parentRTMIDList) {
        if (-not [string]::IsNullOrEmpty($currentRTMID)) {
            $parentRequirementIDUrl = "https://$almHost/qcbin/rest/domains/$almDomain/projects/$almProject/requirements?query={$filterField['$currentRTMID']}"

            try {
                # Make the API request to get the parent requirement details
                $ParentResponse = Invoke-RestMethod -Method Get -Uri $parentRequirementIDUrl -Headers @{ Accept = 'application/json'} -WebSession $webSession -UseBasicParsing
                $ParentResult = $ParentResponse.entities

                if ($ParentResult.Count -gt 1) {
                    $ParentALMReqIDs = @()

                    try {
                        # Attempt to fetch the parent requirement from JIRA
                        $parentJiraresponse = Invoke-RestMethod -Uri "$jiraUrl/rest/api/2/issue/$currentRTMID" -Method Get -Headers $Jheaders -UseBasicParsing
                        $ParentJiraALMReqID = $parentJiraresponse.fields.customfield_16723

                        # Iterate over each entity to extract ALMReqID
                        foreach ($entity in $ParentResult) {
                            $almPReqID = ($entity.Fields | Where-Object { $_.Name -eq 'id' }).values[0].value
                            $ParentALMReqIDs += $almPReqID
                        }

                        if ($ParentALMReqIDs -contains $ParentJiraALMReqID) {
                            $ParentALMReqID = $ParentJiraALMReqID
                        } else {
                            $ParentALMReqID = $null
                        }

                    } catch {
                        $ParentALMReqID = $null
                    }

                } elseif ($ParentResult.Count -eq 1) {
                    $ParentALMReqID = ($ParentResult.Fields | Where-Object { $_.Name -eq 'id' }).values[0].value
                } elseif ($ParentResult.Count -eq 0) {
                    $ParentALMReqID = $null
                }

            } catch {
                $ParentALMReqID = $null
            }

        } else {
            # If currentRTMID is null or empty, set ParentALMReqID to null
            $ParentALMReqID = $null
        }
        if ($ParentALMReqID) {
            $AllParentALMReqIDs += $ParentALMReqID
        }
        # Optionally, you can log or process each ParentALMReqID here
        #Write-Host "Parent ALM Requirement ID for $currentRTMID is: $ParentALMReqID"
    }


    $RequirementPayload = @{
        Fields = @(
            @{
                Name = 'type-id'
                values = @(
                    @{
                        value = $NewRequirementType
                    }
                )
            },
            @{
                Name = 'user-template-10'
                values = @(
                    @{
                        value = $RTM_ID
                    }
                )
            },
            @{
                Name = 'name'
                values = @(
                    @{
                        value = $ProcessedName
                    }
                )
            },
            @{
                Name = 'user-25'   #status
                values = @(
                    @{
                        value = $NewStatus
                    }
                )
            },
            @{
                Name = 'req-priority'  #criticality
                values = @(
                    @{
                        value = $NewCriticality 
                    }
                )
            },
            @{
                Name = 'user-template-14'  #safetyassesment
                values = @(
                    @{
                        value = $NewSafetyAssesment  
                    }
                )
            },
            @{
                Name = 'user-template-04'  #PTCValidationMethod
                values = @(
                    @{
                        value = $NewPTCValidationMethod
                    }
                )
            },
            @{
                Name = 'description'  #Description
                values = @(
                    @{
                        value = $ProcessedDescription 
                    }
                )
            },
            @{
                name = 'user-template-13'
                values = @(
                    @{
                        value= $OTITTeam
                    }
                )
            },
            @{
                name= 'user-26'
                values = @(
                    @{
                        value= $ReqCategoryNew
                    }
                )
            },
            @{
                name='user-template-15'
                values = @(
                    @{
                        value= $OTITProject
                    }
                )
            },
            @{
                name='owner'
                values = @(
                    @{
                        value= $almUsername
                    }
                )
            },
            @{
                name='user-28'
                values = @(
                    @{
                        value= "MFCONNECT2"
                    }
                )
            },
            @{
                name='user-template-07'
                values = @(
                    @{
                        value= $NegativeTest
                    }
                )
            }
        )
    } 
    if ($AllParentALMReqIDs) {
        $RequirementPayload.Fields += @{
            Name = 'parent-id'
            values = @(
                @{
                    value = $AllParentALMReqIDs[0] 
                }
            )
        }
    }    
    if ($RequirementType -eq "Feature") {
        $RequirementPayload.Fields = $RequirementPayload.Fields | Where-Object { $_.Name -ne 'user-template-14' }
    }


    #Write-Host $SafetyAssesment
    #Write-Host "Processing RTM ID: $RTM_ID"

############################################################## CREATE PORTION #############################################
    if ($ALMReqID -eq 0) {

        if(-not $OTITProgram -or $OTITProgram -eq "Null" ){
            $Warnings="Error: OT/IT Program cannot be a NULL value."
            $synctype='BLOCK CREATE'
            $Result='Requirement is not Created'
            $AlmRequirementIdValue='0'
            $TraceStatus=' '
            $finalScriptError =$null
            Add-ResultAndUpload -syncResults ([ref]$syncResults) `
                                        -RTM_ID $RTM_ID `
                                        -ALMReqID $AlmRequirementIdValue `
                                        -synctype $synctype `
                                        -Result $Result `
                                        -Schema $Schema `
                                        -Name $Name `
                                        -RequirementType $RequirementType `
                                        -Status $Status `
                                        -OTITProject $OTITProject `
                                        -parentRTMID $parentRTMID `
                                        -TraceStatus $TraceStatus `
                                        -Warnings $Warnings `
                                        -ScriptErrors $finalScriptError `
                                        -PlannedRelease $PlannedRelease

            Continue

        }

        $filterField = 'user-template-10'    

        $almRequirementUrl = "https://$almHost/qcbin/rest/domains/$almDomain/projects/$almProject/requirements?query={$filterField['$RTM_ID']}"
        try {
            $almResponse = Invoke-RestMethod -Method Get -Uri $almRequirementUrl -Headers @{ Accept = 'application/json'} -WebSession $webSession -UseBasicParsing
            $almResult = $almResponse.entities
        } catch {
            Add-ScriptError -ScriptErrorsRef $ScriptErrorsRef -exception $_.Exception
            $finalScriptError = if ($ScriptErrors.Count -gt 0) { 
                ($ScriptErrors | Select-Object -Unique) -join ";"
            } else { 
                " "
            }
            $TraceStatus=$null
            $finalWarnings = if ($Warnings.Count -gt 0) { 
                $Warnings -join ";"
            } else { 
                " "
            }
            $synctype='BLOCK CREATE'
            $Result="Can not get the requirement in ALM"
            Add-ResultAndUpload -syncResults ([ref]$syncResults) `
                                        -RTM_ID $RTM_ID `
                                        -ALMReqID $ALMReqID `
                                        -synctype $synctype `
                                        -Result $Result `
                                        -Schema $Schema `
                                        -Name $Name `
                                        -RequirementType $RequirementType `
                                        -Status $Status `
                                        -OTITProject $OTITProject `
                                        -parentRTMID $parentRTMID `
                                        -TraceStatus $TraceStatus `
                                        -Warnings $Warnings `
                                        -ScriptErrors $finalScriptError `
                                        -PlannedRelease $PlannedRelease
            continue
        }
        
        $almXsrfToken = ($webSession.Cookies.GetCookies($almRequirementUrl) | Where-Object { $_.Name -eq 'XSRF-TOKEN' }).Value
        if ($headers.ContainsKey("X-XSRF-TOKEN") -eq $false -and $almXsrfToken) {
            $headers["X-XSRF-TOKEN"] = $almXsrfToken
        }

        if ($almResult.Count -eq 0) {
			if ($RequirementType -ne 'Feature' ) {
                $RequirementPayload.Fields += @{
                    Name = 'user-template-06'
                    values = @(
                        @{
                            value = $PlannedRelease
                        }
                    )
                }
            }


            $newRequirementPayload= $RequirementPayload | ConvertTo-Json -Depth 100

            # Create new requirement and handle errors
            $newRequirementUrlUpdate = "https://$almHost/qcbin/rest/domains/$almDomain/projects/$almProject/requirements"
            try {
                $newRequirementResponse = Invoke-RestMethod -Method Post -Uri $newRequirementUrlUpdate -Headers $headers -Body $newRequirementPayload -WebSession $webSession -UseBasicParsing
                $newALMReqID = ($newRequirementResponse.Fields | Where-Object { $_.Name -eq 'id' }).values[0].value
                #Write-Host "New ALM Requirement ID for $RTM_ID is $newALMReqID"
				$synctype='CREATE'
				$Result='Requirement has been created successfully'

                                                    
            } catch {

                Add-ScriptError -ScriptErrorsRef $ScriptErrorsRef -exception $_.Exception
                $synctype='BLOCK CREATE'
				$Result='Requirement is not Created'

                $AlmRequirementIdValue='0'
                $TraceStatus=' '
                $finalWarnings = if ($Warnings.Count -gt 0) { 
                    $Warnings -join ";"
                } else { 
                    " "
                }
                $finalScriptError = if ($ScriptErrors.Count -gt 0) { 
                    ($ScriptErrors | Select-Object -Unique) -join ";"
                } else { 
                    " "
                }
                
                Add-ResultAndUpload -syncResults ([ref]$syncResults) `
                                    -RTM_ID $RTM_ID `
                                    -ALMReqID $AlmRequirementIdValue `
                                    -synctype $synctype `
                                    -Result $Result `
                                    -Schema $Schema `
                                    -Name $Name `
                                    -RequirementType $RequirementType `
                                    -Status $Status `
                                    -OTITProject $OTITProject `
                                    -parentRTMID $parentRTMID `
                                    -TraceStatus $TraceStatus `
                                    -Warnings $finalWarnings `
                                    -ScriptErrors $finalScriptError `
                                    -PlannedRelease $PlannedRelease

                continue
            }

            # Update JIRA with the new ALM requirement ID
            $JIRAupdateURL = "$jiraUrl/rest/api/2/issue/$RTM_ID"
            $payload = @{
                fields = @{
                    customfield_16723 = [string]$newALMReqID  # Ensure the value is converted to string
                }
            }
            $jsonPayload = $payload | ConvertTo-Json
            try {
                $update = Invoke-WebRequest -Uri $JIRAupdateURL -Method Put -Headers $Jheaders -Body $jsonPayload -UseBasicParsing
                if ($update.StatusCode -eq 204) {
                    # $Warnings+="Info: ALM Requirement ID Has been Updated Successfully in JIRA"
                } else {
                    $Warnings+="Error: Not able to Update ALM Requirement ID in JIRA"
                }
            } catch {
                #Write-Host "Failed to Edit $RTM_ID."
                Add-ScriptError -ScriptErrorsRef $ScriptErrorsRef -exception $_.Exception
                $Warnings+="Error: Not able to Update ALM Requirement ID in JIRA"
            }

            $traceStatuses = @()

            # Check if there are any ParentALMReqID values to process
           
                # Loop through each ParentALMReqID
            foreach ($ParentALMReqID in $AllParentALMReqIDs) {
                # Only proceed if ParentALMReqID is not null or empty
                if (-not [string]::IsNullOrEmpty($ParentALMReqID)) {
                    $RequirementTraceUrl = "https://$almHost/qcbin/rest/domains/$almDomain/projects/$almProject/req-traces"
                    
                    # Build the traceability body for each parent
                    $traceabilityBody = @{
                        Fields = @(
                            @{
                                Name = "owner"
                                values = @(
                                    @{
                                        value = $almUsername
                                    }
                                )
                            },
                            @{
                                Name = "to-req-id"
                                values = @(
                                    @{
                                        value = $newALMReqID
                                    }
                                )
                            },
                            @{
                                Name = "from-req-id"
                                values = @(
                                    @{
                                        value = $ParentALMReqID
                                    }
                                )
                            },
                            @{
                                Name = "comment"
                                values = @(
                                    @{ }
                                )
                            }
                        )
                        Type = "req-trace"
                    }

                    # Convert the PowerShell object to a JSON string
                    $TraceabilityjsonBody = $traceabilityBody | ConvertTo-Json -Depth 5

                    try {
                        # Make the API request to create the traceability record
                        $TraceResponse = Invoke-RestMethod -Method Post -Uri $RequirementTraceUrl -Headers $headers -Body $TraceabilityjsonBody -WebSession $webSession -UseBasicParsing
                        # Store trace status for this iteration
                        $traceStatuses += 'Yes'  # If traceability is successful
                    } catch {
                        # Handle errors (like duplicate traces)
                        Add-ScriptError -ScriptErrorsRef $ScriptErrorsRef -exception $_.Exception
                            # $ScriptErrors | ForEach-Object { Write-Host $_ }
                        if ($ScriptErrors[-1] -like "*These requirements are already traced*") {
                            $traceStatuses += " "  # If the condition matches, append a space
                        } else {
                            $traceStatuses+= "No"  # For other errors, append "No"
                        }
                            
                    }
                } else {
                    # If ParentALMReqID is empty or null, store the status accordingly
                    $traceStatuses += ' '
                    if ($RequirementType -like "*L1*" -or $RequirementType -like "*L2*"){
                        $synctype='ORPHAN TRACE'
                        $Warnings+="Warning: requirement is orphan."
                    }
                }
            }
            # $AlmRequirementIdValue='0'
            # $TraceStatus=' '
            $finalWarnings = if ($Warnings.Count -gt 0) { 
                $Warnings -join ";"
            } else { 
                " "
            }
            $finalScriptError = if ($ScriptErrors.Count -gt 0) { 
                ($ScriptErrors | Select-Object -Unique) -join ";"
            } else { 
                " "
            }
            # $finalTrace=$traceStatuses -join '; '
            $finalTrace = ($traceStatuses | Where-Object { $_ -ne " " }) -join '; '
            Add-ResultAndUpload -syncResults ([ref]$syncResults) `
                                -RTM_ID $RTM_ID `
                                -ALMReqID $newALMReqID `
                                -synctype $synctype `
                                -Result $Result `
                                -Schema $Schema `
                                -Name $Name `
                                -RequirementType $RequirementType `
                                -Status $Status `
                                -OTITProject $OTITProject `
                                -parentRTMID $parentRTMID `
                                -TraceStatus $finalTrace `
                                -Warnings $finalWarnings `
                                -ScriptErrors $finalScriptError `
                                -PlannedRelease $PlannedRelease          

           
        } elseif($almResult.Count -eq 1) {
            

            # Entities found, update JIRA with the existing ALM requirement ID
            foreach ($entity in $almResult) {
                $idField = $entity.Fields | Where-Object { $_.Name -eq 'id' }
                $ReqID = $idField.values[0].value
				$planRel = $entity.Fields | Where-Object { $_.Name -eq 'user-template-06' }
                $ALMPtcValidation = $entity.Fields | Where-Object { $_.Name -eq 'user-template-04' }
                $ALMPtcValidationValue=$ALMPtcValidation.values[0].value
                $AlmName=$entity.Fields | Where-Object { $_.Name -eq 'name' }
                $AlmNameValue=$AlmName.values[0].value
                $AlmSts=$entity.Fields | Where-Object { $_.Name -eq 'user-25' }
                $AlmStatus=$AlmSts.values[0].value
                
                if($Status -eq "Cancelled" -or $AlmStatus -eq "5-Obsolete"){
                    $Warnings+="Warning: Either parent and/or child in a completed trace is in status 5-Obsolete."
                }                

                #PTC VALIDATION WARNING MESSAGE
                # Assuming NewPTCValidationMethod is already defined
                if ($ALMPtcValidationValue -eq $NewPTCValidationMethod) {
                    # Your code here for when the values are equal
                    $NewPTCValidationMethod=$NewPTCValidationMethod
                } else {
                    # Your code here for when the values are not equal
                    $NewPTCValidationMethod=$ALMPtcValidationValue
                    $Warnings += "Warning: JIRA/ALM PTC Validation Method mismatch. ALM value = $NewPTCValidationMethod overrides JIRA value."
                    
                }
                # Find and update the 'user-template-07' field in the Fields array
                $fieldPTC = $RequirementPayload.Fields | Where-Object { $_.name -eq 'user-template-04' }

                if ($fieldPTC) {
                    $fieldPTC.values[0].value = $NewPTCValidationMethod
                } else {
                    # Write-Host "'user-template-07' field not found!"
                }

                #UPDATE NAME CRITERIA
                if ($AlmNameValue.Contains($JiraParentChild) -and $ProcessedNameOld -ne $AlmNameValue) {
                    $Warnings +="Warning: JIRA Name changed. Name change done before updating other fields, to prevent duplicate record creation."
                    $synctype="UPDATE NAME"
                }elseif(-not $AlmNameValue.Contains($JiraParentChild) -and $ProcessedNameOld -ne $AlmNameValue) {
                    $Warnings +="Warning: JIRA parent changed. ALM From Trace updated."
                    $synctype="UPDATE PARENT TRACE"
                }
                
                if ($planRel) {
                    # Initialize an empty array to store all values
                    $planRelValues = @()
            
                    # Iterate through each value in planRel.values and extract 'value' property
                    foreach ($valueObject in $planRel.values) {
                        $planRelValues += $valueObject.value
                    }
            
                    # Join all the values into a string separated by semicolons
                    $planRelString = $planRelValues -join ';'
                    # Check if $PlannedRelease is not already in the string
                    if ($PlannedRelease -and ($planRelString -notlike "*$PlannedRelease*")) {
                        # Append $PlannedRelease at the end with a semicolon
                        $planRelString = "$planRelString;$PlannedRelease"
                    }
            
                    #Write-Host $planRelString
                }
                if ($RequirementType -ne 'Feature' ) {
                    $RequirementPayload.Fields += @{
                        Name = 'user-template-06'
                        values = @(
                            @{
                                value = $planRelString
                            }
                        )
                    }
                }

				if ($almProject -eq "A956001_PTC_Program_000000") {
                    # Remove 'parent-id' from the Fields array if it exists
                    $RequirementPayload.Fields = $RequirementPayload.Fields | Where-Object { $_.Name -ne 'parent-id' }
                }
        
                $newRequirementPayload= $RequirementPayload | ConvertTo-Json -Depth 100
                #Write-Output "Corresponding ALM ID: $ReqID"
                $updateRequirementUrlC= "https://$almHost/qcbin/rest/domains/$almDomain/projects/$almProject/requirements/$ReqID"
                $Warnings += "Warning: RTM ID Already exists in ALM"

                try {
                    $updateRequirementResponseC = Invoke-WebRequest -Method Put -Uri $updateRequirementUrlC -Headers $headers -Body $newRequirementPayload -WebSession $webSession -UseBasicParsing
                    if ([string]::IsNullOrEmpty($synctype)) {
                        $synctype = 'JIRA UPDATE'
                        
                    }
					$Result='Requirement already exists in ALM , so updated that Requirement ID in JIRA'

                } catch {
                    Add-ScriptError -ScriptErrorsRef $ScriptErrorsRef -exception $_.Exception
                    # Add-ScriptError -ScriptErrorsRef $ScriptErrorsRef -exception $_.Exception
                    $synctype='BLOCK CREATE'
                    $Result='Requirement is not Created'
                    $TraceStatus=' '
                    $finalWarnings = if ($Warnings.Count -gt 0) { 
                        $Warnings -join ";"
                    } else { 
                        " "
                    }
                    $finalScriptError = if ($ScriptErrors.Count -gt 0) { 
                        ($ScriptErrors | Select-Object -Unique) -join ";"
                    } else { 
                        " "
                    }
                    Add-ResultAndUpload -syncResults ([ref]$syncResults) `
                                            -RTM_ID $RTM_ID `
                                            -ALMReqID $ReqID `
                                            -synctype $synctype `
                                            -Result $Result `
                                            -Schema $Schema `
                                            -Name $Name `
                                            -RequirementType $RequirementType `
                                            -Status $Status `
                                            -OTITProject $OTITProject `
                                            -parentRTMID $parentRTMID `
                                            -TraceStatus $TraceStatus `
                                            -Warnings $finalWarnings `
                                            -ScriptErrors $finalScriptError `
                                            -PlannedRelease $PlannedRelease

                    continue
                }
                
                $JIRAupdateURL = "$jiraUrl/rest/api/2/issue/$RTM_ID"
                $payload = @{
                    fields = @{
                        customfield_16723 = [string]$ReqID  # Ensure the value is converted to string
                    }
                }
                $jsonPayload = $payload | ConvertTo-Json
                try {
                    $update = Invoke-WebRequest -Uri $JIRAupdateURL -Method Put -Headers $Jheaders -Body $jsonPayload -UseBasicParsing
                    if ($update.StatusCode -eq 204) {
                        # $Warnings+="Info: ALM Requirement ID Has been Updated Successfully in JIRA"
                    } else {
                        $Warnings+="Error: Not able to Update ALM Requirement ID in JIRA"
                    }
                } catch {
                    $Warnings+="Error: Not able to Update ALM Requirement ID in JIRA"
                    Add-ScriptError -ScriptErrorsRef $ScriptErrorsRef -exception $_.Exception

                }
                # Initialize an array to store the trace IDs
                $traceIDsToDelete = @()

                # Fetch the requirement traces by the 'to-req-id'
                $traceQueryUrl = "https://$almHost/qcbin/rest/domains/$almDomain/projects/$almProject/req-traces?query={to-req-id[$ReqID]}"

                # # Make the GET request to fetch existing traces
                try {
                    $traceResponse = Invoke-RestMethod -Method Get -Uri $traceQueryUrl -Headers $headers -WebSession $webSession -UseBasicParsing
                    # Extract the trace IDs from the response and store them in the array
                    if ($traceResponse.entities) {
                        foreach ($trace in $traceResponse.entities) {
                            $traceID = $trace.Fields | Where-Object { $_.Name -eq "id" } | Select-Object -ExpandProperty values | Select-Object -ExpandProperty value
                            $traceIDsToDelete += $traceID
                        }
                    }
                } catch {
                    Add-ScriptError -ScriptErrorsRef $ScriptErrorsRef -exception $_.Exception
                }

                if ($null -eq $parentRTMID -or $parentRTMID -eq 'Null' -or $parentRTMID -eq ''){
                    if ($RequirementType -like "*L1*" -or $RequirementType -like "*L2*"){
                        $synctype='ORPHAN TRACE'
                        $Warnings+="Warning: requirement is orphan."
                    }
                    # Check if there are trace IDs to delete
                    if ($traceIDsToDelete.Count -gt 0) {
                        # Loop through each trace ID and send a DELETE request
                        foreach ($traceID in $traceIDsToDelete) {
                            $deleteUrl = "https://$almHost/qcbin/rest/domains/$almDomain/projects/$almProject/req-traces/$traceID"
                            try {
                                # Make the DELETE request to delete the trace
                                Invoke-RestMethod -Method Delete -Uri $deleteUrl -Headers $headers -WebSession $webSession -UseBasicParsing | Out-Null
                                
                                # Write-Host "Successfully deleted trace ID $traceID"
                            } catch {
                                Add-ScriptError -ScriptErrorsRef $ScriptErrorsRef -exception $_.Exception
                            }
                        }
                    } else {
                        # Write-Host "No existing traces found to delete."
                    }
                } else {
                    if ($traceIDsToDelete.Count -gt 0) {
                        # Loop through each trace ID and send a DELETE request
                        foreach ($traceID in $traceIDsToDelete) {
                            $deleteUrl = "https://$almHost/qcbin/rest/domains/$almDomain/projects/$almProject/req-traces/$traceID"
                            try {
                                # Make the DELETE request to delete the trace
                                Invoke-RestMethod -Method Delete -Uri $deleteUrl -Headers $headers -WebSession $webSession -UseBasicParsing | Out-Null
                                # Write-Host "Successfully deleted trace ID $traceID"
                            } catch {
                                Add-ScriptError -ScriptErrorsRef $ScriptErrorsRef -exception $_.Exception
                            }
                        }
                    } else {
                        # Write-Host "No existing traces found to delete."
                    }
                }
                


            # Check if there are any ParentALMReqID values to process
                $traceStatuses = @()

                    # Loop through each ParentALMReqID
                foreach ($ParentALMReqID in $AllParentALMReqIDs) {
                    # Only proceed if ParentALMReqID is not null or empty
                    if (-not [string]::IsNullOrEmpty($ParentALMReqID)) {
                        $RequirementTraceUrl = "https://$almHost/qcbin/rest/domains/$almDomain/projects/$almProject/req-traces"
                        
                        # Build the traceability body for each parent
                        $traceabilityBody = @{
                            Fields = @(
                                @{
                                    Name = "owner"
                                    values = @(
                                        @{
                                            value = $almUsername
                                        }
                                    )
                                },
                                @{
                                    Name = "to-req-id"
                                    values = @(
                                        @{
                                            value = $ReqID
                                        }
                                    )
                                },
                                @{
                                    Name = "from-req-id"
                                    values = @(
                                        @{
                                            value = $ParentALMReqID
                                        }
                                    )
                                },
                                @{
                                    Name = "comment"
                                    values = @(
                                        @{ }
                                    )
                                }
                            )
                            Type = "req-trace"
                        }

                        # Convert the PowerShell object to a JSON string
                        $TraceabilityjsonBody = $traceabilityBody | ConvertTo-Json -Depth 5

                        try {
                            # Make the API request to create the traceability record
                            $TraceResponse = Invoke-RestMethod -Method Post -Uri $RequirementTraceUrl -Headers $headers -Body $TraceabilityjsonBody -WebSession $webSession -UseBasicParsing
                            # Store trace status for this iteration
                            $traceStatuses += 'Yes'  # If traceability is successful
                        } catch {
                            Add-ScriptError -ScriptErrorsRef $ScriptErrorsRef -exception $_.Exception
                            # $ScriptErrors | ForEach-Object { Write-Host $_ }
                            if ($ScriptErrors[-1] -like "*These requirements are already traced*") {
                                $traceStatuses += " "  # If the condition matches, append a space
                            } else {
                                $traceStatuses+= "No"  # For other errors, append "No"
                            }
                            

                            
                        }
                    } else {
                        # If ParentALMReqID is empty or null, store the status accordingly
                        $traceStatuses += ' '
                    }
                }
                
                # Add the final sync result with the trace status
                $finalTrace = ($traceStatuses | Where-Object { $_ -ne " " }) -join '; '
                $finalWarnings = if ($Warnings.Count -gt 0) { 
                    $Warnings -join ";"
                } else { 
                    " "
                }
                $finalScriptError = if ($ScriptErrors.Count -gt 0) { 
                    ($ScriptErrors | Select-Object -Unique) -join ";"
                } else { 
                    " "
                }
                Add-ResultAndUpload -syncResults ([ref]$syncResults) `
                                    -RTM_ID $RTM_ID `
                                    -ALMReqID $ReqID `
                                    -synctype $synctype `
                                    -Result $Result `
                                    -Schema $Schema `
                                    -Name $Name `
                                    -RequirementType $RequirementType `
                                    -Status $Status `
                                    -OTITProject $OTITProject `
                                    -parentRTMID $parentRTMID `
                                    -TraceStatus $finalTrace `
                                    -Warnings $finalWarnings `
                                    -ScriptErrors $finalScriptError `
                                    -PlannedRelease $PlannedRelease
                
            }
        }elseif($almResult.Count -gt 1){
            #Write-Host "Blocked Create since multiple requirements are available in ALM for $RTM_ID . "
			$synctype='BLOCK CREATE'
			$Result='Multiple Requirements are available in ALM'
            $Warnings+="Warning: Multiple RTM ID Already exists in ALM"
            $finalWarnings = if ($Warnings.Count -gt 0) { 
                $Warnings -join ";"
            } else { 
                " "
            }
            $AlmRequirementIdValue='0'
			$TraceStatus=' '
            $finalScriptError = if ($ScriptErrors.Count -gt 0) { 
                ($ScriptErrors | Select-Object -Unique) -join ";"
            } else { 
                " "
            }
            Add-ResultAndUpload -syncResults ([ref]$syncResults) `
                                -RTM_ID $RTM_ID `
                                -ALMReqID $AlmRequirementIdValue `
                                -synctype $synctype `
                                -Result $Result `
                                -Schema $Schema `
                                -Name $Name `
                                -RequirementType $RequirementType `
                                -Status $Status `
                                -OTITProject $OTITProject `
                                -parentRTMID $parentRTMID `
                                -TraceStatus $TraceStatus `
                                -Warnings $finalWarnings `
                                -ScriptErrors $finalScriptError `
                                -PlannedRelease $PlannedRelease
			
	
            continue
        }

####################### UPDATE SECTION ####################################################################3        
    # } elseif ($ALMReqID -ne 0) {
    } elseif(($ALMReqID -match '^\d+$' -and [int]$ALMReqID -ge 1)){

        $filterField = 'user-template-10'    
        $almRequirementUrl = "https://$almHost/qcbin/rest/domains/$almDomain/projects/$almProject/requirements?query={$filterField['$RTM_ID']}"
        $almXsrfToken = ($webSession.Cookies.GetCookies($almRequirementUrl) | Where-Object { $_.Name -eq 'XSRF-TOKEN' }).Value
  
        try {
            $almResponse = Invoke-RestMethod -Method Get -Uri $almRequirementUrl -Headers @{ Accept = 'application/json'} -WebSession $webSession -UseBasicParsing
            $almResult = $almResponse.entities
        } catch {
            Add-ScriptError -ScriptErrorsRef $ScriptErrorsRef -exception $_.Exception
            $finalScriptError = if ($ScriptErrors.Count -gt 0) { 
                ($ScriptErrors | Select-Object -Unique) -join ";"
            } else { 
                " "
            }
            $TraceStatus=$null
            $finalWarnings = if ($Warnings.Count -gt 0) { 
                $Warnings -join ";"
            } else { 
                " "
            }
            $synctype='BLOCK UPDATE'
            $Result="Can not get the requirement in ALM"
            Add-ResultAndUpload -syncResults ([ref]$syncResults) `
                                        -RTM_ID $RTM_ID `
                                        -ALMReqID $ALMReqID `
                                        -synctype $synctype `
                                        -Result $Result `
                                        -Schema $Schema `
                                        -Name $Name `
                                        -RequirementType $RequirementType `
                                        -Status $Status `
                                        -OTITProject $OTITProject `
                                        -parentRTMID $parentRTMID `
                                        -TraceStatus $TraceStatus `
                                        -Warnings $Warnings `
                                        -ScriptErrors $finalScriptError `
                                        -PlannedRelease $PlannedRelease
            continue
        }

        if ($headers.ContainsKey("X-XSRF-TOKEN") -eq $false -and $almXsrfToken) {
            $headers["X-XSRF-TOKEN"] = $almXsrfToken
        }
        
        if ($almResult.Count -eq 0) {
			#Write-Host "Requirement does not exist in ALM , So blocking the update for $RTM_ID . BLOCK UPDATE "         
			
			$synctype='BLOCK UPDATE'
			$Result='Requirement not exist in ALM'
            $Warnings+="Error: Requirement Does not exist in ALM"
			$TraceStatus=' '
            $finalWarnings = if ($Warnings.Count -gt 0) { 
                $Warnings -join ";"
            } else { 
                " "
            }
            $finalScriptError = if ($ScriptErrors.Count -gt 0) { 
                ($ScriptErrors | Select-Object -Unique) -join ";"
            } else { 
                " "
            }
            Add-ResultAndUpload -syncResults ([ref]$syncResults) `
                                -RTM_ID $RTM_ID `
                                -ALMReqID $ALMReqID `
                                -synctype $synctype `
                                -Result $Result `
                                -Schema $Schema `
                                -Name $Name `
                                -RequirementType $RequirementType `
                                -Status $Status `
                                -OTITProject $OTITProject `
                                -parentRTMID $parentRTMID `
                                -TraceStatus $TraceStatus `
                                -Warnings $finalWarnings `
                                -ScriptErrors $finalScriptError `
                                -PlannedRelease $PlannedRelease

			continue

        }
        elseif($almResult.Count -eq 1) {
            foreach ($entity in $almResult) {
                $idField = $entity.Fields | Where-Object { $_.Name -eq 'id' }
                $ReqID = $idField.values[0].value
				$planRel = $entity.Fields | Where-Object { $_.Name -eq 'user-template-06' }
                $ALMPtcValidation = $entity.Fields | Where-Object { $_.Name -eq 'user-template-04' }
                $ALMPtcValidationValue=$ALMPtcValidation.values[0].value
                $AlmName=$entity.Fields | Where-Object { $_.Name -eq 'name' }
                $AlmNameValue=$AlmName.values[0].value
                $AlmSts=$entity.Fields | Where-Object { $_.Name -eq 'user-25' }
                $AlmStatus=$AlmSts.values[0].value
                
                if($Status -eq "Cancelled" -or $AlmStatus -eq "5-Obsolete"){
                    $Warnings+="Warning: Either parent and/or child in a completed trace is in status 5-Obsolete."
                }                   

                # Assuming NewPTCValidationMethod is already defined
                if ($ALMPtcValidationValue -eq $NewPTCValidationMethod) {
                    # Your code here for when the values are equal
                    $NewPTCValidationMethod=$NewPTCValidationMethod
                } else {
                    # Your code here for when the values are not equal
                    $NewPTCValidationMethod=$ALMPtcValidationValue
                    $Warnings += "Warning: JIRA/ALM PTC Validation Method mismatch. ALM value = $NewPTCValidationMethod overrides JIRA value."
                    
                }
                # Find and update the 'user-template-07' field in the Fields array
                $fieldPTC = $RequirementPayload.Fields | Where-Object { $_.name -eq 'user-template-04' }

                if ($fieldPTC) {
                    $fieldPTC.values[0].value = $NewPTCValidationMethod
                } else {
                    # Write-Host "'user-template-07' field not found!"
                }   

                #UPDATE NAME CRITERIA
                if ($AlmNameValue.Contains($JiraParentChild) -and $ProcessedNameOld -ne $AlmNameValue) {
                    $Warnings +="Warning: JIRA Name changed. Name change done before updating other fields, to prevent duplicate record creation."
                    $synctype="UPDATE NAME"
                }elseif(-not $AlmNameValue.Contains($JiraParentChild) -and $ProcessedNameOld -ne $AlmNameValue) {
                    $Warnings +="Warning: JIRA parent changed. ALM From Trace updated."
                    $synctype="UPDATE PARENT TRACE"
                }               

                if ($planRel) {
                    # Initialize an empty array to store all values
                    $planRelValues = @()
            
                    # Iterate through each value in planRel.values and extract 'value' property
                    foreach ($valueObject in $planRel.values) {
                        $planRelValues += $valueObject.value
                    }
            
                    # Join all the values into a string separated by semicolons
                    $planRelString = $planRelValues -join ';'
                    # Check if $PlannedRelease is not already in the string
                    if ($PlannedRelease -and ($planRelString -notlike "*$PlannedRelease*")) {
                        # Append $PlannedRelease at the end with a semicolon
                        $planRelString = "$planRelString;$PlannedRelease"
                    }
            
                    #Write-Host $planRelString
                }
                if ($RequirementType -ne 'Feature' ) {
                    $RequirementPayload.Fields += @{
                        Name = 'user-template-06'
                        values = @(
                            @{
                                value = $planRelString
                            }
                        )
                    }
                } 

				if ($almProject -eq "A956001_PTC_Program_000000") {
                    # Remove 'parent-id' from the Fields array if it exists
                    $RequirementPayload.Fields = $RequirementPayload.Fields | Where-Object { $_.Name -ne 'parent-id' }
                }

                $newRequirementPayload= $RequirementPayload | ConvertTo-Json -Depth 100
                #Write-Output "Corresponding ALM ID: $ReqID"
                if($ReqID -eq $ALMReqID){
                    $updateRequirementUrl= "https://$almHost/qcbin/rest/domains/$almDomain/projects/$almProject/requirements/$ReqID"

                    try {
                        $updateRequirementResponse = Invoke-WebRequest -Method Put -Uri $updateRequirementUrl -Headers $headers -Body $newRequirementPayload -WebSession $webSession -UseBasicParsing
                        #Write-Host "Requirement  $RTM_ID has been successfully updated."
						# $synctype='UPDATE'
                        if ([string]::IsNullOrEmpty($synctype)) {
                            $synctype = 'UPDATE'
                            
                        }
						$Result='Requirement Updated successfully'

                        #Write-Host $updateRequirementResponse.StatusCode
                    } catch {
                        Add-ScriptError -ScriptErrorsRef $ScriptErrorsRef -exception $_.Exception
                        $synctype='BLOCK UPDATE'
                        $Result='Requirement is not Updated'
                        $Warnings+="Error: Failed to Update the Requirement"
                        $TraceStatus=' '
                        $finalScriptError = if ($ScriptErrors.Count -gt 0) { 
                            ($ScriptErrors | Select-Object -Unique) -join ";"
                        } else { 
                            " "
                        }
                        $finalWarnings = if ($Warnings.Count -gt 0) { 
                            $Warnings -join ";"
                        } else { 
                            " "
                        }
                        Add-ResultAndUpload -syncResults ([ref]$syncResults) `
                                                -RTM_ID $RTM_ID `
                                                -ALMReqID $ALMReqID `
                                                -synctype $synctype `
                                                -Result $Result `
                                                -Schema $Schema `
                                                -Name $Name `
                                                -RequirementType $RequirementType `
                                                -Status $Status `
                                                -OTITProject $OTITProject `
                                                -parentRTMID $parentRTMID `
                                                -TraceStatus $TraceStatus `
                                                -Warnings $finalWarnings `
                                                -ScriptErrors $finalScriptError `
                                                -PlannedRelease $PlannedRelease
                        
                        continue
                    }

                }else{
                    #Write-Host "Requirement ID mismatch between ALM and JIRA for $RTM_ID "
					$synctype='BLOCK UPDATE'
					$Result='ALM Requirement ID mismatch between JIRA and ALM'
                    $Warnings+="Error: JIRA ISSUE KEY/ALM Requirement ID mismatch with ALM RTM ID/REQ_ID"
                    $TraceStatus=' '
                    $finalWarnings = if ($Warnings.Count -gt 0) { 
                        $Warnings -join ";"
                    } else { 
                        " "
                    }
                    $finalScriptError = if ($ScriptErrors.Count -gt 0) { 
                        ($ScriptErrors | Select-Object -Unique) -join ";"
                    } else { 
                        " "
                    }
                    Add-ResultAndUpload -syncResults ([ref]$syncResults) `
                                        -RTM_ID $RTM_ID `
                                        -ALMReqID $ALMReqID `
                                        -synctype $synctype `
                                        -Result $Result `
                                        -Schema $Schema `
                                        -Name $Name `
                                        -RequirementType $RequirementType `
                                        -Status $Status `
                                        -OTITProject $OTITProject `
                                        -parentRTMID $parentRTMID `
                                        -TraceStatus $TraceStatus `
                                        -Warnings $finalWarnings `
                                        -ScriptErrors $finalScriptError `
                                        -PlannedRelease $PlannedRelease


					continue
                }

                $traceIDsToDelete = @()

                # Fetch the requirement traces by the 'to-req-id'
                $traceQueryUrl = "https://$almHost/qcbin/rest/domains/$almDomain/projects/$almProject/req-traces?query={to-req-id[$ALMReqID]}"

                # Make the GET request to fetch existing traces
                try {
                    $traceResponse = Invoke-RestMethod -Method Get -Uri $traceQueryUrl -Headers $headers -WebSession $webSession -UseBasicParsing
                    # Extract the trace IDs from the response and store them in the array
                    if ($traceResponse.entities) {
                        foreach ($trace in $traceResponse.entities) {
                            $traceID = $trace.Fields | Where-Object { $_.Name -eq "id" } | Select-Object -ExpandProperty values | Select-Object -ExpandProperty value
                            $traceIDsToDelete += $traceID
                        }
                    }
                } catch {
                    Add-ScriptError -ScriptErrorsRef $ScriptErrorsRef -exception $_.Exception
                    # Write-Host "Failed to retrieve trace information: $_"
                }   	
                if ($null -eq $parentRTMID -or $parentRTMID -eq 'Null' -or $parentRTMID -eq ''){
                    if ($RequirementType -like "*L1*" -or $RequirementType -like "*L2*"){
                        $synctype='ORPHAN TRACE'
                        $Warnings+="Warning: requirement is orphan."
                    }
                    # Check if there are trace IDs to delete
                    if ($traceIDsToDelete.Count -gt 0) {
                        # Loop through each trace ID and send a DELETE request
                        foreach ($traceID in $traceIDsToDelete) {
                            $deleteUrl = "https://$almHost/qcbin/rest/domains/$almDomain/projects/$almProject/req-traces/$traceID"
                            try {
                                # Make the DELETE request to delete the trace
                                Invoke-RestMethod -Method Delete -Uri $deleteUrl -Headers $headers -WebSession $webSession -UseBasicParsing | Out-Null
                                
                                # Write-Host "Successfully deleted trace ID $traceID"
                            } catch {
                                Add-ScriptError -ScriptErrorsRef $ScriptErrorsRef -exception $_.Exception
                                # Write-Host "Failed to delete trace ID $traceID : $_"
                            }
                        }
                    } else {
                        # Write-Host "No existing traces found to delete."
                    }
                } else {
                    if ($traceIDsToDelete.Count -gt 0) {
                        # Loop through each trace ID and send a DELETE request
                        foreach ($traceID in $traceIDsToDelete) {
                            $deleteUrl = "https://$almHost/qcbin/rest/domains/$almDomain/projects/$almProject/req-traces/$traceID"
                            try {
                                # Make the DELETE request to delete the trace
                                Invoke-RestMethod -Method Delete -Uri $deleteUrl -Headers $headers -WebSession $webSession -UseBasicParsing | Out-Null
                                # Write-Host "Successfully deleted trace ID $traceID"
                            } catch {
                                Add-ScriptError -ScriptErrorsRef $ScriptErrorsRef -exception $_.Exception
                                # Write-Host "Failed to delete trace ID $traceID : $_"
                            }
                        }
                    } else {
                        # Write-Host "No existing traces found to delete."
                    }
                }
                                		

                # Initialize an array to store trace statuses for all iterations
                $traceStatuses = @()

                    # Loop through each ParentALMReqID
                foreach ($ParentALMReqID in $AllParentALMReqIDs) {
                    # Only proceed if ParentALMReqID is not null or empty
                    if (-not [string]::IsNullOrEmpty($ParentALMReqID)) {
                        $RequirementTraceUrl = "https://$almHost/qcbin/rest/domains/$almDomain/projects/$almProject/req-traces"
                        
                        # Build the traceability body for each parent
                        $traceabilityBody = @{
                            Fields = @(
                                @{
                                    Name = "owner"
                                    values = @(
                                        @{
                                            value = $almUsername
                                        }
                                    )
                                },
                                @{
                                    Name = "to-req-id"
                                    values = @(
                                        @{
                                            value = $ALMReqID
                                        }
                                    )
                                },
                                @{
                                    Name = "from-req-id"
                                    values = @(
                                        @{
                                            value = $ParentALMReqID
                                        }
                                    )
                                },
                                @{
                                    Name = "comment"
                                    values = @(
                                        @{ }
                                    )
                                }
                            )
                            Type = "req-trace"
                        }

                        # Convert the PowerShell object to a JSON string
                        $TraceabilityjsonBody = $traceabilityBody | ConvertTo-Json -Depth 5

                        try {
                            # Make the API request to create the traceability record
                            $TraceResponse = Invoke-RestMethod -Method Post -Uri $RequirementTraceUrl -Headers $headers -Body $TraceabilityjsonBody -WebSession $webSession -UseBasicParsing
                            # Store trace status for this iteration
                            $traceStatuses += 'Yes'  # If traceability is successful
                        } catch {
                            Add-ScriptError -ScriptErrorsRef $ScriptErrorsRef -exception $_.Exception
                            # $ScriptErrors | ForEach-Object { Write-Host $_ }
                            if ($ScriptErrors[-1] -like "*These requirements are already traced*") {
                                $traceStatuses += " "  # If the condition matches, append a space
                            } else {
                                $traceStatuses+= "No"  # For other errors, append "No"
                            }
                        }
                    } else {
                        # If ParentALMReqID is empty or null, store the status accordingly
                        $traceStatuses += ' '
                    }
                }
            # Or you can use other logic to decide, like most common value, etc.
                
                # Add the final sync result with the trace status
                $finalTrace = ($traceStatuses | Where-Object { $_ -ne " " }) -join '; '
                $finalWarnings = if ($Warnings.Count -gt 0) { 
                    $Warnings -join ";"
                } else { 
                    " "
                }
                $finalScriptError = if ($ScriptErrors.Count -gt 0) { 
                    ($ScriptErrors | Select-Object -Unique) -join ";"
                } else { 
                    " "
                }
                Add-ResultAndUpload -syncResults ([ref]$syncResults) `
                                    -RTM_ID $RTM_ID `
                                    -ALMReqID $ALMReqID `
                                    -synctype $synctype `
                                    -Result $Result `
                                    -Schema $Schema `
                                    -Name $Name `
                                    -RequirementType $RequirementType `
                                    -Status $Status `
                                    -OTITProject $OTITProject `
                                    -parentRTMID $parentRTMID `
                                    -TraceStatus $finalTrace `
                                    -Warnings $finalWarnings `
                                    -ScriptErrors $finalScriptError `
                                    -PlannedRelease $PlannedRelease

            }
        }
        elseif ($almResult.Count -gt 1) {
            $ReqIDs = @()  # Initialize an empty array to store requirement IDs
            foreach ($result in $almResult) {
                $ReqID = ($result.Fields | Where-Object { $_.Name -eq 'id' }).values[0].value
                $ReqIDs += $ReqID  # Append each requirement ID to the array
            }
            if ($ReqIDs -contains $ALMReqID) {
                $ReqID=$ALMReqID
				$Plaanrelurl= "https://$almHost/qcbin/rest/domains/$almDomain/projects/$almProject/requirements/$ReqID"
                try {
                    $planres = Invoke-RestMethod -Method Get -Uri $Plaanrelurl -Headers @{ Accept = 'application/json'} -WebSession $webSession -UseBasicParsing
                    # $almResult = $planres.entities
                    foreach ($entity in $planres) {
                        $planRel = $entity.Fields | Where-Object { $_.Name -eq 'user-template-06' }
                        $ALMPtcValidation = $entity.Fields | Where-Object { $_.Name -eq 'user-template-04' }
                        $ALMPtcValidationValue=$ALMPtcValidation.values[0].value
                        $AlmName=$entity.Fields | Where-Object { $_.Name -eq 'name' }
                        $AlmNameValue=$AlmName.values[0].value  
                        $AlmSts=$entity.Fields | Where-Object { $_.Name -eq 'user-25' }
                        $AlmStatus=$AlmSts.values[0].value
                        
                        if($Status -eq "Cancelled" -or $AlmStatus -eq "5-Obsolete"){
                            $Warnings+="Warning: Either parent and/or child in a completed trace is in status 5-Obsolete."
                        }                                                
                        # Assuming NewPTCValidationMethod is already defined
                        if ($ALMPtcValidationValue -eq $NewPTCValidationMethod) {
                            # Your code here for when the values are equal
                            $NewPTCValidationMethod=$NewPTCValidationMethod
                        } else {
                            # Your code here for when the values are not equal
                            $NewPTCValidationMethod=$ALMPtcValidationValue
                            $Warnings += "Warning: JIRA/ALM PTC Validation Method mismatch. ALM value = $NewPTCValidationMethod overrides JIRA value."
                            
                        }
                        # Find and update the 'user-template-07' field in the Fields array
                        $fieldPTC = $RequirementPayload.Fields | Where-Object { $_.name -eq 'user-template-04' }
        
                        if ($fieldPTC) {
                            $fieldPTC.values[0].value = $NewPTCValidationMethod
                        } else {
                            # Write-Host "'user-template-07' field not found!"
                        }   
                        
                        #UPDATE NAME CRITERIA
                        if ($AlmNameValue.Contains($JiraParentChild) -and $ProcessedNameOld -ne $AlmNameValue) {
                            $Warnings +="Warning: JIRA Name changed. Name change done before updating other fields, to prevent duplicate record creation."
                            $synctype="UPDATE NAME"
                        }                        

                        if ($planRel) {
                            # Initialize an empty array to store all values
                            $planRelValues = @()
                    
                            # Iterate through each value in planRel.values and extract 'value' property
                            foreach ($valueObject in $planRel.values) {
                                $planRelValues += $valueObject.value
                            }
                    
                            # Join all the values into a string separated by semicolons
                            $planRelString = $planRelValues -join ';'
                            # Check if $PlannedRelease is not already in the string
                            if ($PlannedRelease -and ($planRelString -notlike "*$PlannedRelease*")) {
                                # Append $PlannedRelease at the end with a semicolon
                                $planRelString = "$planRelString;$PlannedRelease"
                            }
                    
                            #Write-Host $planRelString
                        }
                        
                    }
                    
                } catch {
                    Add-ScriptError -ScriptErrorsRef $ScriptErrorsRef -exception $_.Exception
                    
                    $finalScriptError = if ($ScriptErrors.Count -gt 0) { 
                        ($ScriptErrors | Select-Object -Unique) -join ";"
                    } else { 
                        " "
                    }
                    $TraceStatus=$null
                    $finalWarnings = if ($Warnings.Count -gt 0) { 
                        $Warnings -join ";"
                    } else { 
                        " "
                    }
                    $synctype='BLOCK UPDATE'
                    $Result="Can not get the requirement in ALM"
                    Add-ResultAndUpload -syncResults ([ref]$syncResults) `
                                                -RTM_ID $RTM_ID `
                                                -ALMReqID $ALMReqID `
                                                -synctype $synctype `
                                                -Result $Result `
                                                -Schema $Schema `
                                                -Name $Name `
                                                -RequirementType $RequirementType `
                                                -Status $Status `
                                                -OTITProject $OTITProject `
                                                -parentRTMID $parentRTMID `
                                                -TraceStatus $TraceStatus `
                                                -Warnings $Warnings `
                                                -ScriptErrors $finalScriptError `
                                                -PlannedRelease $PlannedRelease
                    continue
                }
                
                if ($RequirementType -ne 'Feature' ) {
                    $RequirementPayload.Fields += @{
                        Name = 'user-template-06'
                        values = @(
                            @{
                                value = $planRelString
                            }
                        )
                    }
                } 

				if ($almProject -eq "A956001_PTC_Program_000000") {
                    # Remove 'parent-id' from the Fields array if it exists
                    $RequirementPayload.Fields = $RequirementPayload.Fields | Where-Object { $_.Name -ne 'parent-id' }
                }
            
                $newRequirementPayload= $RequirementPayload | ConvertTo-Json -Depth 100
                $updateRequirementUrl= "https://$almHost/qcbin/rest/domains/$almDomain/projects/$almProject/requirements/$ReqID"

                try {
                    $updateRequirementResponse = Invoke-WebRequest -Method Put -Uri $updateRequirementUrl -Headers $headers -Body $newRequirementPayload -WebSession $webSession -UseBasicParsing
                    #Write-Host "Requirement  $RTM_ID has been successfully updated."
                    #Write-Host $updateRequirementResponse.StatusCode
							# $synctype='WARNING UPDATE'
                    if ([string]::IsNullOrEmpty($synctype)) {
                        $synctype = 'WARNING UPDATE'
                        
                    }
                    $Result='Requirement updated successfully - But multiple requirements available in ALM '
                    $Warnings+="Warning: Multiple RTM ID Already exists in ALM"

                } catch {
                    Add-ScriptError -ScriptErrorsRef $ScriptErrorsRef -exception $_.Exception
                    $synctype='BLOCK UPDATE'
                    $Result='Requirement is not Updated'
    
                    $TraceStatus=' '
                    $finalWarnings = if ($Warnings.Count -gt 0) { 
                        $Warnings -join ";"
                    } else { 
                        " "
                    }
                    $finalScriptError = if ($ScriptErrors.Count -gt 0) { 
                        ($ScriptErrors | Select-Object -Unique) -join ";"
                    } else { 
                        " "
                    }
                    Add-ResultAndUpload -syncResults ([ref]$syncResults) `
                                                -RTM_ID $RTM_ID `
                                                -ALMReqID $ALMReqID `
                                                -synctype $synctype `
                                                -Result $Result `
                                                -Schema $Schema `
                                                -Name $Name `
                                                -RequirementType $RequirementType `
                                                -Status $Status `
                                                -OTITProject $OTITProject `
                                                -parentRTMID $parentRTMID `
                                                -TraceStatus $TraceStatus `
                                                -Warnings $finalWarnings `
                                                -ScriptErrors $finalScriptError `
                                                -PlannedRelease $PlannedRelease
                    continue
                }

                # Initialize an array to store the trace IDs
                $traceIDsToDelete = @()

                # Fetch the requirement traces by the 'to-req-id'
                $traceQueryUrl = "https://$almHost/qcbin/rest/domains/$almDomain/projects/$almProject/req-traces?query={to-req-id[$ALMReqID]}"

                # Make the GET request to fetch existing traces
                try {
                    $traceResponse = Invoke-RestMethod -Method Get -Uri $traceQueryUrl -Headers $headers -WebSession $webSession -UseBasicParsing
                    # Extract the trace IDs from the response and store them in the array
                    if ($traceResponse.entities) {
                        foreach ($trace in $traceResponse.entities) {
                            $traceID = $trace.Fields | Where-Object { $_.Name -eq "id" } | Select-Object -ExpandProperty values | Select-Object -ExpandProperty value
                            $traceIDsToDelete += $traceID
                        }
                    }
                } catch {
                    Add-ScriptError -ScriptErrorsRef $ScriptErrorsRef -exception $_.Exception
                    # Write-Host "Failed to retrieve trace information: $_"
                }
                if ($null -eq $parentRTMID -or $parentRTMID -eq 'Null' -or $parentRTMID -eq ''){
                    if ($RequirementType -like "*L1*" -or $RequirementType -like "*L2*"){
                        $synctype='ORPHAN TRACE'
                        $Warnings+="Warning: requirement is orphan."
                    }
                    # Check if there are trace IDs to delete
                    if ($traceIDsToDelete.Count -gt 0) {
                        # Loop through each trace ID and send a DELETE request
                        foreach ($traceID in $traceIDsToDelete) {
                            $deleteUrl = "https://$almHost/qcbin/rest/domains/$almDomain/projects/$almProject/req-traces/$traceID"
                            try {
                                # Make the DELETE request to delete the trace
                                Invoke-RestMethod -Method Delete -Uri $deleteUrl -Headers $headers -WebSession $webSession -UseBasicParsing | Out-Null
                                
                                # Write-Host "Successfully deleted trace ID $traceID"
                            } catch {
                                Add-ScriptError -ScriptErrorsRef $ScriptErrorsRef -exception $_.Exception
                                # Write-Host "Failed to delete trace ID $traceID : $_"
                            }
                        }
                    } else {
                        # Write-Host "No existing traces found to delete."
                    }
                } else {
                    if ($traceIDsToDelete.Count -gt 0) {
                        # Loop through each trace ID and send a DELETE request
                        foreach ($traceID in $traceIDsToDelete) {
                            $deleteUrl = "https://$almHost/qcbin/rest/domains/$almDomain/projects/$almProject/req-traces/$traceID"
                            try {
                                # Make the DELETE request to delete the trace
                                Invoke-RestMethod -Method Delete -Uri $deleteUrl -Headers $headers -WebSession $webSession -UseBasicParsing | Out-Null
                                # Write-Host "Successfully deleted trace ID $traceID"
                            } catch {
                                Add-ScriptError -ScriptErrorsRef $ScriptErrorsRef -exception $_.Exception
                                # Write-Host "Failed to delete trace ID $traceID : $_"
                            }
                        }
                    } else {
                        # Write-Host "No existing traces found to delete."
                    }
                }
                                

                # Initialize an array to store trace statuses for all iterations
                $traceStatuses = @()


                    # Loop through each ParentALMReqID
                foreach ($ParentALMReqID in $AllParentALMReqIDs) {
                    # Only proceed if ParentALMReqID is not null or empty
                    if (-not [string]::IsNullOrEmpty($ParentALMReqID)) {
                        $RequirementTraceUrl = "https://$almHost/qcbin/rest/domains/$almDomain/projects/$almProject/req-traces"
                        
                        # Build the traceability body for each parent
                        $traceabilityBody = @{
                            Fields = @(
                                @{
                                    Name = "owner"
                                    values = @(
                                        @{
                                            value = $almUsername
                                        }
                                    )
                                },
                                @{
                                    Name = "to-req-id"
                                    values = @(
                                        @{
                                            value = $ALMReqID
                                        }
                                    )
                                },
                                @{
                                    Name = "from-req-id"
                                    values = @(
                                        @{
                                            value = $ParentALMReqID
                                        }
                                    )
                                },
                                @{
                                    Name = "comment"
                                    values = @(
                                        @{ }
                                    )
                                }
                            )
                            Type = "req-trace"
                        }

                        # Convert the PowerShell object to a JSON string
                        $TraceabilityjsonBody = $traceabilityBody | ConvertTo-Json -Depth 5

                        try {
                            # Make the API request to create the traceability record
                            $TraceResponse = Invoke-RestMethod -Method Post -Uri $RequirementTraceUrl -Headers $headers -Body $TraceabilityjsonBody -WebSession $webSession -UseBasicParsing
                            # Store trace status for this iteration
                            $traceStatuses += 'Yes'  # If traceability is successful
                        } catch {
                            # Handle errors (like duplicate traces)
                            Add-ScriptError -ScriptErrorsRef $ScriptErrorsRef -exception $_.Exception
                            # $ScriptErrors | ForEach-Object { Write-Host $_ }
                            if ($ScriptErrors[-1] -like "*These requirements are already traced*") {
                                $traceStatuses += " "  # If the condition matches, append a space
                            } else {
                                $traceStatuses+= "No"  # For other errors, append "No"
                            }
                        }
                    } else {
                        # If ParentALMReqID is empty or null, store the status accordingly
                        $traceStatuses += ' '
                    }
                }
                    # Or you can use other logic to decide, like most common value, etc.
                
                # Add the final sync result with the trace status
                $finalTrace = ($traceStatuses | Where-Object { $_ -ne " " }) -join '; '
                $finalWarnings = if ($Warnings.Count -gt 0) { 
                    $Warnings -join ";"
                } else { 
                    " "
                }
                $finalScriptError = if ($ScriptErrors.Count -gt 0) { 
                    ($ScriptErrors | Select-Object -Unique) -join ";"
                } else { 
                    " "
                }
                Add-ResultAndUpload -syncResults ([ref]$syncResults) `
                                    -RTM_ID $RTM_ID `
                                    -ALMReqID $ALMReqID `
                                    -synctype $synctype `
                                    -Result $Result `
                                    -Schema $Schema `
                                    -Name $Name `
                                    -RequirementType $RequirementType `
                                    -Status $Status `
                                    -OTITProject $OTITProject `
                                    -parentRTMID $parentRTMID `
                                    -TraceStatus $finalTrace `
                                    -Warnings $finalWarnings `
                                    -ScriptErrors $finalScriptError `
                                    -PlannedRelease $PlannedRelease


            }else{
                #Write-Host "ALM Requirement id $ALMReqID not matching with any of the requirements in ALM.so blocked update for $RTM_ID. BLOCK UPDATE"
				$synctype='BLOCK UPDATE'
				$Result='Multiple requirements available in ALM but no matching requirement'
                $Warnings+="Error: JIRA ISSUE KEY/ALM Requirement ID mismatch with ALM RTM ID/REQ_ID"

				$TraceStatus='No'
                $finalWarnings = if ($Warnings.Count -gt 0) { 
                    $Warnings -join ";"
                } else { 
                    " "
                }
                $finalScriptError = if ($ScriptErrors.Count -gt 0) { 
                    ($ScriptErrors | Select-Object -Unique) -join ";"
                } else { 
                    " "
                }
                # Scenario 1
                Add-ResultAndUpload -syncResults ([ref]$syncResults) `
                                    -RTM_ID $RTM_ID `
                                    -ALMReqID $ALMReqID `
                                    -synctype $synctype `
                                    -Result $Result `
                                    -Schema $Schema `
                                    -Name $Name `
                                    -RequirementType $RequirementType `
                                    -Status $Status `
                                    -OTITProject $OTITProject `
                                    -parentRTMID $parentRTMID `
                                    -TraceStatus $TraceStatus `
                                    -Warnings $finalWarnings `
                                    -ScriptErrors $finalScriptError `
                                    -PlannedRelease $PlannedRelease
			
                continue
            }
        }
    }else{

        $synctype="BLOCK UNKNOWN"
        $Result="No Action Taken"
        $Warnings+="Error: JIRA- ALM Requirement ID=$ALMReqID is not a valid number "
        $finalTrace = ($traceStatuses | Where-Object { $_ -ne " " }) -join '; '
        $finalWarnings = if ($Warnings.Count -gt 0) { 
            $Warnings -join ";"
        } else { 
            " "
        }
        $finalScriptError=$null
        Add-ResultAndUpload -syncResults ([ref]$syncResults) `
                                    -RTM_ID $RTM_ID `
                                    -ALMReqID $ALMReqID `
                                    -synctype $synctype `
                                    -Result $Result `
                                    -Schema $Schema `
                                    -Name $Name `
                                    -RequirementType $RequirementType `
                                    -Status $Status `
                                    -OTITProject $OTITProject `
                                    -parentRTMID $parentRTMID `
                                    -TraceStatus $finalTrace `
                                    -Warnings $finalWarnings `
                                    -ScriptErrors $finalScriptError `
                                    -PlannedRelease $PlannedRelease



    }
}



# Capture the end time
$endTime = Get-Date

# Calculate the duration by subtracting start time from end time
$duration = $endTime - $startTime

# Convert the duration to a human-readable format (hours, minutes, seconds)
$durationFormatted = "{0}h {1}m {2}s {3}ms" -f $duration.Hours, $duration.Minutes, $duration.Seconds, $duration.Milliseconds
$updateCount = 0
$createCount = 0
$jiraUpdateCount = 0

# Define sync types for each category
$updateTypes = @(
    "UPDATE", "BLOCK CREATE", "BLOCK UPDATE",
    "WARNING UPDATE", "UPDATE NAME", "ORPHAN TRACE",
    "BLOCK UNKNOWN", "UPDATE PARENT TRACE"
)
$createTypes = @("CREATE")
$jiraUpdateTypes = @("JIRA UPDATE")
# Count logic
foreach ($result in $syncResults) {
    $syncType = $result."Sync Type"

    if ($updateTypes -contains $syncType) {
        $updateCount++
    } elseif ($createTypes -contains $syncType) {
        $createCount++
    } elseif ($jiraUpdateTypes -contains $syncType) {
        $jiraUpdateCount++
    }
}

# Initialize count and list
$plannedReleaseCount = 0
$plannedReleaseRTMIDs = @()

# Define applicable requirement types
$validRequirementTypes = @('L2 Requirement', 'L1 Business Requirement')

# Define applicable sync types
$validSyncTypes = @(
    'CREATE', 'UPDATE', 'JIRA UPDATE',
    'WARNING UPDATE', 'UPDATE NAME',
    'ORPHAN TRACE', 'UPDATE PARENT TRACE'
)

# Count logic
foreach ($result in $syncResults) {
    $requirementType = $result.RequirementType
    $syncType = $result.'Sync Type'
    $plannedRelease = $result.PlannedRelease

    if ($validRequirementTypes -contains $requirementType -and
        $validSyncTypes -contains $syncType -and
        $plannedRelease -eq 'TBD') {

        $plannedReleaseCount++
        $plannedReleaseRTMIDs += $result.RTM_ID
    }
}

# Create semicolon-separated string of RTM_IDs
$plannedReleaseRTMString = $plannedReleaseRTMIDs -join ';'

# Build output
$output = @{
    Duration = $durationFormatted
    Success = $true
    EndDateTime = $endTime.ToString('yyyy-MM-dd HH:mm:ss.fff')
    StartDateTime = $startTime.ToString('yyyy-MM-dd HH:mm:ss.fff')
    Results = @{
        UpdateCount = $updateCount
        CreateCount = $createCount
        JiraUpdateCount = $jiraUpdateCount
        EmptyPlannedReleaseCount = $plannedReleaseCount
        EmptyPlannedReleaseRequirements = $plannedReleaseRTMString
    }
}

# Convert to JSON and output
$output | ConvertTo-Json -Depth 10