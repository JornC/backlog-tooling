import { Application } from "express";

export function setupRoutes(app: Application) {
  const PORT: number | string = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);

    app.get("/ping", (_req, res) => {
      res.send("pong");
    });
  });
}
