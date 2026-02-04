#!/bin/bash
# Run Lingxing → Google Sheets sync locally
# Usage: ./run-sync.sh [daily|monthly|both]

cd "$(dirname "$0")"

export LINGXING_APP_ID="ak_fK9KCx7hPyvEg"
export LINGXING_APP_SECRET="xXxCNnqfdn8nB8cxIzHG4w=="
export GOOGLE_SHEETS_ID="1qLZUGYRGOWnZyEL_75pe5NE8hDyTRA_27ziw2-vr374"
export GOOGLE_SERVICE_ACCOUNT_KEY="$(cat /Users/kaaba/Downloads/pnl-dashboard-486409-284960fb2a10.json)"

MODE=${1:-daily}
echo "Running $MODE sync..."
node sync-to-sheets.js $MODE
