import express from "express";
import { formats, requireBody } from "../../middleware/requireInRequest";
import { appdb } from "../../store";
import { ObjectId } from "mongodb";
import OpenAI from "openai";

const router = express.Router();

const client = new OpenAI();
const systemPrompt = `
  You are a riddle judge. If the player's answer has the same meaning as the
  correct answer, return only 'Yes'. If it does not, return only 'No'. Do not
  require exact wording.
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

    console.log(`\n${playerAnswer}\n${actualAnswer}\n${result.answer}`);

    response.send({ Correct: isCorrect });
  },
);

export default router;
