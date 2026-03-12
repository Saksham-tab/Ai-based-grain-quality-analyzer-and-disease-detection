import { spawn } from "child_process";
import env from "../config/env.js";

/**
 * Run a Python AI agent safely with:
 * - JSON input via stdin
 * - JSON output via stdout
 * - timeout protection
 */
export const spawnPython = (scriptPath, inputData) => {
  return new Promise((resolve, reject) => {
    const pyProcess = spawn("python", [scriptPath]);

    let stdoutData = "";
    let stderrData = "";

    /*  Send JSON input  */
    pyProcess.stdin.write(JSON.stringify(inputData));
    pyProcess.stdin.end();

    /*  Collect stdout  */
    pyProcess.stdout.on("data", (data) => {
      stdoutData += data.toString();
    });

    /*  Collect stderr  */
    pyProcess.stderr.on("data", (data) => {
      stderrData += data.toString();
    });

    /*  Timeout protection  */
    const timeout = setTimeout(() => {
      pyProcess.kill("SIGKILL");
      reject(new Error("Python agent timeout"));
    }, env.AI_TIMEOUT_MS);

    /*  On process close  */
    pyProcess.on("close", (code) => {
      clearTimeout(timeout);

      if (code !== 0) {
        return reject(
          new Error(stderrData || `Python exited with code ${code}`)
        );
      }

      try {
        const parsedOutput = JSON.parse(stdoutData);
        resolve(parsedOutput);
      } catch (err) {
        reject(new Error("Invalid JSON returned from Python agent"));
      }
    });

    /*  Spawn error  */
    pyProcess.on("error", (err) => {
      clearTimeout(timeout);
      reject(err);
    });
  });
};
