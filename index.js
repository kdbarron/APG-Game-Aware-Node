const express = require('express')
const fs = require('fs')
const path = require('path')
const PORT = process.env.PORT || 5000
const bodyParser = require('body-parser')
const app = express();
const metaDirectory = 'TestTraffic';

app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
})); 

app.use(express.static(path.join(__dirname, 'public')))
app.use(express.static(path.join(__dirname, 'views/Client/website')))
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')
app.get('/', (req, res) => res.sendFile( path.join(__dirname + '/views/Client/website/game.html')))


app.post('/metaFromUnity', function(req, res) {
   
    switch(req.body.command){
    	case 'init':
    		{   /* delte whole files in test directory */
    			fs.readdir(metaDirectory, (err, files) => {
				  if (err) throw err;

				  for (const file of files) {
				    fs.unlink(path.join(directory, file), err => {
				      if (err) throw err;
				    });
				  }
				});
    		}
    		break;

    	case 'update':
    		var writer = fs.createWriteStream('TestTraffic/test' + req.body.frameInfo + '.txt');
    		writer.write(req.body.cachedMeta);
    		break;
    }
    
});


app.listen(PORT, () => console.log(`Listening on ${ PORT }`))
