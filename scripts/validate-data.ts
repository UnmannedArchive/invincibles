import { PLAYERS, POOL_KEYS } from '../lib/data';
import { validatePlayers } from '../lib/validate';

const errors = validatePlayers(PLAYERS);
console.log(`${PLAYERS.length} players, ${POOL_KEYS.length} pools`);
if (errors.length) {
  for (const e of errors) console.error(`  ✗ ${e}`);
  process.exit(1);
}
console.log('dataset valid ✓');
