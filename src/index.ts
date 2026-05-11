import express from "express";
import cors from "cors";
import answersRouter from "./routes/api/answers";
import engineeringDemoRouter from "./routes/api/engineering-demo";
import riddlesRouter from "./routes/api/riddles";

const PORT = process.env.PORT ?? 8000;
const app = express();

app.use(express.json());

app.use(
  cors({
    origin: [
      "https://html-classic.itch.zone",
      "https://www.chrisravosa.com",
      "https://chrisravosa.com",
      "https://crav12345.github.io",
    ],
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.get("/", (_req, res) => res.sendStatus(204));

app.use("/api/answers", answersRouter);
app.use("/api/engineering-demo", engineeringDemoRouter);
app.use("/api/riddles", riddlesRouter);

app.listen(PORT, () => {
  console.log(`Chasm-Master-API-Server listening on port ${PORT}`);
});
