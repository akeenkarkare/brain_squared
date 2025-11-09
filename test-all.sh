#!/bin/bash

echo "========================================="
echo "Brain² Comprehensive Test Suite"
echo "========================================="
echo ""

PASS_COUNT=0
FAIL_COUNT=0

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test function
test_endpoint() {
    local test_name="$1"
    local url="$2"
    local expected_status="$3"
    local description="$4"

    echo -n "Testing: $test_name... "

    response=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>&1)

    if [ "$response" == "$expected_status" ]; then
        echo -e "${GREEN}✓ PASS${NC} ($description)"
        ((PASS_COUNT++))
        return 0
    else
        echo -e "${RED}✗ FAIL${NC} (Expected $expected_status, got $response)"
        ((FAIL_COUNT++))
        return 1
    fi
}

echo "Test Run 1/5"
echo "-------------"

# Backend Tests
test_endpoint "Backend Health" "http://localhost:3001/api/health" "200" "Backend is running"
test_endpoint "Backend Stats (no auth)" "http://localhost:3001/api/history/stats" "401" "Auth required"

# Web App Tests
test_endpoint "Homepage" "http://localhost:3000/" "200" "Next.js app running"
test_endpoint "Login Route" "http://localhost:3000/auth/login" "307" "Redirects to Auth0"
test_endpoint "Logout Route" "http://localhost:3000/api/auth/logout" "307" "Redirects to Auth0 logout"
test_endpoint "Extension Download" "http://localhost:3000/api/download-extension" "200" "Zip file available"

echo ""
echo "Test Run 2/5"
echo "-------------"

# Repeat tests
test_endpoint "Backend Health" "http://localhost:3001/api/health" "200" "Backend stable"
test_endpoint "Homepage" "http://localhost:3000/" "200" "Web app stable"
test_endpoint "Extension Download" "http://localhost:3000/api/download-extension" "200" "Download stable"

echo ""
echo "Test Run 3/5"
echo "-------------"

# Repeat tests
test_endpoint "Backend Health" "http://localhost:3001/api/health" "200" "Backend stable"
test_endpoint "Homepage" "http://localhost:3000/" "200" "Web app stable"
test_endpoint "Login Route" "http://localhost:3000/auth/login" "307" "Login stable"

echo ""
echo "Test Run 4/5"
echo "-------------"

# Repeat tests
test_endpoint "Backend Health" "http://localhost:3001/api/health" "200" "Backend stable"
test_endpoint "Homepage" "http://localhost:3000/" "200" "Web app stable"
test_endpoint "Logout Route" "http://localhost:3000/api/auth/logout" "307" "Logout stable"

echo ""
echo "Test Run 5/5"
echo "-------------"

# Final round
test_endpoint "Backend Health" "http://localhost:3001/api/health" "200" "Backend stable"
test_endpoint "Homepage" "http://localhost:3000/" "200" "Web app stable"
test_endpoint "Extension Download" "http://localhost:3000/api/download-extension" "200" "Download stable"
test_endpoint "Backend Stats (no auth)" "http://localhost:3001/api/history/stats" "401" "Auth still required"

echo ""
echo "========================================="
echo "Test Summary"
echo "========================================="
echo -e "${GREEN}Passed: $PASS_COUNT${NC}"
echo -e "${RED}Failed: $FAIL_COUNT${NC}"
echo ""

# Check if extension zip exists and is valid
echo "File Checks:"
echo "-------------"
if [ -f "/Users/akeen/brain_squared/web/public/chrome_extension.zip" ]; then
    size=$(ls -lh /Users/akeen/brain_squared/web/public/chrome_extension.zip | awk '{print $5}')
    echo -e "${GREEN}✓${NC} Extension zip exists ($size)"

    # Check if it's a valid zip
    if unzip -t /Users/akeen/brain_squared/web/public/chrome_extension.zip > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} Extension zip is valid"
        file_count=$(unzip -l /Users/akeen/brain_squared/web/public/chrome_extension.zip | tail -1 | awk '{print $2}')
        echo -e "${GREEN}✓${NC} Extension contains $file_count files"
    else
        echo -e "${RED}✗${NC} Extension zip is corrupted"
    fi
else
    echo -e "${RED}✗${NC} Extension zip not found"
fi

echo ""

# Check critical files
echo "Code Checks:"
echo "-------------"
critical_files=(
    "/Users/akeen/brain_squared/web/app/auth/login/route.ts"
    "/Users/akeen/brain_squared/web/middleware.ts"
    "/Users/akeen/brain_squared/web/app/api/auth/logout/route.ts"
    "/Users/akeen/brain_squared/web/.env.local"
    "/Users/akeen/brain_squared/backend/.env"
)

for file in "${critical_files[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓${NC} $(basename $file) exists"
    else
        echo -e "${RED}✗${NC} $(basename $file) MISSING"
    fi
done

echo ""

# Check for AUTH0_AUDIENCE in .env.local
if grep -q "AUTH0_AUDIENCE='https://api.brainsquared.com'" /Users/akeen/brain_squared/web/.env.local 2>/dev/null; then
    echo -e "${GREEN}✓${NC} AUTH0_AUDIENCE configured correctly"
else
    echo -e "${RED}✗${NC} AUTH0_AUDIENCE missing or incorrect"
fi

echo ""
echo "========================================="
if [ $FAIL_COUNT -eq 0 ]; then
    echo -e "${GREEN}All tests passed! ✓${NC}"
    echo "Safe to push to VPS"
else
    echo -e "${RED}Some tests failed! Fix before pushing${NC}"
fi
echo "========================================="
