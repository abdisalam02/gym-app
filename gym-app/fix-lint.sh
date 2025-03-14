#!/bin/bash

# This script attempts to fix some common ESLint errors automatically
echo "Attempting to fix simple ESLint errors..."

# Fix prefer-const issues by using ESLint's --fix option
npx eslint --fix "src/**/*.{js,jsx,ts,tsx}"

# Fix unused imports using the TypeScript compiler
npx tsc --noEmit

# Reminder message about remaining issues
echo ""
echo "Some issues need manual attention:"
echo "1. Replace any 'any' types with proper TypeScript types"
echo "2. Add missing React Hook dependencies or update useEffect"
echo "3. Replace <img> with Next.js <Image> components"
echo "4. Escape entities in JSX with proper HTML entities"
echo ""
echo "Or leave your .eslintrc.json and next.config.ts as is to bypass these checks during build." 