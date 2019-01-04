


function Store(serverUrl) {
  this.serverUrl = serverUrl;
  this.stock = {};
  this.cart = {};
  this.onUpdate = null;
}

let store = new Store('http://localhost:3000');
let inactiveTime = 0;

function showCart(cart) {
    let modal = document.getElementById("modal");
    modal.style.display = "block";

    let modalContent = document.getElementById("modal-content");
    renderCart(modalContent, store);
}

Store.prototype.addItemToCart = function(itemName) {

  // if (!(itemName in this.stock))
  //   this.stock[itemName].quantity = 5;

  if (this.stock[itemName].quantity < 1)
    alert("there are no more of this item in stock");
  else {
    this.stock[itemName].quantity -= 1;
    if (!(itemName in this.cart))
      this.cart[itemName] = 1;
    else
      this.cart[itemName] += 1;
  }
  this.onUpdate(itemName);
  resetTimer();
};

Store.prototype.removeItemFromCart = function(itemName) {
  if (itemName in this.cart) {
    this.stock[itemName].quantity += 1;
    if (this.cart[itemName] === 1)
      delete this.cart[itemName];
    else
      this.cart[itemName] -= 1;
  }
  this.onUpdate(itemName);
  resetTimer();
};

store.onUpdate = function(itemName){

  if(itemName==null){
    var pView = document.getElementById('productView');
    renderProductList(pView, store);
  }
  else{
    let productUpdate = document.getElementById(itemName);
    renderProduct(productUpdate,store,itemName);
  }
  let modalContent = document.getElementById("modal-content");
  renderCart(modalContent, store);

  let menuContent = document.getElementById("menuView");
  renderMenu(menuContent,store);
}


var displayed = [];
var delta = {};
var preProductsList = {};

function deltaCalculation(response){

  delta = {};
  preProductsList = {};

  for (var item in response) {
    if (item in store.stock) {
      delta[item] = {};
      delta[item].price = response[item].price - store.stock[item].price;
      delta[item].quantity = response[item].quantity - store.stock[item].quantity;
      preProductsList[item] = store.stock[item];
    }
  }
}

function stockUpdate(response){

   store.stock = response;

   for(var item in store.cart){
     if(item in store.stock){
       if(store.stock[item].quantity < store.cart[item]){
         store.cart[item] = store.stock[item].quantity;
         store.stock[item].quantity = 0;
       }
       else{
         store.stock[item].quantity -= store.cart[item];
       }
     }
   }
   renderCart(document.getElementById("modal-content"), store);
   store.onUpdate();
}

var ajaxGet = function(url, onSuccess, onError, numberOfRetries){

  var newResquest = new XMLHttpRequest();
  newResquest.open('GET',url,true);
  newResquest.timeout = 2000;
  newResquest.onload = function(){
    if(this.readyState == 4 && this.status == 200)
    {
      var productlist = JSON.parse(newResquest.responseText);
      onSuccess(productlist);
    }
    else{
        if(numberOfRetries < 3){
          numberOfRetries += 1;
          ajaxGet(url, onSuccess, onError, numberOfRetries);
        }
        else{
          onError(newResquest.status);
        }
       }
  }

  newResquest.ontimeout = function (e) {
    if(numberOfRetries < 3){
      numberOfRetries += 1;
      ajaxGet(url, onSuccess, onError, numberOfRetries);
    }
    else{
      onError(newResquest.status);
    }
  };
  newResquest.send();
}

var ajaxPost = function(url, data, onSuccess, onError){

  var postResquest = new XMLHttpRequest();
  postResquest.open('POST',url,true);
  postResquest.setRequestHeader('Content-Type','application/json;charset=UTF-8');


  postResquest.onload = function(){
    if(postResquest.status == 200){
      var postResponse = JSON.parse(postResquest.responseText);
      onSuccess(postResponse);
    }
    else{
      onError(postResquest)
    }
  };

  // postResquest.onreadystatechange = function(){
  //   var state = postResquest.readyState;
  //
  //   if(postResquest.readyState == 4){
  //     if(postResquest.status == 200){
  //       var postResponse = JSON.parse(postResquest.responseText);
  //       onSuccess(postResponse);
  //     }
  //     else{
  //       onError(postResquest)
  //     }
  //   }
  // };


  postResquest.send(JSON.stringify(data));
}


function displayedUpdate(delta){
    displayed = Object.keys(delta);
    renderProductList(document.getElementById('productView'), store);
}


Store.prototype.syncWithServer = function(onSync){

  let productListURL = store.serverUrl + '/products';

  let onSuccessHandler = function(productResponse){
        deltaCalculation(productResponse);
        stockUpdate(productResponse);
        if(onSync){
            onSync(delta);
        }
  };

  let onErrorhandler = function (error) {
    console.log("Response error with server : "  + error);
  };

  ajaxGet(productListURL, onSuccessHandler, onErrorhandler, 1);

}

