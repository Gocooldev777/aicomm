const express = require('express');
const cors = require('cors');
const { OpenAI } = require('openai');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.post('/chat', async (req, res) => {
  const userMessage = req.body.message;
  console.log("Received message from user:", userMessage); // debug log

  try {
    const chat = await openai.chat.completions.create({
        model: 'ft:gpt-3.5-turbo-0125:hysteresis::BHEpYQqD',
        messages: [
          { role: "system", content: "You are a friendly English-speaking coach who helps users improve grammar and vocabulary." },
          { role: "user", content: userMessage }
        ]
      });
      

    

    const reply = chat.choices[0].message.content;
    res.json({ reply });
  } catch (err) {
    console.error("OpenAI error:", err);
    res.status(500).send("GPT error");
  }
});

app.listen(3001, () => {
  console.log('✅ Server running on http://localhost:3001');
});
