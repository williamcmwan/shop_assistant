#!/bin/bash

# Script to commit and push code to GitHub
# Usage: ./scripts/commit-push.sh

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Git Commit & Push${NC}"
echo "================================"

# Check if there are changes to commit
if [[ -z $(git status -s) ]]; then
    echo -e "${RED}No changes to commit.${NC}"
    exit 0
fi

# Show current status
echo -e "\n${YELLOW}Current changes:${NC}"
git status -s

# Ask for commit message
echo -e "\n${YELLOW}Enter commit message:${NC}"
read -p "> " commit_message

# Validate commit message is not empty
if [[ -z "$commit_message" ]]; then
    echo -e "${RED}Commit message cannot be empty.${NC}"
    exit 1
fi

# Add all changes
echo -e "\n${YELLOW}Adding all changes...${NC}"
git add .

# Commit with the provided message
echo -e "${YELLOW}Committing changes...${NC}"
git commit -m "$commit_message

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"

# Push to remote
echo -e "\n${YELLOW}Pushing to remote...${NC}"
git push

echo -e "\n${GREEN}✓ Successfully committed and pushed!${NC}"
