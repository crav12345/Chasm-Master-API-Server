import express from "express";
import { formats, requireBody } from "../../middleware/requireInRequest";
import { appdb } from "../../store";
import { ObjectId } from "mongodb";
import OpenAI from "openai";

const router = express.Router();

const client = new OpenAI();
const systemPrompt =
  "You are a riddle judge. If the player's answer has the same meaning as the correct answer, return only 'Yes'. If it does not, return only 'No'. Do not require exact wording.";

const parseYesNo = (text: string): boolean => {
  const normalized = text.trim().toLowerCase();
  if (/^yes\b/.test(normalized)) return true;
  if (/^no\b/.test(normalized)) return false;
  if (normalized.includes(" yes")) return true;
  if (normalized.includes(" no")) return false;
  return false;
};

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
    const userPrompt = `I asked the user a riddle. The correct answer is ${actualAnswer}. The player answered: ${playerAnswer}. Is their answer correct? Answer only Yes or No.`;
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: userPrompt,
        },
      ],
      max_tokens: 3,
      temperature: 0,
    });

    const aiResponse = completion.choices[0]?.message?.content ?? "";
    const isCorrect = parseYesNo(aiResponse);

    response.send({ Correct: isCorrect });
  },
);

export default router;
