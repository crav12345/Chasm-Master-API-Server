import express from "express";
import { formats, requireBody } from "../../middleware/requireInRequest";
import { appdb } from "../../store";
import { ObjectId } from "mongodb";
import OpenAI from "openai";

const router = express.Router();

const client = new OpenAI();
const systemPrompt = `
  You are a riddle judge. I'm giving you the actual answer and the answer
  given by a human. If the human's answer has the same general meaning or is a
  goofy but acceptable version of the answer, you should accept that as
  correct.
  
  If the answer is acceptable, reply only 'Yes'. If it is not, return only
  'No'.
  
  Do not require exact wording. If the answer can be reasonably interpreted as
  showing that the human understands the answer, it should be accepted. Don't
  get too hung up on grammar that leads to an incorrect answer on a
  technicality. If it's too vague or too off base, reject.
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
