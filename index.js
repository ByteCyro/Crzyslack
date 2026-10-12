require("dotenv").config();

const { App } = require("@slack/bolt");
const axios =require("axios");

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  appToken: process.env.SLACK_APP_TOKEN,
  socketMode: true
});

async function searchwikipedia(query) {
  try{
    const searchRes = await axios.get('https;//en.wikipedia.org/w/api/.php',{
      params:{
        action: 'opensearch',
        search: query,
        limit: 1,
        namespace: 0,
        format: 'json'
      },
      headers: {"User-Agent" : "CrzySlackBot/1.0"}
    });

    const matchedTitles = searchRes.data[1];
    if (!matchedTitles || matchedTitles === 0) {
      return 'No results found for the "${query}".';
    }
    const bestTitle = matchedTitles[0];
    const summaryRes = await axios.get(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(bestTitle)}`,
      { headers: { 'User-Agent': 'CrzySlackBot/1.0' } }
    ); 
    return `*${summaryRes.data.title}*\n${summaryRes.data.extract}\n\n🔗 ${summaryRes.data.content_urls.desktop.page}`;
  } catch (err) {
    return `Could not find any results for "${query}".`;
  }
}
app.command("/crzyslack-ping", async ({ command, ack, respond }) => {
  const start = Date.now();
  await ack();
  const latency = Date.now() - start;
  await respond({ text: `Pong!\nLatency: ${latency}ms` });
});
app.command("/crzyslack-search",async ({command, ack, respond }) => {
  await ack();

  const query = command.text ? command.text.trim() : '';
  if (!query){
    await respond("Please provide a search term! Example: `/crzyslack-search artificial intelligence`");
    return;
  }
  const result = await searchwikipedia(query);
  await respond(result);
});
app.command("/crzyslack-help", async ({ ack, respond }) => {
  await ack();
  await respond({
    text:
`Available Commands:
/crzyslack-ping - Check bot latency
/crzyslack-joke - Hahahah
/crzyslack-help - Gets all commands
/crzyslack-catfact - Get a cat fact`
  });
});
app.command("/crzyslack-catfact", async ({ ack, respond }) => {
  await ack();

  try {
    const response = await axios.get("https://catfact.ninja/fact");
    await respond({ text: `Cat Fact:\n${response.data.fact}` });
  } catch (err) {
    await respond({ text: "Failed to fetch a cat fact." });
  }
});
app.command("/crzyslack-joke", async ({ ack, respond }) => {
  await ack();

  try {
    const response = await axios.get("https://official-joke-api.appspot.com/random_joke");
    await respond({
      text:
`${response.data.setup}

${response.data.punchline}`
    });
  } catch (err) {
    await respond({ text: "Failed to fetch a joke." });
  }
});
(async () => {
  await app.start();
  console.log("bot is running!");
})();
