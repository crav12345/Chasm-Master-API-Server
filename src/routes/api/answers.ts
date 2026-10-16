import express from "express";
import { formats, requireBody } from "../../middleware/requireInRequest";
import { appdb } from "../../store";
import { ObjectId } from "mongodb";
import OpenAI from "openai";

const router = express.Router();

const client = new OpenAI();
const systemPrompt = `
You are a riddle judge. You are given the correct answer to a riddle and an answer provided by a human player.

Your task is to determine whether the player's answer demonstrates sufficient understanding of the intended answer.

Accept answers that:
- Express the same fundamental concept using different wording.
- Identify a more specific instance or form of the correct answer.
- Identify an essential or defining component that reasonably represents the intended answer.
- Demonstrate understanding of the intended concept without requiring exact wording or strict technical equivalence.

Reject answers that:
- Are merely associated with the correct answer without expressing its meaning.
- Rely on metaphorical, symbolic, or poetic connections.
- Identify something that represents, measures, produces, contains, or interacts with the correct answer rather than expressing its meaning.
- Are conceptually different, even if closely related.
- Are too vague or ambiguous to demonstrate sufficient understanding.

An answer must demonstrate understanding of WHAT the correct answer is, not merely something related to it.

Examples:

Correct answer: "Time"
Accept: "The passing of days", "The passage of time"
Reject: "A clock", "My watch"

Correct answer: "A cloud"
Accept: "A rain cloud", "Clouds"
Reject: "A storm", "Shadow"

Correct answer: "Air"
Accept: "Oxygen", "The atmosphere"
Reject: "Windmill", "A fan"

Correct answer: "Fire"
Accept: "Flames", "A blaze"
Reject: "Smoke", "A match"

Correct answer: "Future"
Accept: "Tomorrow", "The time ahead", "What's yet to come"
Reject: "Horizon", "Destiny", "A crystal ball"

Evaluate answers based on conceptual understanding rather than loose associations. Do not invent metaphorical interpretations to justify an otherwise incorrect answer.

If the answer is acceptable, respond only with "Yes".
If the answer is unacceptable, respond only with "No".

Do not provide explanations or additional text.
`;

/** Uses GPT to validate an answer to a riddle. */
router.post(
  "/",
  requireBody("RiddleId", { format: formats.objectId }),
  requireBody("Answer", { format: formats.string }),
  async (request, response) => {
    const riddleId = new ObjectId(request.body.RiddleId as string);
    const playerAnswer = request.body.Answer as string;
    const riddlesCollection = appdb.collection("riddles");
    const riddleEntry = await riddlesCollection.findOne({ _id: riddleId });

    if (riddleEntry == null) {
      response
        .status(500)
        .send({ Message: "Couldn't find a riddle with that _id." });
      return;
    }

    const actualAnswer = riddleEntry.Answer;
    const userPrompt = `Correct answer: ${actualAnswer}\nPlayer answer: ${playerAnswer}`;
    const gptResponse = await client.responses.create({
      model: "gpt-5-mini",
      instructions: systemPrompt,
      input: userPrompt,
      text: {
        format: {
          type: "json_schema",
          name: "riddle_judgment",
          strict: true,
          schema: {
            type: "object",
            properties: {
              answer: {
                type: "string",
                enum: ["Yes", "No"],
              },
            },
            required: ["answer"],
            additionalProperties: false,
          },
        },
      },
    });

    const result = JSON.parse(gptResponse.output_text);
    const isCorrect = result.answer === "Yes";

    console.log(
      `\nPlayer:${playerAnswer}\nActual:${actualAnswer}\nResult:${result.answer}\n\nFull GPT Response:${result}`,
    );

    response.send({ Correct: isCorrect });
  },
);

export default router;
