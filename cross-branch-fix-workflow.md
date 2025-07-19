# Cross-Branch Fix Workflow for OGZ Prime

## Current Status
✅ Fixed pattern recognition on `massacre` branch (commit: 08dad2a)

## Multi-Branch Deployment Strategy

### Method 1: Cherry-Pick to Other Branches (Recommended)

```bash
# 1. Switch to main branch
git checkout main

# 2. Cherry-pick the fix commit from massacre
git cherry-pick 08dad2a

# 3. Switch to quantum branch  
git checkout quantum

# 4. Cherry-pick the fix commit from massacre
git cherry-pick 08dad2a

# 5. Return to massacre branch
git checkout massacre
```

### Method 2: Merge Workflow (For larger changes)

```bash
# 1. Switch to main branch
git checkout main

# 2. Merge the specific file from massacre
git checkout massacre -- core/EnhancedPatternRecognition.js
git add core/EnhancedPatternRecognition.js
git commit -m "Merge pattern recognition fix from massacre"

# 3. Repeat for quantum branch
git checkout quantum
git checkout massacre -- core/EnhancedPatternRecognition.js
git add core/EnhancedPatternRecognition.js
git commit -m "Merge pattern recognition fix from massacre"

# 4. Return to massacre
git checkout massacre
```

### Method 3: Pull Request/Merge Request (For team review)

```bash
# 1. Push current branch
git push origin massacre

# 2. Create pull requests:
#    massacre → main
#    massacre → quantum

# 3. Review and merge via Git UI
```

## Files That Should Be Synced Across All Branches

### Core Trading Logic (Always sync)
- `core/EnhancedPatternRecognition.js` ✅ (just fixed)
- `core/WebsocketManager.js`
- `core/OptimizedIndicators.js`
- `core/RiskManager.js`
- `api/live-trading-data.js`

### Security Fixes (Always sync)
- `core/SSLBypass.js`
- Any authentication files
- Environment configuration

### Bug Fixes (Usually sync)
- WebSocket connection fixes
- Pattern recognition fixes
- Performance optimizations

### Branch-Specific Files (Don't sync)
- `run-trading-bot-v13-quantum.js` (quantum only)
- Quantum-specific modules in `core/modules/`
- Branch-specific profiles

## Automation Script (Future Enhancement)

```bash
#!/bin/bash
# sync-fix.sh - Sync specific commits across branches

COMMIT_HASH=$1
TARGET_BRANCHES=("main" "quantum")
CURRENT_BRANCH=$(git branch --show-current)

for branch in "${TARGET_BRANCHES[@]}"; do
    echo "Syncing to $branch..."
    git checkout $branch
    git cherry-pick $COMMIT_HASH
done

git checkout $CURRENT_BRANCH
echo "Sync complete!"
```

## Next Steps

1. **Execute Method 1** to sync the pattern fix to main and quantum
2. **Test on each branch** to ensure compatibility
3. **Push all branches** to remote repository
4. **Update branch-specific documentation** if needed

## Validation Commands

```bash
# Check which branches have the fix
git log --oneline --all --grep="pattern recognition"

# Verify file differences across branches
git diff main:core/EnhancedPatternRecognition.js quantum:core/EnhancedPatternRecognition.js
```

## Branch Management Best Practices

1. **Always commit fixes to your current working branch first**
2. **Use cherry-pick for surgical fixes** (like this pattern fix)
3. **Use merge for larger feature integration**
4. **Test each branch after syncing**
5. **Document which files need cross-branch syncing**
6. **Consider automation for frequent cross-branch fixes**

---

**Current Task**: Execute Method 1 to sync pattern recognition fix to main and quantum branches.
