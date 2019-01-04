


var MongoClient = require('mongodb').MongoClient;	// require the mongodb driver

/**
 * Uses mongodb v3.1.9 - [API Documentation](http://mongodb.github.io/node-mongodb-native/3.1/api/)
 * StoreDB wraps a mongoDB connection to provide a higher-level abstraction layer
 * for manipulating the objects in our bookstore app.
 */
function StoreDB(mongoUrl, dbName){
	if (!(this instanceof StoreDB)) return new StoreDB(mongoUrl, dbName);

	this.connected = new Promise(function(resolve, reject){
		MongoClient.connect(
			mongoUrl,
			{
				useNewUrlParser: true
			},

			function(err, client){
				if (err) reject(err);
				else {
					console.log('[MongoClient] Connected to '+mongoUrl+'/'+dbName);
					resolve(client.db(dbName));
				}
			}
		)
	});
}

StoreDB.prototype.getProducts = function(queryParams){
	return this.connected.then(function(db){

		let getPromise = new Promise(function(resolve,reject){
        var queryString = JSON.stringify(queryParams);
        //console.log(queryString);
        var query = {};

        if ('category' in queryParams){
            query.category = queryParams.category;
        }
        if ('minPrice' in queryParams && 'maxPrice' in queryParams){
            query.price = {$gte: parseInt(queryParams.minPrice), $lte: parseInt(queryParams.maxPrice)};
        }
        else if ('minPrice' in queryParams){
            query.price = {$gte: parseInt(queryParams.minPrice)};
        }
        else if ('maxPrice' in queryParams){
            query.price = {$lte: parseInt(queryParams.maxPrice)};
        }

			db.collection('products').find(query).toArray(function(err, result){
				if(err) reject(err);
				else{
						resolve(result);
				}
			});
		});
		return getPromise;
	})
}

StoreDB.prototype.addOrder = function(order){
	return this.connected.then(function(db){
		// TODO: Implement functionality

		let orderPromise = new Promise(function(resolve,reject){
			db.collection('orders').insertOne(order,function(err,result){
				if(err) reject(err);
				else{
					console.log('Insert success!');
					let returnId = result.ops[0]._id;  //document ObjectId

					//update quantity
					for(let item in order.cart){
						db.collection('products').find({_id:item}).toArray(function(err, result){
							if(err) console.log('Can not find the item in database!');
							else{
								let newQuantity = result[0].quantity - order.cart[item];
								db.collection('products').updateOne({_id:item},{$set: {quantity:newQuantity}});  //effect!
							}
						});
					}
					resolve(returnId);
				}
			});
		});
		return orderPromise;
	})
}


module.exports = StoreDB;
