function checkAvoidAction(usernameFull) {
  const parts = usernameFull.split("!");
  const username = parts.pop(); // take last part as user
  const avoidAction = parts.length ? parts.pop().toLowerCase() : null;
  return { username, avoidAction };
}

module.exports = { checkAvoidAction };
