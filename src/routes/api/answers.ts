import express from "express";
import { formats, requireBody } from "../../middleware/requireInRequest";
import { appdb } from "../../store";
import { ObjectId } from "mongodb";
import OpenAI from "openai";

const router = express.Router();

const client = new OpenAI();
const systemPrompt = "You are a wise old man that gives riddles.";

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
    const userPrompt = `I asked the user a riddle. The correct answer is ${actualAnswer}. The player answered: ${playerAnswer}. Is their answer correct? Reply with only 'Yes' or 'No'.`;
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: userPrompt,
        },
        {
          role: "system",
          content: systemPrompt,
        },
      ],
      max_tokens: 5,
    });

    const aiResponse = completion.choices[0]?.message?.content
      ?.trim()
      .toLowerCase();

    response.send({ Correct: aiResponse?.includes("yes") });
  },
);

export default router;
