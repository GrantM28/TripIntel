import { app } from "./app.js";
import { env } from "./config/env.js";

app.listen(env.API_PORT, () => {
  console.log(`Trip Intelligence API running on port ${env.API_PORT}`);
});