import mongoose from "mongoose";
import { DB_URI } from "./../config.js";
import { connectRedis } from "./redis.connection.js";

export const bootstrapDB = async (app, port) => {
  try {
    await mongoose.connect(DB_URI, { serverSelectionTimeoutMS: 5000 });
    console.log("DB connected successfullyyyyyss");
    await connectRedis()
    app.listen(port, () => {
      console.log(`app is running on port ${port}`);
    });
    await UserModel.syncIndexes();
  } catch (error) {
    console.log("DB failed to connect");
  }
};
