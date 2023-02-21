let HTTP_PORT = process.env.PORT || 8080;


const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.set("strictQuery", false);
mongoose.connect("mongodb+srv://admin-yuts:test123@cluster0.unsqrhq.mongodb.net/todolistDB");


// define model based on schema
const itemsSchema = {
  name: String
};

//create default list items
const Item = mongoose.model("item", itemsSchema);

const Item1 = new Item ({
  name: "Smile"
});

const Item2 = new Item ({
  name: "walk"
});

const Item3 = new Item ({
  name: "live"
});

//schema for custom lists
const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("list", listSchema);
const defaultItems = [Item1, Item2, Item3];


app.get("/", function(req, res) {

  Item.find({}, function(err, foundItems){

    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, function(err){

        if(err){
          console.log(err);
        }
        else{
          console.log("All items successfully added to database");
        }
      });
      res.redirect("/");

    }else{
      res.render("list", {listTitle: "Today", newListItems: foundItems});
    }
  });

});

app.get("/:customListName", function(req,res){
  
  const customListName = _.capitalize(req.params.customListName);
 
  if(customListName =="Favicon.ico") return;
  // console.log(customListName);

  List.findOne({name: customListName}, function(err, foundList){
   
    if(!err){
     
      if(!foundList){
       //create new list
       const list = new List({
         name: customListName,
         items: defaultItems
       });

       list.save(function(){
        res.redirect("/" + customListName);
       });

      } else{
       //show existing list
       res.render("list", { listTitle: foundList.name, newListItems: foundList.items});
     }
   }
 })
 
 });


app.post("/delete", function(req, res){
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  console.log("checkedItemId: " + checkedItemId);

  if(listName === "Today"){
    Item.findByIdAndRemove(checkedItemId, function(err){
    
      if (err){
        console.log(err);
      }else{
        console.log("200");
        res.redirect("/");
      }

    })
  }else{
    List.findOne({name: listName}, function(err, foundList){
      foundList.items.pull({_id: checkedItemId});
      foundList.save(function(){
        res.redirect("/" + listName);
      });
    });
  }
  

});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if(listName === "Today"){
    item.save();
    res.redirect("/");
  }else{
    List.findOne({name: listName}, function(err, foundList){
      foundList.items.push(item);

      foundList.save(function(){
        res.redirect("/" + listName);
      });
    });
  }
  // item.save();
  // res.redirect("/");
 
});

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
