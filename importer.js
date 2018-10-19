const { lstatSync, readdirSync, existsSync } = require("fs");
const os = require("os");
const { join, resolve } = require("path");
const { exec, execSync } = require("child_process");

/* returns the sourcerer executable for your OS, change if needed */
function getSourcerer() {
  function isWindows() {
    return os.platform() === "win32";
  }

  return isWindows()
    ? `java -jar %userprofile%\\.sourcerer\\sourcerer.jar`
    : `~/.sourcerer/sourcerer`;
}

function updateTrackedProjects(rootProjectPaths) {
  function getDirectories(source) {
    function isDirectory(source) {
      return lstatSync(source).isDirectory();
    }

    return readdirSync(source)
      .map(name => join(source, name))
      .filter(isDirectory);
  }

  function isRepo(path) {
    return existsSync(resolve(`${path}\\.git`));
  }

  function addToSourcerer(path) {
    try {
      console.log(
        "IMPORT: ",
        path,
        execSync(`${getSourcerer()} add ${path}`).toString()
      );
    } catch (error) {
      console.log("An error occured: ", error, "move on");
    }
  }

  rootProjectPaths.map(path =>
    getDirectories(path)
      .filter(isRepo)
      .forEach(addToSourcerer)
  );
}

function runSourcerer() {
  const sourcerer = exec(getSourcerer());
  process.stdin.pipe(sourcerer.stdin);
  sourcerer.stdout.on("data", function(data) {
    console.log(data.toString());
  });

  sourcerer.stderr.on("data", function(data) {
    console.log("Error: " + data.toString());
  });

  sourcerer.on("exit", function(code) {
    console.log("child process exited with code " + code.toString());
  });
}

/**
 * Adds all found git repositories to the list of tracked repositories of Sourcerer.io
 * and updates the Sourcerer.io profile
 *
 * Expects a list of directories that hold project directories
 *
 * @param {String[]} rootProjectPaths
 */
function importLocalRepositories(rootProjectPaths = []) {
  updateTrackedProjects(rootProjectPaths);
  runSourcerer();
}

module.exports = exports = { importLocalRepositories };
