import { streamText } from "ai";

const result = streamText({
  model: process.env.AI_GATEWAY_TEST_MODEL || "openai/gpt-4o-mini",
  prompt: "Explain quantum computing in simple terms.",
});

for await (const chunk of result.textStream) {
  process.stdout.write(chunk);
}
