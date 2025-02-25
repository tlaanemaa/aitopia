// "use server";

import { ChatOllama } from "@langchain/ollama";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { Character, characterPatchSchema } from "../store/gameStore";
import { z } from "zod";

const SYSTEM_PROMPT = `
### **Game Master Instructions**  

As the **Game Master**, you control the **narrative and all characters** within the story world. Your role includes:  

- **Moving characters** to different locations.  
- **Making characters speak** or think aloud.  
- **Introducing new characters** by assigning them actions or roles.  

When positioning characters, ensure they are not on top of each other.
`;

const STATE_PROMPT = `
### **Reference Information**  
\`\`\`json
{STATE}
\`\`\`

2. **Action Log** – A record of recent events and character actions.  
\`\`\`plaintext
{ACTION_LOG}
\`\`\`

Use these logs to maintain continuity and avoid repeating actions.
`;

const TASK_PROMPT = `
### **Your Role: Driving the Story Forward**  

As the Game Master, you have full control over shaping the narrative. Keep the momentum going by:  

- **Moving characters** to relevant locations.  
- **Making them speak or think aloud** to reveal their perspectives.  
- **Introducing new characters** naturally within the story.  
- **Taking multiple actions** to create dynamic and engaging scenes.  

Stay imaginative, respect character motives, and build on past events. **Do not repeat previous actions.**  
Now, what happens next? 
`;

const promptTemplate = ChatPromptTemplate.fromMessages([
  ["system", SYSTEM_PROMPT.trim()],
  ["user", STATE_PROMPT.trim()],
  ["user", TASK_PROMPT.trim()],
]);

const responseFormat = z.object({
  characterActions: z.array(characterPatchSchema, {
    description: "The actions you want to take with characters this turn",
  }),
  goAgain: z.boolean({ description: "Whether you want to take another turn" }),
});

type CallParams = {
  characters: Character[];
  actionLog: string[];
  endpoint: string;
  modelName: string;
};

/**
 * Prompts the LLM to take their turn in the game
 */
export async function promptLLM({
  characters,
  actionLog,
  endpoint,
  modelName,
}: CallParams) {
  const model = new ChatOllama({
    baseUrl: endpoint,
    model: modelName,
  });

  const structuredLlm = model.withStructuredOutput(responseFormat);
  const prompt = await promptTemplate.invoke({
    STATE: JSON.stringify(characters, null, 2),
    ACTION_LOG: actionLog
      .slice(-50)
      .map((x) => `- ${x}`)
      .join("\n"),
  });
  console.log("Prompting LLM:", prompt.toString());
  const response = await structuredLlm.invoke(prompt);
  console.log("LLM response:", response);
  return response;
}
