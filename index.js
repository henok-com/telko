const { google } = require("googleapis");
const { Telegraf, Markup } = require("telegraf");
const path = require("path");
const fs = require("fs");
const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS_BASE64);



const BOT_TOKEN = process.env.BOT_TOKEN;
let filteredData = [];

async function readSheetData() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: credentials.client_email,
      private_key: credentials.private_key,
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });

  const client = await auth.getClient();

  const sheets = google.sheets({ version: "v4", auth: client });
  const spreadsheetId = "11RTatfSqeoL8ula-OwOqcVavdEbg_XA94zToEQdL7-g";
  const range = "'ሚስጥረ ሥላሴ '!B:C";

  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    const data = response.data.values || [];
    filteredData = data.slice(1);
  } catch (error) {
    console.error("Error reading the sheet:", error);
  }
}

readSheetData();

const bot = new Telegraf(BOT_TOKEN);
let id;
let course;

const courses = [
  {
    id: 1,
    name: "ምስጢረ ሥላሴ",
  },
];

bot.start((ctx) => {
  ctx.reply("ሰላም! እንኳን ወደ ፍኖት የተልዕኮ ትምህርት ውጤት መመልከቻ ቦት በደህና መጡ!");
  ctx.reply('እባክዎን የመታወቂያ ቁጥርዎን "2/****" ልክ እንደዚህ ያስገቡ።');
});

const idRegex = /2\/[0-9]{0,4}/g;
function checkMenu(menuName) {
  let course = courses.filter((course) => course.name === menuName);
  if (course.length != 0) {
    return true;
  } else {
    return false;
  }
}

bot.on("text", (ctx) => {
  if (id == null) {
    if (idRegex.test(ctx.message.text)) {
      id = ctx.message.text;
      ctx.reply(
        "ውጤት ማየት የፈለጉትን ትምህርት ይምርጡ",
        Markup.keyboard(courses.map((course) => course.name)).resize()
      );
    } else {
      ctx.reply(`ትክክለኛ የመታወቂያ ቁጥር አላስገባችሁም ማስገባት የሚቻለው የመታወቂያ ቁጥር "2/****"`);
    }
  } else if (checkMenu(ctx.message.text)) {
    const index = filteredData.findIndex((row) => row[0] === id);
    if (index != -1) {
      ctx.reply(
        `የምስጢረ ሥላሴ ፈተና ውጤቶት፡ \n${filteredData[index][1]} \n እናመሰግናለን!!!`,
        Markup.removeKeyboard()
      );
      id = null;
    } else {
      ctx.reply(
        `የፈተናዎ ውጤት አልተገኘም እባክዎትን በድጋሜ ይሞክሩ። በድጋሚ ሞክረው ካልሰራልዎት በአካል ፍኖተ ሰማዕታት ሰንበት ትምህርት ቤት ትምህርት ክፍል በመሄድ ያናግሯቸው እናመሰግናለን!!!`,
        Markup.removeKeyboard()
      );
      id = null;
    }
  }
});

bot.launch();
console.log("Bot is running....");
