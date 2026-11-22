import "dotenv/config";

import { connectDB } from "#db";
import { app } from "#app";
import { PORT } from "#consts";
import chalk from "chalk";

connectDB().then(() => {
    app.on("error", err => {
        console.log("Error on express:", err);
        throw err;
    })
    app.listen(PORT, () => {
        console.log(chalk.gray("Server is listening on port:"), chalk.yellow(PORT));
        console.log(chalk.gray("─".repeat(60)));
    });
}).catch(err => {
    console.error("Error recived while connecting database:", err);
    process.exit(1);
});