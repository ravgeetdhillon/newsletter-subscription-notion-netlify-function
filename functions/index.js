const { Client, LogLevel } = require('@notionhq/client');

const { NOTION_API_TOKEN, NOTION_DATABASE_ID } = process.env;

async function addEmail(email) {
  // initialize notion client
  const notion = new Client({
    auth: NOTION_API_TOKEN,
    logLevel: LogLevel.DEBUG,
  });

  await notion.pages.create({
    parent: {
      database_id: NOTION_DATABASE_ID,
    },
    properties: {
      Email: {
        title: [
          {
            text: {
              content: email,
            },
          },
        ],
      },
    },
  });
}

function validateEmail(email) {
  const re =
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
}

module.exports.handler = async function (event, context) {
  // check the request method
  if (event.httpMethod != 'POST') {
    return { statusCode: 405, body: 'Method not Allowed' };
  }

  // get the body
  try {
    var body = JSON.parse(event.body);
  } catch (err) {
    return {
      statusCode: 400,
      body: err.toString(),
    };
    return;
  }

  // validate the email
  const { email } = body;
  if (!validateEmail(email)) {
    return { statusCode: 400, body: 'Email is not valid' };
  }

  // store email in notion
  await addEmail(email);
  return { statusCode: 200, body: 'ok' };
};
