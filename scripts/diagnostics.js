#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Diagnostic tool for identifying Next.js build issues
 */

console.log('🔍 Running Bachelor Party Dashboard diagnostics...\n');

// Check Node.js and npm versions
console.log('🔧 Environment:');
console.log('Node.js version:', process.version);
try {
  const npmVersion = execSync('npm --version').toString().trim();
  console.log('npm version:', npmVersion);
} catch (e) {
  console.log('Error checking npm version:', e.message);
}

// Check for problematic dependencies
console.log('\n📦 Checking dependencies...');
try {
  const packageJson = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8'));
  const allDeps = { 
    ...packageJson.dependencies || {}, 
    ...packageJson.devDependencies || {} 
  };
  
  // List of potentially problematic dependency combinations
  const problematicDeps = [
    { check: ['react', 'react-dom'], expected: { react: '18.2.0', 'react-dom': '18.2.0' } },
    { check: ['next', 'typescript'], problem: 'version mismatch' },
    { check: ['@supabase/supabase-js'], note: 'Requires appropriate environment variables' }
  ];
  
  problematicDeps.forEach(({ check, expected, problem, note }) => {
    const found = check.filter(dep => allDeps[dep]);
    if (found.length === check.length) {
      if (expected) {
        check.forEach(dep => {
          const version = allDeps[dep].replace('^', '').replace('~', '');
          if (expected[dep] && version !== expected[dep]) {
            console.log(`⚠️ Potential issue: ${dep} version (${allDeps[dep]}) differs from expected (${expected[dep]})`);
          }
        });
      }
      if (problem) {
        console.log(`⚠️ Potential issue with: ${check.join(', ')} - ${problem}`);
      }
      if (note) {
        console.log(`ℹ️ Note about ${check.join(', ')}: ${note}`);
      }
    }
  });
} catch (e) {
  console.log('Error checking dependencies:', e.message);
}

// Check for .env file and required variables
console.log('\n🔐 Checking environment variables...');
const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY'
];

let envFound = false;
try {
  const envFile = fs.readFileSync(path.join(process.cwd(), '.env'), 'utf8');
  envFound = true;
  
  requiredEnvVars.forEach(varName => {
    if (!envFile.includes(varName + '=')) {
      console.log(`❌ Missing required environment variable: ${varName}`);
    } else {
      console.log(`✅ Found environment variable: ${varName}`);
    }
  });
} catch (e) {
  console.log('❌ No .env file found');
}

// Check for potential build issues
console.log('\n🏗️ Checking for potential build issues...');

// Check next.config.js
try {
  const nextConfigContent = fs.readFileSync(path.join(process.cwd(), 'next.config.js'), 'utf8');
  if (!nextConfigContent.includes('ignoreBuildErrors: true')) {
    console.log('⚠️ TypeScript errors are not being ignored in next.config.js, which might cause build failures');
  } else {
    console.log('✅ TypeScript errors are being ignored in build');
  }
} catch (e) {
  console.log('❌ Could not read next.config.js');
}

// Check project structure
console.log('\n📁 Analyzing project structure...');
const directories = [
  'app',
  'app/components',
  'app/lib',
  'public'
];

directories.forEach(dir => {
  try {
    const stats = fs.statSync(path.join(process.cwd(), dir));
    if (stats.isDirectory()) {
      const files = fs.readdirSync(path.join(process.cwd(), dir));
      console.log(`✅ ${dir}: ${files.length} files`);
    }
  } catch (e) {
    console.log(`❌ Directory not found: ${dir}`);
  }
});

// Check for client-side components
console.log('\n🧩 Checking components...');
try {
  const files = findFilesRecursively('app', '.tsx');
  let clientComponentCount = 0;
  
  files.forEach(file => {
    try {
      const content = fs.readFileSync(file, 'utf8');
      if (content.includes("'use client'")) {
        clientComponentCount++;
        console.log(`ℹ️ Client component: ${file.replace(process.cwd(), '')}`);
      }
    } catch (e) {
      // Skip file reading errors
    }
  });
  
  console.log(`🔢 Found ${clientComponentCount} client components out of ${files.length} total .tsx files`);
} catch (e) {
  console.log('Error analyzing components:', e.message);
}

// Suggest next steps
console.log('\n🛠️ Suggested next steps:');
console.log('1. Run "npm run debug-build" to get detailed build logs');
console.log('2. Run "npm run analyze-build" to analyze bundle size and chunks');
console.log('3. Check for client/server component issues (\'use client\' directives)');
console.log('4. Try deploying with "npm run deploy:vercel" for detailed logs');

// Helper function to recursively find files
function findFilesRecursively(dir, extension) {
  const dirPath = path.join(process.cwd(), dir);
  let results = [];
  
  try {
    const list = fs.readdirSync(dirPath);
    list.forEach(file => {
      const filePath = path.join(dirPath, file);
      const stat = fs.statSync(filePath);
      
      if (stat && stat.isDirectory()) {
        results = results.concat(findFilesRecursively(filePath, extension));
      } else if (path.extname(file) === extension) {
        results.push(filePath);
      }
    });
  } catch (e) {
    // Skip directory reading errors
  }
  
  return results;
} 