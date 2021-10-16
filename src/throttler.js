const delay = (ms) => new Promise((r) => setTimeout(r, ms));

const newThrottler = ({ predicate, lock, unlock, waitMs }) =>
  async function throttler(cb, ...args) {
    while (!!(await predicate())) {
      await delay((waitMs && waitMs()) || 100); // use event-loop as a callback queue!
    }
    await lock();
    const result = await cb.call(this, ...args);
    await unlock();
    return result;
  };

let _locks = 0;
const throttler = newThrottler({
  predicate: () => _locks > 1,
  lock: () => (_locks += 1),
  unlock: () => (_locks -= 1),
  waitMs: () => 1000 * Math.random(),
});

module.exports = throttler;
