# =============================================
# Braxon Photo Modules Database Setup
# =============================================

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Braxon Photo Modules Setup" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Database credentials
$DB_HOST = "localhost"
$DB_PORT = "5432"
$DB_NAME = "braxon_db"
$DB_USER = "postgres"

# Prompt for password
Write-Host "Enter PostgreSQL password for user '$DB_USER': " -NoNewline -ForegroundColor Yellow
$DB_PASSWORD = Read-Host -AsSecureString
$DB_PASSWORD_PLAIN = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($DB_PASSWORD))

Write-Host ""
Write-Host "Step 1: Creating database schema..." -ForegroundColor Green

# Set PGPASSWORD environment variable
$env:PGPASSWORD = $DB_PASSWORD_PLAIN

# Execute schema file
$schemaResult = psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f "01-photo-modules-schema.sql" 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Schema created successfully!" -ForegroundColor Green
} else {
    Write-Host "❌ Schema creation failed!" -ForegroundColor Red
    Write-Host $schemaResult
    exit 1
}

Write-Host ""
Write-Host "Step 2: Inserting module data..." -ForegroundColor Green

# Execute data file
$dataResult = psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f "02-photo-modules-data.sql" 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Module data inserted successfully!" -ForegroundColor Green
} else {
    Write-Host "❌ Data insertion failed!" -ForegroundColor Red
    Write-Host $dataResult
    exit 1
}

Write-Host ""
Write-Host "Step 3: Adding project enhancements..." -ForegroundColor Green

# Execute enhancements file
$enhanceResult = psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f "03-project-enhancements.sql" 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Project enhancements added successfully!" -ForegroundColor Green
} else {
    Write-Host "❌ Enhancement failed!" -ForegroundColor Red
    Write-Host $enhanceResult
    exit 1
}

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "✅ Setup Complete!" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Summary:" -ForegroundColor Yellow
Write-Host "- 8 installation modules created"
Write-Host "- 100+ photo checklist items added"
Write-Host "- Daily report tables enhanced"
Write-Host "- Hours budget tracking enabled"
Write-Host ""

# Clear password from environment
$env:PGPASSWORD = ""

Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")