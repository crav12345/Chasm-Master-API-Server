import fs from "fs";

const configs: { [key: string]: any } = {};
fs.readdirSync("./config").forEach((file) => {
  configs[file.replace(".json", "")] = require(`../config/${file}`);
});

if (!((process.env.CONFIG as string) in configs)) {
  console.error(
    "Error: No config found. Make sure to set the $CONFIG environment variable to a valid value.\n" +
      `\tValid values are [${Object.keys(configs)}].\n` +
      `\tCurrent value is: ${process.env.CONFIG}.`,
  );
  process.exit(1);
}

export default configs[process.env.CONFIG as string];
