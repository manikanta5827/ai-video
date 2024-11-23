const Groq = require('groq-sdk');

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

async function getGroq(text) {
  try {
    const response = await groq.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: `summarise the following ${text}`,
        },
      ],
      model: 'llama3-8b-8192',
    });
    return response;
  } catch (error) {
    console.error('Error in getGroqChatCompletion:', error);
    throw error;
  }
}

module.exports = { getGroq };
