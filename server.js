const express = require("express");
const fs = require("fs");
const { exec } = require("child_process");
const path = require("path");

const app = express();
app.use(express.json()); // Middleware to parse JSON requests

const extensions = {
  javascript: "js",
  python: "py",
  c: "c",
  cpp: "cpp",
  java: "java",
};

const getUniqueFilename = (language) => {
  return `temp_${Date.now()}_${Math.random().toString(36).slice(2)}.${extensions[language]}`;
};

app.post("/execute", (req, res) => {
  const { code, language } = req.body;

  if (!code || !language) {
    return res.status(400).json({ error: "Missing code or language" });
  }
  if (!extensions[language]) {
    return res.status(400).json({ error: "Unsupported language" });
  }

  const fileName = getUniqueFilename(language);
  const filePath = path.join(__dirname, fileName);

  // Write code to the unique file
  fs.writeFile(filePath, code, (err) => {
    if (err) {
      return res.status(500).json({ error: "Error writing to file" });
    }

    let command;
    switch (language) {
      case "javascript":
        command = `node ${filePath}`;
        break;
      case "python":
        command = `python3 ${filePath}`;
        break;
      case "c":
        command = `gcc ${filePath} -o ${filePath}.out && ${filePath}.out`;
        break;
      case "cpp":
        command = `g++ ${filePath} -o ${filePath}.out && ${filePath}.out`;
        break;
      case "java":
        const javaClassName = path.basename(filePath, ".java");
        command = `javac ${filePath} && java -cp ${__dirname} ${javaClassName}`;
        break;
    }

    // Execute the file
    exec(command, (error, stdout, stderr) => {
      // Delete the file after execution
      fs.unlink(filePath, () => {});

      // Delete compiled output file (for C/C++/Java)
      if (language === "c" || language === "cpp") {
        fs.unlink(`${filePath}.out`, () => {});
      }
      if (language === "java") {
        fs.unlink(`${filePath.replace(".java", ".class")}`, () => {});
      }

      if (error) {
        return res.status(400).json({ error: stderr || "Execution error" });
      }

      res.json({ output: stdout.trim() });
    });
  });
});

// Start the server
const PORT = process.env.PORT || 5080;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