function deltaAlert(delta){

    let change = false;
    let alertString = "";

    for (let item in delta){
      if(delta[item].price != 0){
        let prePrice = store.stock[item].price - delta[item].price;
        let posPrice = store.stock[item].price;
        alertString += "Price of " + item + " changed from " + "$" + prePrice + " to " + "$" + posPrice + "\n";
        change = true;
      }
      if(delta[item].quantity != 0){
            let preQuantity = preProductsList[item].quantity;
            let posQuantity = store.stock[item].quantity;
            alertString += "Quantity of " + item + " changed from " + preQuantity + " to " + posQuantity + "\n";
            change = true;
      }
      alertString += "\n";
    }


    let totalPrice = 0;
    for (let item in store.cart){
        totalPrice += store.stock[item].price * store.cart[item];
    }

    document.getElementById("btn-check-out").disabled = false;

    var postOrder = {
      "client_id": (Math.floor((Math.random() * 1000) + 1)).toString(),  //number or string?
      "cart": store.cart,
      "total": totalPrice
    }


    ajaxPost("http://localhost:3000/checkout",postOrder,
      function(response){
          alert('Items were successfully checked out');
          store.cart = {};
          store.onUpdate();
      },
      function(error){
          alert('Ajax post error : ' + error.status + ' ' + error.responseText);
      }
    );
}

Store.prototype.checkOut = function(onFinish){
    store.syncWithServer(deltaAlert);
    if (onFinish)
        onFinish();
}

var checkOutHandler = function(){

  document.getElementById("btn-check-out").disabled=true;
  store.checkOut();

}

window.onload = function() {

  store.syncWithServer(displayedUpdate);

  document.getElementById("btn-check-out").addEventListener("click",checkOutHandler);
  document.getElementById("btn-hide-cart").addEventListener("click",hideCart);

  document.onkeydown = function(evt) {
    evt = evt || window.event;
    if (evt.keyCode == 27) {
        hideCart();
    }
  };

  setInterval(function() {
    if (inactiveTime < 300000)
      inactiveTime += 1;
    else {
      alert("Hey there! Are you still planning to buy something?");
      resetTimer();
    }
  }, 1000);
};


Store.prototype.queryProducts = function(query, callback){
	var self = this;
	var queryString = Object.keys(query).reduce(function(acc, key){
			return acc + (query[key] ? ((acc ? '&':'') + key + '=' + query[key]) : '');
		}, '');
	ajaxGet(this.serverUrl+"/products?"+queryString,
		function(products){
			Object.keys(products)
				.forEach(function(itemName){
					var rem = products[itemName].quantity - (self.cart[itemName] || 0);
					if (rem >= 0){
						self.stock[itemName].quantity = rem;
					}
					else {
						self.stock[itemName].quantity = 0;
						self.cart[itemName] = products[itemName].quantity;
						if (self.cart[itemName] === 0) delete self.cart[itemName];
					}

					self.stock[itemName] = Object.assign(self.stock[itemName], {
						price: products[itemName].price,
						label: products[itemName].label,
						imageUrl: products[itemName].imageUrl
					});
				});
			self.onUpdate();
			callback(null, products);
		},
		function(error){
			callback(error);
		}
	)
}


function renderMenu(container, storeInstance){
	while (container.lastChild) container.removeChild(container.lastChild);
	if (!container._filters) {
		container._filters = {
			minPrice: null,
			maxPrice: null,
			category: ''
		};
		container._refresh = function(){
			storeInstance.queryProducts(container._filters, function(err, products){
					if (err){
						alert('Error occurred trying to query products');
						console.log(err);
					}
					else {
						displayed = Object.keys(products);
						renderProductList(document.getElementById('productView'), storeInstance);
					}
				});
		}
	}

	var box = document.createElement('div'); container.appendChild(box);
		box.id = 'price-filter';
		var input = document.createElement('input'); box.appendChild(input);
			input.type = 'number';
			input.value = container._filters.minPrice;
			input.min = 0;
			input.placeholder = 'Min Price';
			input.addEventListener('blur', function(event){
				container._filters.minPrice = event.target.value;
				container._refresh();
			});

		input = document.createElement('input'); box.appendChild(input);
			input.type = 'number';
			input.value = container._filters.maxPrice;
			input.min = 0;
			input.placeholder = 'Max Price';
			input.addEventListener('blur', function(event){
				container._filters.maxPrice = event.target.value;
				container._refresh();
			});

	var list = document.createElement('ul'); container.appendChild(list);
		list.id = 'menu';
		var listItem = document.createElement('li'); list.appendChild(listItem);
			listItem.className = 'menuItem' + (container._filters.category === '' ? ' active': '');
			listItem.appendChild(document.createTextNode('All Items'));
			listItem.addEventListener('click', function(event){
				container._filters.category = '';
				container._refresh()
			});
	var CATEGORIES = [ 'Clothing', 'Technology', 'Office', 'Outdoor' ];
	for (var i in CATEGORIES){
		var listItem = document.createElement('li'); list.appendChild(listItem);
			listItem.className = 'menuItem' + (container._filters.category === CATEGORIES[i] ? ' active': '');
			listItem.appendChild(document.createTextNode(CATEGORIES[i]));
			listItem.addEventListener('click', (function(i){
				return function(event){
					container._filters.category = CATEGORIES[i];
					container._refresh();
				}
			})(i));
	}
}





