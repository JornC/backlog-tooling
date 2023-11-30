import express from "express";

const app = express();
const port = process.env.PORT || 3000;

app.get("/", (_req, res) => {
  res.send("Hello World 123123123!");
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
