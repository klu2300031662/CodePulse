const https = require('https');
const fs = require('fs');

const file = fs.createWriteStream("backend.zip");
const url = "https://start.spring.io/starter.zip?type=maven-project&language=java&bootVersion=3.3.0&baseDir=backend&groupId=com.codepulse&artifactId=backend&name=backend&description=CodePulse+Backend&packageName=com.codepulse.backend&packaging=jar&javaVersion=17&dependencies=web,data-jpa,security,postgresql,validation,lombok,devtools";

https.get(url, function(response) {
  response.pipe(file);
  file.on('finish', function() {
    file.close();  
    console.log("Downloaded successfully");
  });
}).on('error', function(err) {
  fs.unlink("backend.zip");
  console.error("Error: ", err.message);
});
