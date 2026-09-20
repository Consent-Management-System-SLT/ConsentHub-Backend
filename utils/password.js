'use strict';

/**
 * Password and security-answer hashing.
 *
 * Credentials were previously stored as plain text and compared with `!==`.
 * This uses scrypt from Node's own crypto module: a memory-hard KDF, so no new
 * dependency and no native build step.
 *
 * Stored format:  scrypt$<N>$<saltHex>$<keyHex>
 * The parameters travel with the hash, so they can be raised later without
 * invalidating credentials already stored.
 */

const crypto = require('crypto');
const { promisify } = require('util');

const scrypt = promisify(crypto.scrypt);

const N = 16384; // CPU/memory cost
const KEYLEN = 64;
const SALT_BYTES = 16;
const PREFIX = 'scrypt';

/** True when `stored` is one of our hashes rather than a legacy plaintext value. */
function isHashed(stored) {
  return typeof stored === 'string' && stored.startsWith(`${PREFIX}$`);
}

async function hash(plain) {
  if (typeof plain !== 'string' || plain.length === 0) {
    throw new Error('Cannot hash an empty value');
  }
  const salt = crypto.randomBytes(SALT_BYTES);
  const key = await scrypt(plain, salt, KEYLEN, { N });
  return [PREFIX, N, salt.toString('hex'), key.toString('hex')].join('$');
}

/**
 * Compare a supplied value against a stored one.
 *
 * Returns { ok, legacy }. `legacy` is true when the stored value was plain text,
 * which tells the caller to re-save so the hook can hash it.
 */
async function verify(plain, stored) {
  if (typeof plain !== 'string' || typeof stored !== 'string' || !stored) {
    return { ok: false, legacy: false };
  }

  if (!isHashed(stored)) {
    // Legacy plaintext row. Constant-time compare so this path leaks no more
    // than the hashed one does.
    const a = Buffer.from(plain);
    const b = Buffer.from(stored);
    const ok = a.length === b.length && crypto.timingSafeEqual(a, b);
    return { ok, legacy: ok };
  }

  const [, nStr, saltHex, keyHex] = stored.split('$');
  const cost = Number(nStr);
  if (!Number.isFinite(cost) || !saltHex || !keyHex) return { ok: false, legacy: false };

  const key = await scrypt(plain, Buffer.from(saltHex, 'hex'), keyHex.length / 2, { N: cost });
  const expected = Buffer.from(keyHex, 'hex');
  const ok = key.length === expected.length && crypto.timingSafeEqual(key, expected);
  return { ok, legacy: false };
}

/** Answers are compared case- and whitespace-insensitively; people do not retype them exactly. */
const normaliseAnswer = (answer) => String(answer || '').trim().toLowerCase().replace(/\s+/g, ' ');

module.exports = { hash, verify, isHashed, normaliseAnswer };
