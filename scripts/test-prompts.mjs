import fs from 'fs';
import path from 'path';

// Load .env.local
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf-8');
  content.split('\n').forEach((line) => {
    const idx = line.indexOf('=');
    if (idx !== -1) {
      const k = line.slice(0, idx).trim();
      const v = line.slice(idx + 1).trim();
      if (k && !process.env[k]) process.env[k] = v;
    }
  });
}

const { getAIProvider } = await import('../src/lib/ai-provider.ts');

const provider = getAIProvider();
console.log('Provider initialized:', provider.name);
console.log('Is Configured:', provider.isConfigured);
console.log('Model env:', process.env.GEMINI_MODEL);

const testEvent = {
  id: 'test-event-thiru',
  name: 'thiru marriage',
  type: 'wedding',
  date: '2027-11-20',
  guestCount: 100,
  budget: 9097,
  currency: 'INR',
  location: 'Chennai',
  status: 'planning',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const prompts = [
  'I have limited money for food. What should I do?',
  'How can I reduce my wedding budget by 10% without hurting the guest experience?',
  'Create a realistic preparation timeline for my event.',
  'Suggest affordable food and catering options for 120 guests.',
  'What tasks should I complete this week?',
];

console.log('\n--- STARTING 5 REQUIRED PROMPT VERIFICATIONS ---');
for (const p of prompts) {
  const start = Date.now();
  try {
    const reply = await provider.chat(testEvent, p, []);
    const dur = Date.now() - start;
    const isFallback = reply.includes('Live Gemini Notice') || reply.includes('Demo Mode');
    console.log(`\n[PROMPT]: "${p}"`);
    console.log(`[STATUS]: SUCCESS (${dur}ms) | Provider mode: ${isFallback ? 'Fallback/Knowledge Engine' : 'Live Gemini'}`);
    console.log(`[RESPONSE PREVIEW]:\n${reply.slice(0, 220)}...`);
  } catch (err) {
    console.error(`\n[PROMPT]: "${p}" FAILED (${Date.now() - start}ms):`, err.message);
  }
}
console.log('\n--- PROMPT VERIFICATION COMPLETE ---');
