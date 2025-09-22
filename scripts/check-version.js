#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Files that should have matching versions
const versionFiles = {
  'package.json': (content) => JSON.parse(content).version,
  'package-lock.json': (content) => JSON.parse(content).version,
};

// Files that reference the version but might need manual update
const referenceFiles = {
  'PROJECT_ANALYSIS.md': /Version:\s*(\d+\.\d+\.\d+)/,
  'README.md': /version\s+(\d+\.\d+\.\d+)/i,
  'CHANGELOG.md': /##\s+\[?(\d+\.\d+\.\d+)\]?/,
};

function checkVersions() {
  console.log('🔍 Checking version consistency...\n');
  
  // Get the primary version from package.json
  let primaryVersion;
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    primaryVersion = packageJson.version;
    console.log(`📦 Primary version (package.json): ${primaryVersion}`);
  } catch (error) {
    console.error('❌ Error reading package.json:', error.message);
    process.exit(1);
  }

  let hasErrors = false;
  let hasWarnings = false;

  // Check files that must match
  console.log('\n📋 Checking required version matches:');
  for (const [file, extractor] of Object.entries(versionFiles)) {
    if (file === 'package.json') continue; // Skip the primary source
    
    try {
      const content = fs.readFileSync(file, 'utf8');
      const version = extractor(content);
      
      if (version === primaryVersion) {
        console.log(`  ✅ ${file}: ${version}`);
      } else {
        console.error(`  ❌ ${file}: ${version} (should be ${primaryVersion})`);
        hasErrors = true;
        
        // Auto-fix package-lock.json
        if (file === 'package-lock.json') {
          console.log(`  🔧 Auto-fixing ${file}...`);
          const lockContent = JSON.parse(content);
          lockContent.version = primaryVersion;
          if (lockContent.packages && lockContent.packages['']) {
            lockContent.packages[''].version = primaryVersion;
          }
          fs.writeFileSync(file, JSON.stringify(lockContent, null, 2) + '\n');
          console.log(`  ✅ Fixed ${file}`);
          hasErrors = false; // Clear error since we fixed it
        }
      }
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.log(`  ⏭️  ${file}: File not found (skipping)`);
      } else {
        console.error(`  ❌ ${file}: Error - ${error.message}`);
        hasErrors = true;
      }
    }
  }

  // Check reference files (warnings only)
  console.log('\n📄 Checking version references:');
  for (const [file, regex] of Object.entries(referenceFiles)) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      const match = content.match(regex);
      
      if (match) {
        const version = match[1];
        if (version === primaryVersion) {
          console.log(`  ✅ ${file}: ${version}`);
        } else {
          console.log(`  ⚠️  ${file}: ${version} (consider updating to ${primaryVersion})`);
          hasWarnings = true;
        }
      } else {
        console.log(`  ℹ️  ${file}: No version found`);
      }
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.log(`  ⏭️  ${file}: File not found (skipping)`);
      } else {
        console.log(`  ⚠️  ${file}: Error - ${error.message}`);
      }
    }
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  if (hasErrors) {
    console.error('❌ Version check failed! Please fix the errors above.');
    process.exit(1);
  } else if (hasWarnings) {
    console.log('⚠️  Version check passed with warnings.');
    console.log('   Consider updating the version references mentioned above.');
    process.exit(0);
  } else {
    console.log('✅ All versions are consistent!');
    process.exit(0);
  }
}

// Run the check
checkVersions();
