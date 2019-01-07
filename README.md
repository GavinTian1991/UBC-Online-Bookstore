# UBC-Online-Bookstore
This is the UBC CPEN400A 'Web Application' course project.
Tha project aim is going to build an online store where we can list different items that can be sold online, browse all the available products, check out availability, add and remove from the shopping chart, filter listing products by price range and catergory. The project just focus on function realization but not on aesthetic aspect.

Environments:  
Coding with ‘Atom’  
Install Node.js and MongoDB  

Operations:  
run ‘node index.js’ in CMD to start server  
http://localhost:3000/ in broswer to visit bookstore front-page  

Structures:   
Built Front-end page with pure Javascript, HTML and CSS (public folder)  
Built Back-end server with Node.js(Express.js) and MongoDB (index.js, StoreDB.js, initdb.mongo)  
  
Functions:  
1. Choose shown products with left catergory menu bar    
2. Limit price range with ‘Min Price’ and ‘Max Price’ box   
3. Show price, ‘Add to Chart’ and ‘Remove from Chart’ button (only shown when the products in the chart) when mouse hover the product images    
4. Show current shopping cart products and also could add and remove products with button ‘show cart’      
5. Update shopping cart information (return to 0) and product stocks in MongoDB with ‘Check Out’ button in shopping cart dialog window   
6. Show AJAX success or error status message in alert window      

Bookstore Front-page:  

![image](https://github.com/GavinTian1991/UBC-Online-Bookstore/raw/master/public/images/bookstorefrontpage.JPG)


