const findUserByEmail = (email, database) => {
  for (let user in database) {
    if (database[user].email === email) {
      return database[user];
    }
  }
  return undefined;
};

const generateRandomString = () => {

  let output = "";
  while (output.length < 6) {

    //Generating code point value between 0 and 122
    let codePoint = Math.floor(Math.random() * 1000);
    if (codePoint > 122) {
      codePoint = Math.floor(codePoint / 10);
    }

    //Checks if codePoint is alphanumeric; 48-57 is numbers, 65-90 is uppercase letters, 97-122 is lowercase letters
    if ((48 <= codePoint && codePoint <= 57) || (65 <= codePoint && codePoint <= 90) || (97 <= codePoint && codePoint <= 122)) {
      output += String.fromCodePoint(codePoint);
    }
  }

  return output;
};

const urlsForUser = (id, database) => {
  const userURLs = {};
  for (let short in database) {
    if (database[short].userID === id) {
      userURLs[short] = database[short];
    }
  }
  return userURLs;
};

module.exports = { findUserByEmail, generateRandomString, urlsForUser };