import mongoose from "mongoose";
import { config } from "../config/app.config";

const { MONGO_URI } = config;

async function connectDBWithRetry(retries = 5, delay = 5000) {
  for (let i = 0; i < retries; i++) {
    try {
      await mongoose.connect(MONGO_URI as string);
      console.info("Database Connected Successfully");
      return;
    } catch (error) {
      console.error(`Unable to connect to database (attempt ${i + 1}):`, error);
      if (i < retries - 1) {
        console.info(`Retrying in ${delay / 1000} seconds...`);
        await new Promise(res => setTimeout(res, delay));
      } else {
        process.exit(1);
      }
    }
  }
}

// Call the connect function
connectDBWithRetry();

// Handle events
mongoose.connection.on("connected", () => {
  console.info("Mongoose connected to DB");
});

mongoose.connection.on("error", (err) => {
  console.error("Mongoose connection error: ", err);
});

mongoose.connection.on("disconnected", () => {
  console.info("Mongoose disconnected");
});

// If the Node process ends, close the Mongoose connection
process.on("SIGINT", async () => {
  await mongoose.connection.close();
  console.info("Mongoose connection closed due to app termination");
  process.exit(0);
});