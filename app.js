require("dotenv").config();
const express = require('express');
const path = require("path");
const app = express();
const db = require("./config/mongoose-connection");
const cropModel = require("./models/crop");
const dealModel = require("./models/deal");
const userModel = require("./models/user");
const session = require("express-session")

db();

const PORT = process.env.PORT || 3000;
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));
app.use(session({
    secret: "krishiq-secret",
    resave: false,
    saveUninitialized: true
}));


app.get("/", (req, res) => {
    res.render("index");
});

app.get("/addcrop", (req, res) => {
    res.render("addcrop");
});

app.post("/addcrop", async(req, res) => {
    const { cropName, quantity, price } = req.body;

    await cropModel.create({
        cropName,
        quantity,
        price
    });

    res.redirect("/mylistings");
});


app.get("/editcrop/:id", async(req, res) => {
    const crop = await cropModel.findById(req.params.id);

    if (!crop) {
        return res.send("Crop not found ❌");
    }

    res.render("editcrop", { crop });
});

app.post("/editcrop/:id", async(req, res) => {
    try {
        const { cropName, quantity, price } = req.body;

        await cropModel.findByIdAndUpdate(req.params.id, {
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



app.post("/delete/:id", async(req, res) => {
    try {
        await cropModel.findByIdAndDelete(req.params.id);
        res.redirect("/mylistings");
    } catch (err) {
        res.send("Error in deleting crop: ", err);
    }
})

app.get("/marketplace", async(req, res) => {
    const crops = await cropModel.find();
    res.render("marketplace", { crops });
});

app.get("/cropdetails/:id", async(req, res) => {

    const crop = await cropModel.findById(req.params.id);
    if (!crop) {
        return res.send("Crop not found");
    }
    res.render("cropdetailwithdeal", { crop });

});



app.get("/mylistings", async(req, res) => {
    const crops = await cropModel.find();
    res.render("myListings", { crops })
});

app.get("/makedeal/:cropId", async(req, res) => {
    const crop = await cropModel.findById(req.params.cropId);
    res.render("makedeal", { cropId: req.params.cropId, crop })
});




app.get("/buyerdeals", async(req, res) => {
    const farmerId = "demoFarmer";
    const buyerId = "demoBuyer"
    const deals = await dealModel.find({ buyerId }).populate("cropId");

    res.render("buyerdeals", { deals });
})

app.get("/farmerdeals", async(req, res) => {
    const farmerId = "demoFarmer";

    const deals = await dealModel.find({ farmerId }).populate("cropId");

    res.render("farmerdeals", { deals });
})




app.post("/deal/:cropId", async(req, res) => {
    try {
        const { offeredPrice, quantity } = req.body;
        const cropData = await cropModel.findById(req.params.cropId);

        await dealModel.create({
            cropId: cropData._id,
            offeredPrice,
            quantity,
            farmerId: cropData.farmerId,
            buyerId: "demoBuyer",
            status: "pending"
        })
        res.redirect("/buyerdeals");
        console.log("PRICE:", offeredPrice); // 🔥 ADD THIS
    } catch (err) {
        console.log(err);
        res.send("Error creating deal", err);
    }
});

app.post("/deal/direct/:cropId", async(req, res) => {
    try {
        const cropData = await cropModel.findById(req.params.cropId);

        await dealModel.create({
            cropId: cropData._id,
            farmerId: cropData.farmerId,
            buyerId: "demoBuyer",
            offeredPrice: cropData.price,
            quantity: cropData.quantity,

            status: "pending"
        });

        res.redirect("/buyerdeals");

    } catch (err) {
        console.log(err);
        res.send("Error creating deal");
    }
});

app.post("/deal/accept/:id", async(req, res) => {
    await dealModel.findByIdAndUpdate(req.params.id, { status: "accepted" });
    res.redirect("/farmerdeals")
});

app.post("/deal/reject/:id", async(req, res) => {
    await dealModel.findByIdAndUpdate(req.params.id, { status: "rejected" });
    res.redirect("/farmerdeals")
});

app.post("/deletebuyerdeal/:id", async(req, res) => {
    try {
        await dealModel.findByIdAndDelete(req.params.id);
        res.redirect("/buyerdeals");
    } catch (err) {
        res.send("Error in deleting deal: ", err);
    };
})



app.get("/signup", (req, res) => {
    res.render("signup");
})

app.get("/login", (req, res) => {
    res.render("login");
})

app.post("/signup", async(req, res, next) => {
    const { username, email, password, role, location, contact } = req.body;

    const user = await userModel.create({
        username,
        email,
        password,
        role,
        location,
        contact
    });

    req.session.userId = user._id,
    req.session.role = user.role,

    if(user.role === farmer){
        return res.redirect("/mylistings")
    }else {
        res.redirect("/marketplace")
    }
});

app.post("/login", async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email, password });

    if (!user) {
        return res.send("Invalid credentials");
    }

    req.session.userId = user._id;
    req.session.role = user.role;

    res.redirect("/marketplace");
});

app.get("/logout", (req, res) => {
    req.session.destroy();
    res.redirect("/login");
});







app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});