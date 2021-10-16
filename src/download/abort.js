const AbortController = require("abort-controller");

module.exports = (ms = 6000) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => {
    controller.abort();
  }, ms);
  return {
    signal: controller.signal,
    clear: () => clearTimeout(timeout),
  };
};
