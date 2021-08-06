const assert = require('chai').assert;
const { getUserByEmail } = require('../helpers');

describe('#getUserByEmail', () => {
  it ("Return correct user and email from user:", () => {
    const user = 'test';
    const email = 't@t.com';
    const database = {  
      "userRandomID": {
        user_id: "userRandomID",
        email: "user@example.com",
        password: "purple-monkey-dinosaur"
      },
      "test1": {
        user_id: "test1",
        email: "t1@t1.com",
        password: "t1"
      },
      "test": {
        user_id: "test",
        email: "t@t.com",
        password: "ttt"
      }
    };
    const result = getUserByEmail('t@t.com', database);
    assert.deepEqual(result, 'test');
  });
});  