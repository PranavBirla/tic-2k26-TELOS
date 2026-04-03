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
app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));


app.get("/", (req, res) => {
    res.render("index");
});

app.get("/addcrop", (req, res) => {
    res.render("addcroptest2");
});

app.post("/addcrop", async (req, res) => {
    const { cropName, quantity, price } = req.body;

    await crop.create({
        cropName,
        quantity,
        price
    });


    console.log("cropName: ", cropName);
    console.log("quantity: ", quantity);
    console.log("price: ", price);

    res.redirect("/mylistings");
});


app.get("/editcrop/:id", async (req, res) => {
    const crop = await cropModel.findById(req.params.id);

    if (!crop) {
        return res.send("Crop not found ❌");
    }

    res.render("editcrop", { crop });
});

app.post("/editcrop/:id", async (req, res) => {
    try {
        const { cropName, quantity, price } = req.body;

        await crop.findByIdAndUpdate(req.params.id, {
            cropName,
            quantity,
            price
        });

        res.redirect("/mylistings");

    } catch (err) {
        console.log(err);
        res.send("Error updating crop");
    }
});



app.post("/delete/:id", async (req, res) => {
    try{
        await crop.findByIdAndDelete(req.params.id);
        res.redirect("/mylistings");
    }catch (err) {
        res.send("Error in deleting crop: ", err);
    }
})

app.get("/marketplace", (req, res) => {
    res.render("marketplace");
});

app.get("/cropdetails", (req, res) => {
    res.render("cropdetails");
});


app.get("/mylistings", async (req, res) => {
    const crops = await crop.find();
    res.render("myListings", { crops })
});











app.get("signup", (req, res) => {
    res.render("signup");
})

app.get("/login", (req, res) => {
    res.render("login");
})

app.post("/signup", async (req, res, next) => {

})






app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

