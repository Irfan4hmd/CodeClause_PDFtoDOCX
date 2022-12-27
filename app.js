const express = require("express");
const path = require("path");
const app = express();
const cors = require("cors");
const hostname = "127.0.0.1";
const multer = require("multer");

const fs = require("fs");
const groupdocs_conversion_cloud = require("groupdocs-conversion-cloud");
global.clientId = "f2ba749b-ffc6-467f-99ef-875a15320e9b";
global.clientSecret = "b9c32507d26ff8c4992181b359c6f18c";

const config = new groupdocs_conversion_cloud.Configuration(
  clientId,
  clientSecret
);
config.apiBaseUrl = "https://api.groupdocs.cloud";
app.set("view engine", "ejs");
const port = 4000;

process.on("uncaughtException", (err) => {
  console.log(`Error:${err.stack}`);
  console.log("Shutting down server due to uncaught exceptions");
  process.exit(1);
});

app.use(cors({ origin: true }));

const server = app.listen(process.env.PORT || 4000, () => {
  console.log(`Server is running at http://${hostname}:${port}/`);
});
process.on("unhandledRejection", (err) => {
  console.log(`Error:${err.message}`);
  console.log("shutting down the server due to unhandled promise rejections");
  server.close(() => {
    process.exit(1);
  });
});

const pdftodocxdemo = function (re, file, callback) {
  var ext = path.extname(file.originalname);
  if (ext !== ".pdf") {
    return callback("This extention is not supported");
  }
  callback(null, true);
};
app.use(express.static(__dirname));
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, __dirname);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + file.originalname);
  },
});
const pdftodocxupload = multer({
  storage: storage,
  filterFilter: pdftodocxdemo,
});

app.get("/", (req, res) => {
  res.render("pdftodocx", { title: "pdf to docx" });
});

app.post("/", pdftodocxupload.single("file"), async (req, res) => {
  if (req.file) {
    outputFilepath = Date.now() + "output.docx";
    // initialize api
    let convertApi = groupdocs_conversion_cloud.ConvertApi.fromKeys(
      clientId,
      clientSecret
    );

    // define convert settings
    let settings = new groupdocs_conversion_cloud.ConvertSettings();
    settings.filePath = "sample.pdf"; // input file path on the cloud
    settings.format = "docx"; // output format
    settings.outputPath = "output"; // output file folder on the cloud

    // create convert document
    // read file from local disk
    let file = fs.readFileSync(req.file.path);

    // create convert document direct request
    let request = new groupdocs_conversion_cloud.ConvertDocumentDirectRequest(
      "docx",
      file
    );

    // convert document directly
    let result = await convertApi.convertDocumentDirect(request);

    // save file in working dorectory

    fs.writeFileSync(outputFilepath, result, "binary", function (err) {});

    res.download(outputFilepath, (err) => {
      if (err) {
        fs.unlinkSync(req.file.path);
        fs.unlinkSync(outputFilepath);
        res.send("some internal error has occured", { err });
      }
    });
  }
});
