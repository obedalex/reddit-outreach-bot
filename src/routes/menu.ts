import { Hono } from 'hono';
import { runGigCheck } from './scheduler';
import type { UiResponse } from '@devvit/web/shared';

export const menu = new Hono();

menu.post('/trigger-gigs', async (c) => {
  try {
    // Run the scheduler's check immediately in the background or block slightly
    await runGigCheck();
    return c.json<UiResponse>(
      {
        showToast: '🚀 Gig check completed successfully!',
      },
      200
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return c.json<UiResponse>(
      {
        showToast: '❌ Failed to trigger gig check: ' + message,
      },
      200
    );
  }
});
