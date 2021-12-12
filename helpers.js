


const generateRandomString = () => {
  let string = Math.random()
    .toString(36)
    .replace(/[^a-z]+/g, "")
    .substr(0, 6);
  return string;
};

const findUserByEmail = (email, users) => {
  for (const userID in users) {
    const user = users[userID];
    if (user.email === email) {
      return user;
    }
  }
  return null;
};

const urlsForUser = (urlDatabase, userId) => {
  let obj = {};
  for (let url in urlDatabase) {
    if (userId === urlDatabase[url].userID) {
      obj[url] = urlDatabase[url];
    }
  }
  return obj;
};

module.exports = {
  findUserByEmail,
  generateRandomString,
  urlsForUser
}