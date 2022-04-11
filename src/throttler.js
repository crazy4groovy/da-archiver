const delay = (ms) => new Promise((r) => setTimeout(r, ms));

const newThrottler = ({ isBusy, doLock, doUnlock, waitMs }) =>
  async function throttler(cb, ...args) {
    while (isBusy()) {
      await delay((waitMs && waitMs()) || 100); // use event-loop as a callback queue!
    }
    doLock();
    const result = await cb.call(this, ...args);
    doUnlock();
    return result;
  };

const _lock = { count: 0, max: 1 };
const throttler = newThrottler({
  isBusy: () => _lock.count >= _lock.max,
  doLock: () => (_lock.count += 1),
  doUnlock: () => (_lock.count -= 1),
  waitMs: () => 1000 * Math.random(),
});

module.exports = (max) => {
  if (max != undefined && !Number.isNaN(max)) _lock.max = max;
  return throttler;
}
