const getUserByEmail = function (email, database) {
  for (const user in database) {
    if (email === database[user].email) {
      return database[user]
    };
  };
  return false;
};

function generateRandomString() {
  const length = 6;
  let randomString = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let x = 1; x <= length; x++) {
    randomString += characters[Math.floor(Math.random() * characters.length)];
  };
  return randomString;
};

module.exports = { getUserByEmail, generateRandomString };