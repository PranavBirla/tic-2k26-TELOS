require("dotenv").config();
const express = require('express');
const path = require("path");
const app = express();
const db = require("./config/mongoose-connection");
const cropModel = require("./models/crop");
const crop = require("./models/crop");

db();

const PORT = process.env.PORT || 3000;
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));


app.get("/", (req, res) => {
    res.render("index");
});

app.get("/addcrop", (req, res) => {
    res.render("addcrop");
});

app.get("/addcrop2", (req, res) => {
    res.render("addcroptest2");
});

app.post("/addcrop", async (req, res) => {
    const { cropName, quantity, price} = req.body;

        await crop.create({
            cropName,
            quantity,
            price
        });


    console.log( "cropName: ", cropName );
    console.log( "quantity: ", quantity );
    console.log( "price: ", price );
});



app.get("/mylistings", (req, res) => {
    res.render("mylistings");
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

