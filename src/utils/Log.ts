import fs from "fs";
import Path from "path";
import { DEFAULT_LOG_PATH } from "../config/config";

export class Log {
  private path: string;
  private logName: string;

  constructor(path?: string) {
    this.init(path);
  }

  private init(path?: string) {
    if (path && path.length > 0) {
      const absolutePath = Path.join(__dirname, "..", "..", path);
      if (fs.existsSync(absolutePath)) {
        this.path = absolutePath;
      } else {
        // create directory
        fs.mkdirSync(absolutePath);
        this.path = absolutePath;
      }
    } else {
      this.path = Path.join(__dirname, "..", "..", DEFAULT_LOG_PATH);
    }
    this.updateName();
  }

  log(...things: any[]) {
    console.log(things);
    let data = `[${new Date().toUTCString()} LOG]: \n`;
    things.forEach((thing) => {
      switch (typeof thing) {
        case "object":
          data += `${JSON.stringify(thing)} \n`;
          break;
        case "string":
          data += thing + "\n";
          break;
        case "function":
          data += "[function]" + "\n";
          break;
        case "undefined":
          data += "undefined" + "\n";
          break;
        default:
          data += String(thing) + "\n";
      }
    });
    data += "-------------***********-------------\n";
    fs.appendFileSync(`${this.path}/${this.logName}`, `${data}`);
  }

  private updateName() {
    // FIXME: Use cron to update name at 00:00 everyday
    this.logName = `${new Date().toDateString()}.log`;
  }
}
