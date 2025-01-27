const { google } = require("googleapis");
const { Telegraf, Markup } = require("telegraf");
const express = require("express");
const app = express();

const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS_BASE64);

const BOT_TOKEN = process.env.BOT_TOKEN;
let filteredData = []; // To store filtered data from the Google Sheet
let id = ""; // To temporarily hold the user's ID

const courses = [
  {
    id: 1,
    name: "ምስጢረ ሥላሴ",
  },
];

// Function to read data from Google Sheets
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
    filteredData = data.slice(1); // Skip header row
  } catch (error) {
    console.error("Error reading the sheet:", error);
  }
}

// Initial data load
readSheetData();

// Create a new Telegraf bot instance
const bot = new Telegraf(BOT_TOKEN);

// ID validation regex
const idRegex = /2\/[0-9]{0,4}$/g;

// Check if a course exists by name
function checkMenu(menuName) {
  return courses.some((course) => course.name === menuName);
}

// Bot start command
bot.start((ctx) => {
  ctx.reply("ሰላም! እንኳን ወደ ፍኖት የተልዕኮ ትምህርት ውጤት መመልከቻ ቦት በደህና መጡ!");
  ctx.reply('እባክዎን የመታወቂያ ቁጥርዎን "2/****" ልክ እንደዚህ ያስገቡ።');
});

// Text message handler
bot.on("text", (ctx) => {
  const userText = ctx.message.text.trim();

  // Check if the user has entered an ID
  if (id === "") {
    if (idRegex.test(userText)) {
      id = userText; // Store the ID
      ctx.reply(
        "ውጤት ማየት የፈለጉትን ትምህርት ይምርጡ:",
        Markup.keyboard(courses.map((course) => course.name)).resize()
      );
    } else {
      ctx.reply(
        'ትክክለኛ የመታወቂያ ቁጥር አላስገባችሁም። ማስገባት የሚቻለው በ"2/****" ፎርማት ነው።'
      );
    }
  } else if (checkMenu(userText)) {
    // Check if the user has selected a valid course
    const index = filteredData.findIndex((row) => row[0] === id);

    if (index !== -1) {
      // If the ID exists in the sheet, display the result
      ctx.reply(
        `የምስጢረ ሥላሴ ፈተና ውጤቶት፡ \n${filteredData[index][1]} \n እናመሰግናለን!!! በድጋሚ ለማየት የመታወቂያ ቁጥርዎን ያስገቡ!`,
        Markup.removeKeyboard()
      );
    } else {
      // If the ID is not found
      ctx.reply(
        `የፈተናዎ ውጤት አልተገኘም። እባክዎትን በድጋሜ የመታወቂያ ቁጥር በማስገባት ይሞክሩ። በድጋሚ ሞክረው ካልሰራልዎት በአካል ፍኖተ ሰማዕታት ሰንበት ትምህርት ቤት ትምህርት ክፍል በመሄድ ያናግሯቸው።`,
        Markup.removeKeyboard()
      );
    }

    // Reset ID for the next operation
    id = "";
  } else {
    // Invalid course selection
    ctx.reply("እባክዎትን ትክክለኛ አማራጭ ይምረጡ።");
  }
});

// Web server for health check
app.get("/", (req, res) => {
  res.send("Hello, World!");
});

// Launch the bot
bot.launch();
console.log("Bot is running...");

// Start the express server
app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
