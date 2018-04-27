const express = require('express')
const path = require('path')
const PORT = process.env.PORT || 5000

var bodyParser = require('body-parser')


var app = express();

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
    /*
    var name = req.body.name,
        color = req.body.color;
    // ...
    */
    console.log(req.body);
});


app.listen(PORT, () => console.log(`Listening on ${ PORT }`))
