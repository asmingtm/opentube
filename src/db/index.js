import mongoose from "mongoose";
import chalk from "chalk";

import { FULL_MONGODB_URI } from "#consts";

const log = console.log;

export async function connectDB(){
    try {
        const instance = await mongoose.connect(FULL_MONGODB_URI);
        log(chalk.gray("─".repeat(60)));
        log(chalk.bold.green("OpenTube database connected successfully!"));
        log(chalk.gray("Connection Host:"), chalk.blue(instance.connection.host));
    }
    catch (err) {
        console.error("MongoDB connection error:", err);
        process.exit(1);
    }
}