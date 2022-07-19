'use strict';

module.exports.hello = async (event) => {
  return {
    statusCode: 200,
    body: JSON.stringify(
      {
        message: "Hello \\m/"
      },
      null,
      2
    ),
  };
};

module.exports.goodbye = async (event) => {
  return {
    statusCode: 200,
    body: JSON.stringify(
      {
        message: "bye"
      },
      null,
      2
    )
  }
}