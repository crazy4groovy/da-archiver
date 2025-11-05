const delay = (ms) => new Promise((r) => setTimeout(r, ms));

const newThrottler = ({ isBusy, doLock, doUnlock, waitMs }) =>
  async function throttler(cb, ...args) {
    while (isBusy()) {
      await delay(waitMs ? waitMs() : 500); // use event-loop as our callback queue!
    }
    doLock();
    const result = await cb.call(this, ...args);
    await delay(1000); // slows down every download response
    doUnlock();
    return result;
  };

module.exports = (max) => {
  const _lock = { count: 0, max: 1 };
  if (max !== undefined && !Number.isNaN(max)) _lock.max = max;

  return newThrottler({
    isBusy: () => _lock.count >= _lock.max,
    doLock: () => (_lock.count += 1),
    doUnlock: () => (_lock.count -= 1),
    waitMs: () => 1000 * Math.random(),
  });
}
