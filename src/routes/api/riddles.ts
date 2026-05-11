import express from "express";
import { appdb } from "../../store";
import { ObjectId } from "mongodb";
import { formats, requireParam } from "../../middleware/requireInRequest";

const router = express.Router();

/** Gets a random riddle from the database. */
router.get("/", async (request, response) => {
  const riddlesCollection = appdb.collection("riddles");
  const aggregationPipeline = [{ $sample: { size: 1 } }];

  const randomRiddles = await riddlesCollection
    .aggregate(aggregationPipeline)
    .toArray();

  if (randomRiddles.length == 0) {
    response.status(500).send({ Message: "No riddles found." });
    return;
  }

  const riddleEntry = randomRiddles[0];

  if (riddleEntry == null) {
    response.status(500).send({ Message: "Riddle array was empty." });
    return;
  }

  response.status(200).send({
    RiddleId: riddleEntry._id,
    Riddle: riddleEntry.Riddle,
    Answer: riddleEntry.Answer,
  });
});

/** Gets a specific riddle from the database. */
router.get(
  "/:id",
  requireParam("id", { format: formats.objectId }),
  async (request, response) => {
    const riddleId = new ObjectId(request.params.id);
    const riddlesCollection = appdb.collection("riddles");

    const riddleEntry = await riddlesCollection.findOne({ _id: riddleId });

    if (riddleEntry == null) {
      response.status(404).send({ Message: "No riddle found." });
      return;
    }

    response
      .status(200)
      .send({ Riddle: riddleEntry.Riddle, Answer: riddleEntry.Answer });
  },
);

export default router;