function resetTimer() {
  inactiveTime = 0;
}

function renderProduct(container, storeInstance, itemName) {

  removeAllChildNodes(container);

  if(storeInstance.stock[itemName].quantity > 0){
    var butAdd = document.createElement('button');
    butAdd.className = 'btn-add';
    butAdd.onclick = function() {
      storeInstance.addItemToCart(itemName);
    };
    butAdd.textContent = 'Add to Cart';
  }

   if(storeInstance.cart[itemName]){
    var butRemove = document.createElement('button');
    butRemove.className = 'btn-remove';
    butRemove.onclick = function() {
      storeInstance.removeItemFromCart(itemName);
    };
    butRemove.textContent = 'Remove from Cart';
   }

  var img = document.createElement('img');
  img.src = storeInstance.stock[itemName].imageUrl;
  img.width = 150;
  img.height = 150;

  var div = document.createElement('div');
  div.textContent = '$' + storeInstance.stock[itemName].price;



  var br = document.createElement('br');
  var text = document.createTextNode(itemName);


  if(storeInstance.stock[itemName].quantity > 0){
    container.appendChild(butAdd);
  }
  if(storeInstance.cart[itemName]){
    container.appendChild(butRemove);
  }
  container.appendChild(img);
  container.appendChild(div);
  container.appendChild(br);
  container.appendChild(text);


}

function renderProductList(container, storeInstance) {

  removeAllChildNodes(container);

  let ul = document.createElement('ul');
  ul.id = 'productList';

  for(var i = 0; i < displayed.length;i++){

     var li = document.createElement('li');
     li.className = 'product';
     li.id = displayed[i];

     renderProduct(li, storeInstance, displayed[i]);
     ul.appendChild(li);
   }

   container.appendChild(ul);

}









function renderCart(container, storeInstance){
    removeAllChildNodes(container);

    let table = document.createElement("table");

    addTableHeader(table);

    for (var itemName in storeInstance.cart){
        let tableRow = createTableRow(storeInstance, itemName, storeInstance.cart[itemName] , storeInstance.stock[itemName].price)
        table.appendChild(tableRow);
    }

    table.setAttribute("class", "border_class");
    container.appendChild(table);

}

function removeAllChildNodes(container){
    while (container.firstChild) {
        container.firstChild.remove();
    }
}

function addTableHeader(table){
    let headerRow = document.createElement("tr");

    headerRow.appendChild(createHeaderCell("Item"));
    headerRow.appendChild(createHeaderCell("Quantity"));
    headerRow.appendChild(createHeaderCell("Total Price"));
    headerRow.appendChild(createHeaderCell("Add Item"));
    headerRow.appendChild(createHeaderCell("Remove Item"));

    table.appendChild(headerRow);
}

function createHeaderCell(name){
    let headerCell = document.createElement("th");
    let cellText = document.createTextNode(name);
    headerCell.appendChild(cellText);
    headerCell.setAttribute("class", "border_class");
    return headerCell;
}

function createTableRow(storeInstance, itemName, quantity, unitPrice){
    let row = document.createElement("tr");

    row.appendChild(createTableCell(itemName));
    row.appendChild(createTableCell(quantity));
    row.appendChild(createTableCell(unitPrice * quantity));
    row.appendChild(createAddButtonCell(storeInstance, itemName));  //TODO: buttons must be dynamic?
    row.appendChild(createRemoveButtonCell(storeInstance, itemName));

    return row;
}

function createTableCell(child){
    let tableCell = document.createElement("td");
    let tableCellText = document.createTextNode(child);
    tableCell.appendChild(tableCellText);
    tableCell.setAttribute("class", "border_class");
    return tableCell;
}

function createAddButtonCell(storeInstance, itemName){
    var tableCell = document.createElement("td");
    var buttonAdd = document.createElement('button');
    buttonAdd.onclick = function() {
      storeInstance.addItemToCart(itemName);
    };
    buttonAdd.textContent = '+';
    tableCell.appendChild(buttonAdd);
    return tableCell;
}

function createRemoveButtonCell(storeInstance, itemName){
    var tableCell = document.createElement("td");
    var buttonRemove = document.createElement('button');
    buttonRemove.onclick = function() {
      storeInstance.removeItemFromCart(itemName);
    };
    buttonRemove.textContent = '-';
    tableCell.appendChild(buttonRemove);
    return tableCell;
}

var hideCart = function(){
    let modal = document.getElementById("modal");
    modal.style.display = "none";
}
