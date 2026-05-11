import express from "express";
import { formats, requireQuery } from "../../middleware/requireInRequest";
import { appdb } from "../../store";

const router = express.Router();

/**
 * TODO: Move this or use it for Chasm Master. This was added for a
 * live-service event demo for my lecture for Marist University's pre-college
 * programming course.
 * */
router.get(
  "/",
  requireQuery("Holiday", { format: formats.string }),
  async (request, response) => {
    const holiday = request.query.Holiday as string;
    const holidaysCollection = appdb.collection("holidays");
    const holidayEntry = await holidaysCollection.findOne({ Name: holiday });

    if (holidayEntry == null) {
      response
        .status(500)
        .send({ Message: "Couldn't find a holiday with that Name." });
      return;
    }

    const active = holidayEntry.Active;

    response.send({ EventActive: active });
  },
);

export default router;
