const express = require('express');
const path = require("path");
const app = express();

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

app.post("/addcrop", (req, res) => {
    const { cropName, quantity, price} = req.body;

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

