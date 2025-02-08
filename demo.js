const express = require("express");
const fs = require("fs");
const { exec } = require("child_process");
const path = require("path"); 
const crypto = require("crypto");
const cors=require("cors")
const app = express();
app.use(express.json()); 
app.use(cors())
const files = {
  javascript: "script.js",
  python: "script.py",
  c: "script.c",
  cpp: "script.cpp",
  java: "script.java",
};

const commands = {
  javascript: "node script.js",
  python: "python3 script.py",
  c: "gcc script.c -o script.out && ./script.out",
  cpp: "g++ script.cpp -o script.out && ./script.out",
  java: "javac script.java && java script",
};

app.post("/execute", (req, res) => {
  const { code, language } = req.body;

  if (!code || !language) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  if (!Object.keys(files).includes(language)) {
    return res.status(400).json({ message: "Invalid language" });
  }

  const filePath = files[language];

 


  fs.writeFile(filePath, code, (err) => {
    if (err) {
      return res.status(500).json({ message: "Error writing file" });
    }

    exec(commands[language], (error, stdout, stderr) => {
      if (error) {
        return res.json({ error: stderr || error.message });
      }
      res.json({ output: stdout.trim() });
    });
  });
});

app.listen(5080, () => {
  console.log("Server started on port 5080");
});

