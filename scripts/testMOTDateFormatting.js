// Test MOT date formatting
const motDue = '2026-10-31T00:00:00.000Z';

console.log('🔍 TESTING MOT DATE FORMATTING');
console.log('==============================');
console.log('Input:', motDue);

// Test the new logic
if (typeof motDue === 'string') {
  const date = new Date(motDue);
  if (!isNaN(date.getTime())) {
    const formatted = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    console.log('Formatted:', formatted);
  } else {
    console.log('Invalid date');
  }
}