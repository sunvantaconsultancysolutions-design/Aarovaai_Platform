import fs from "fs";
import Anthropic from "@anthropic-ai/sdk";
 
const client = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY
});
 
async function generateQuestions(topic) {
  const prompt = fs.readFileSync("prompt.txt", "utf8")
                   .replace(/{{TOPIC}}/g, topic);
 
  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 8000,
    temperature: 0.2,
    messages: [{ role: "user", content: prompt }]
  });
 
  const outputPath = `outputs/${topic.replace(/ /g, "_")}.json`;
  fs.writeFileSync(outputPath, response.content[0].text);
  console.log("Generated:", outputPath);
}
 
async function run() {
  const topics = fs.readFileSync("topics.txt", "utf8").split("\n");
  for (const topic of topics) {
    if (topic.trim() === "") continue;
    await generateQuestions(topic.trim());
  }
}
 
run();
