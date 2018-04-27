const express = require('express')
const fs = require('fs')
const path = require('path')
const PORT = process.env.PORT || 5000
const bodyParser = require('body-parser')
const app = express();
const metaDirectory = __dirname + '/public/TestTraffic';
const gameIndexPath = path.join(__dirname + '/views/Client/website/game.html')

app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
})); 

app.use(express.static(path.join(__dirname, 'public')))
app.use(express.static(path.join(__dirname, 'public/TestTraffic')))
app.use(express.static(path.join(__dirname, 'views/Client/website')))
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')
app.get('/', (req, res) => res.sendFile(gameIndexPath))


app.post('/metaFromUnity', function(req, res) {
   
    switch(req.body.command){
    	case 'init':
    		{   /* delte whole files in test directory */
    			console.log("[Initialize]")
    			fs.readdir(metaDirectory, (err, files) => {
				  if (err) throw err;

				  for (const file of files) {
				  	console.log(file)
				  	if(file != "consit"){
				  		fs.unlink(path.join(metaDirectory, file), err => {
					      if (err) throw err;
					    });
				  	}
				  }
				});
    		}
    		break;

    	case 'update':
    		
    		var writer = fs.createWriteStream(metaDirectory + '/test' + req.body.frameInfo + '.txt');
    		writer.write(req.body.cachedMeta);
    		console.log("[Write meta file]" + req.body.frameInfo)
    		break;
    }
    
});


app.listen(PORT, () => console.log(`Listening on ${ PORT }`))
