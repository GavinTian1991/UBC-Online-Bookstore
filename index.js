// Require dependencies
var path = require('path');
var express = require('express');
var storedb = require('./StoreDB.js');


// Declare application parameters
var PORT = process.env.PORT || 3000;
var STATIC_ROOT = path.resolve(__dirname, './public');

// Defining CORS middleware to enable CORS.
// (should really be using "express-cors",
// but this function is provided to show what is really going on when we say "we enable CORS")
function cors(req, res, next){
    res.header("Access-Control-Allow-Origin", "*");
  	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  	res.header("Access-Control-Allow-Methods", "GET,POST,DELETE,OPTIONS,PUT");
  	next();
}

// Instantiate an express.js application
var app = express();



// Configure the app to use a bunch of middlewares
app.use(express.json());							// handles JSON payload
app.use(express.urlencoded({ extended : true }));	// handles URL encoded payload
app.use(cors);										// Enable CORS

app.use('/', express.static(STATIC_ROOT));			// Serve STATIC_ROOT at URL "/" as a static resource

var db = new storedb('mongodb://localhost:27017/','cpen400a-bookstore');

app.get('/products', function(request, response) {
  var getPromise = db.getProducts(request.query);
  var localResponse = response;
  getPromise.then(function(value){
    let productsResponse = {};
    for(let i = 0 ; i < value.length;i++){
      let itemName = value[i]._id;
      let item = {label: value[i].label, imageUrl:value[i].imageUrl,
        price: value[i].price,quantity:value[i].quantity};
      productsResponse[itemName] = item;
    }
    localResponse.send(JSON.stringify(productsResponse));
  },function(err){
    localResponse.status(500).send('getProducts error!');
  });
});


function typeCheck(localOrder){

    let check = true;

    for(let item in localOrder){
      if(item =='client_id'){
          if(typeof(localOrder[item])!='string'){
            check = false;
          }
      }
      else if(item == 'cart'){
        if(typeof(localOrder[item])!='object'){
          check = false;
        }
      }
      else if(item == 'total'){
        if(typeof(localOrder[item])!='number'){
          check = false;
        }
      }
      else{
          check = false;
      }
  }
  return check;
}

app.post('/checkout', function(request, response) {

 let localCheck = typeCheck(request.body);

 if(!localCheck){
   response.status(500).send('addOrder type error!');
 }
 else if(JSON.stringify(request.body['cart'])=='{}'){
   response.status(500).send('Cart is empty!');
 }
 else{
   var orderPromise = db.addOrder(request.body);
   var localResponse = response;
   orderPromise.then(function(value){
      let objectId = {'ObjectId':value};
      localResponse.send(JSON.stringify(objectId));
   },function(err){
     localResponse.status(500).send('addOrder error!');
   });
 }
});



// Start listening on TCP port
app.listen(PORT, function(){
    console.log("server started");
    //console.log('Express.js server started, listening on PORT '+PORT);
});
