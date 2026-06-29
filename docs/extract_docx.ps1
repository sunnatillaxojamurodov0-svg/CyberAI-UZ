$word = New-Object -ComObject Word.Application
$word.Visible = $false

# Extract Report 1
$doc1 = $word.Documents.Open('D:\cyberaiuz\docs\CyberAI-UZ_Professional_Website_Audit_Report.docx')
$text1 = $doc1.Content.Text
$doc1.Close($false)
$text1 | Out-File -FilePath 'D:\cyberaiuz\docs\audit_report_1.txt' -Encoding UTF8
Write-Host "Report 1 extracted"

# Extract Report 2
$doc2 = $word.Documents.Open('D:\cyberaiuz\docs\CyberAI_UZ_Audit_Report_2026.docx')
$text2 = $doc2.Content.Text
$doc2.Close($false)
$text2 | Out-File -FilePath 'D:\cyberaiuz\docs\audit_report_2.txt' -Encoding UTF8
Write-Host "Report 2 extracted"

$word.Quit()
Write-Host "Done"
