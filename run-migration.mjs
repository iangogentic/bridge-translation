import { spawn } from 'child_process';
import * as readline from 'readline';

console.log('Starting database migration...\n');

const migration = spawn('npm', ['run', 'db:push'], {
  cwd: process.cwd(),
  shell: true,
  stdio: ['pipe', 'pipe', 'pipe']
});

let output = '';

migration.stdout.on('data', (data) => {
  const text = data.toString();
  output += text;
  process.stdout.write(text);

  // Auto-respond to the unique constraint prompt
  if (text.includes('Do you want to truncate users table?')) {
    console.log('\n[Auto-responding: No - adding constraint without truncating]');
    migration.stdin.write('\n'); // Select "No" (default option)
  }
});

migration.stderr.on('data', (data) => {
  const text = data.toString();
  output += text;
  process.stderr.write(text);
});

migration.on('close', (code) => {
  console.log(`\n\nMigration process exited with code ${code}`);

  if (code === 0) {
    console.log('✅ Migration completed successfully!');
  } else {
    console.log('❌ Migration failed');
  }

  process.exit(code);
});

// Handle process termination
process.on('SIGINT', () => {
  migration.kill();
  process.exit(1);
});
