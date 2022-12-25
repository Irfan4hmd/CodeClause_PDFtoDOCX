
const express=require('express');
const path=require('path');
const app=express();
const cors=require('cors')
const libre= require('libreoffice-convert')
const hostname = '127.0.0.1';
const multer = require('multer');
const { title } = require('process');
const serverless = require('serverless-http');
const router = express.Router();
const { PDFNet } = require('@pdftron/pdfnet-node');
const fs =require('fs')
const groupdocs_conversion_cloud=require('groupdocs-conversion-cloud')
global.clientId = "f2ba749b-ffc6-467f-99ef-875a15320e9b";
global.clientSecret = "b9c32507d26ff8c4992181b359c6f18c";


const config = new groupdocs_conversion_cloud.Configuration(clientId, clientSecret);
config.apiBaseUrl = "https://api.groupdocs.cloud";
app.set('view engine', 'ejs');
const port = 4000;

process.on('uncaughtException',err=>{
  console.log(`Error:${err.stack}`);
 console.log('Shutting down server due to uncaught exceptions');
 process.exit(1); 
})

app.use(cors({ origin: true }));

const server = app.listen(process.env.PORT || 4000,  () => {
  console.log(`Server is running at http://${hostname}:${port}/`);
  
});
process.on('unhandledRejection',err=>{
  console.log(`Error:${err.message}`);
  console.log("shutting down the server due to unhandled promise rejections")
  server.close(()=>{
    process.exit(1);
  })
})

const pdftodocxdemo = function(re,file,callback){
  var ext = path.extname(file.originalname);
  if(
    ext !==".pdf"
  ){
    return callback("This extention is not supported")

  }
  callback(null,true);
};
app.use(express.static(__dirname));
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, __dirname);
  },
  filename: function(req, file, cb) {
    cb(null, Date.now() + file.originalname);
  }
});
const pdftodocxupload= multer({
  storage: storage,
  filterFilter: pdftodocxdemo
})

  app.get('/', (req, res)=>{
    res.render('pdftodocx',{title:"pdf to docx"})
   });

app.post('/',pdftodocxupload.single('file'),async(req,res)=>{
  
  if(req.file){
    console.log(req.file.path);
    outputFilepath= Date.now() + "output.docx"
    
fs.readFile(req.file.path, (err, fileStream) => {
  // construct FileApi
  var fileApi = groupdocs_conversion_cloud.FileApi.fromConfig(config);
  // create upload file request
  var request = new groupdocs_conversion_cloud.UploadFileRequest("sample.pdf", fileStream);
  // upload file
  fileApi.uploadFile(request);
});
let convertApi = groupdocs_conversion_cloud.ConvertApi.fromKeys(clientId, clientSecret);

// define convert settings
let settings = new groupdocs_conversion_cloud.ConvertSettings();
settings.filePath = "sample.pdf"; // input file path on the cloud
settings.format = "docx";         // output format
settings.outputPath = "output";   // output file folder on the cloud

// create convert document request
let request = new groupdocs_conversion_cloud.ConvertDocumentRequest(settings);

// convert document
let result = await convertApi.convertDocument(request);
console.log("Document converted successfully: " + result[0].url);
// construct FileApi
var fileApi = groupdocs_conversion_cloud.FileApi.fromConfig(config);

// create download file request
let reque = new groupdocs_conversion_cloud.DownloadFileRequest("output/sample.docx");

// download file
let response = await fileApi.downloadFile(reque);

// save file in your working directory
fs.writeFileSync(outputFilepath, response, "binary", function (err) { });
console.log(response);
res.download(outputFilepath,(err)=>{
  if(err){
  fs.unlinkSync(req.file.path);
  fs.unlinkSync(outputFilepath);
  res.send('some internal error has occured',{err})
  }
  
}
)

  }
})
