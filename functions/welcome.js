const { Client, LogLevel } = require('@notionhq/client');
const mailgun = require('mailgun-js');

const { NOTION_API_TOKEN, NOTION_DATABASE_ID, MAILGUN_API_KEY, MAILGUN_DOMAIN } = process.env;

async function fetchNewSignups() {
  // initialize notion client
  const notion = new Client({
    auth: NOTION_API_TOKEN,
    logLevel: LogLevel.DEBUG,
  });

  // create a datetime which is 30 mins earlier than the current time
  let fetchAfterDate = new Date();
  fetchAfterDate.setMinutes(fetchAfterDate.getMinutes() - 30);

  // query the database
  // and fetch only those entries which were created in the last 30 mins
  const response = await notion.databases.query({
    database_id: NOTION_DATABASE_ID,
    filter: {
      or: [
        {
          property: 'Added On',
          date: {
            after: fetchAfterDate,
          },
        },
      ],
    },
  });

  const emails = response.results.map((entry) => entry.properties.Email.title[0].plain_text);

  return emails;
}

async function sendWelcomeEmail(to) {
  const mg = mailgun({ apiKey: MAILGUN_API_KEY, domain: MAILGUN_DOMAIN });

  const data = {
    from: `Ravgeet Dhillon <postmaster@${MAILGUN_DOMAIN}>`,
    to: to,
    subject: 'Thankyou for subscribing',
    text: "Thankyou for subscribing to my newsletter. I'll be sending daily tips related to Javascript everyday.",
  };

  await mg.messages().send(data);
}

module.exports.handler = async function (event, context) {
  //   check the request method
  if (event.httpMethod != 'POST') {
    return { statusCode: 405, body: 'Method not Allowed' };
  }

  const emails = await fetchNewSignups();

  emails.forEach(async (email) => {
    await sendWelcomeEmail(email);
  });

  return { statusCode: 200, body: 'ok' };
};
