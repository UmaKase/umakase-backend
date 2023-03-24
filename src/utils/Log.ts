import fs from "fs";
import Path from "path";
import { DEFAULT_LOG_PATH } from "../config/config";

export class Log {
  private path: string;

  constructor(path?: string) {
    if (path && path.length > 0) {
      const absolutePath = Path.join(__dirname, "..", "..", path);
      this.path = absolutePath;
    } else {
      this.path = Path.join(__dirname, "..", "..", DEFAULT_LOG_PATH);
    }
    // create directory if not exist
    if (!fs.existsSync(this.path)) {
      fs.mkdirSync(this.path, { recursive: true });
    }
  }

  log(...things: any[]) {
    console.log(things);
    let data = `[${new Date().toUTCString()} LOG]: \n`;
    data = this.convertArgsToString(things);
    data += "-------------***********-------------\n";

    let logName = this.getName();
    fs.appendFileSync(`${this.path}/${logName}`, `${data}`);
  }

  error(...things: any[]) {
    console.log(things);
    let data = `[${new Date().toUTCString()} Error]: \n`;
    data = this.convertArgsToString(things);
    data += "-------------***********-------------\n";

    let logName = this.getName();
    fs.appendFileSync(`${this.path}/${logName}`, `${data}`);
  }

  /**
   * Convert any thing passed to 1 string
   * @param things anything
   * @returns conveted things to 1 long string
   */
  private convertArgsToString(things: any[]) {
    let data = "";
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
    return data;
  }

  private getName() {
    return `${new Date().toDateString()}.log`;
  }
}
