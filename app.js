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


const axios = require("axios");

app.post("/predict-price", async (req, res) => {
    const { cropName } = req.body;

    try {
        const response = await axios.post("http://ml-api-production-fe68.up.railway.app", {
            crop_name: cropName,
            lat: 23.2599,
            lon: 77.4126
        });

        res.json(response.data);
           // 🔥 IMPORTANT (NOT render)

    } catch (err) {
        console.log(err.response?.data || err.message);

        res.status(500).json({
            error: err.response?.data?.detail || "ML error"
        });
    }
});



app.get("/", (req, res) => {
    res.render("index");
});

app.get("/addcrop", isLoggedIn, isFarmer, (req, res) => {
    res.render("addcrop");
});

app.post("/addcrop", isLoggedIn, isFarmer, async(req, res) => {
    const { cropName, quantity, price, farmerId } = req.body;

    await cropModel.create({
        cropName,
        quantity,
        price,
        farmerId: req.session.userId
    });

    res.redirect("/mylistings");
});


app.get("/editcrop/:id", isLoggedIn, isFarmer, async(req, res) => {
    const crop = await cropModel.findById(req.params.id);

    if (!crop) {
        return res.send("Crop not found");
    }

    res.render("editcrop", { crop });
});

app.post("/editcrop/:id", isLoggedIn, isFarmer, async(req, res) => {
    try {
        const { cropName, quantity, price } = req.body;

        await cropModel.findByIdAndUpdate(req.session.id, {
            cropName,
            quantity,
            price,
            farmerId: "demoFarmer"
        });

        res.redirect("/mylistings");

    } catch (err) {
        console.log(err);
        res.send("Error updating crop");
    }
});



app.post("/delete/:id", isLoggedIn, async(req, res) => {
    try {
        await cropModel.findByIdAndDelete(req.params.id);
        res.redirect("/mylistings");
    } catch (err) {
        res.send("Error in deleting crop: ", err);
    }
})

app.get("/marketplace", isLoggedIn, isBuyer, async(req, res) => {
    const crops = await cropModel.find().sort({ createdAt: -1 });
    res.render("marketplace", { crops });
});

app.get("/cropdetails/:id", async(req, res) => {

    const crop = await cropModel.findById(req.params.id);
    if (!crop) {
        return res.send("Crop not found");
    }
    res.render("cropdetailwithdeal", { crop });

});



app.get("/mylistings", isLoggedIn, isFarmer, async(req, res) => {
    const crops = await cropModel.find().sort({ createdAt: -1 });
    res.render("mylissting", { crops })
});

app.get("/makedeal/:cropId", async(req, res) => {
    const crop = await cropModel.findById(req.params.cropId);
    res.render("makedeal", { cropId: req.params.cropId, crop })
});




app.get("/buyerdeals", isLoggedIn, isBuyer, async(req, res) => {
    const farmerId = "demoFarmer";
    const buyerId = "demoBuyer";
    const deals = await dealModel.find({ buyerId }).populate("cropId").sort({ createdAt: -1 });

    res.render("buyerdeals", { deals });
})

app.get("/farmerdeals", isLoggedIn, isFarmer, async(req, res) => {
    const farmerId = "demoFarmer";

    const deals = await dealModel.find({ farmerId }).populate("cropId").sort({ createdAt: -1 });

    res.render("farmerdeals", { deals });
})




app.post("/deal/:cropId", isLoggedIn, async(req, res) => {
    try {
        const { offeredPrice, quantity } = req.body;
        const cropData = await cropModel.findById(req.params.cropId);

        await dealModel.create({
            cropId: cropData._id,
            offeredPrice,
            quantity,
            farmerId: "demoFarmer",
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

app.post("/deal/direct/:cropId", isLoggedIn, isBuyer, async(req, res) => {
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

app.post("/deal/accept/:id", isLoggedIn, isFarmer, async(req, res) => {
    await dealModel.findByIdAndUpdate(req.params.id, { status: "accepted" });
    res.redirect("/farmerdeals")
});

app.post("/deal/reject/:id", isLoggedIn, isFarmer, async(req, res) => {
    await dealModel.findByIdAndUpdate(req.params.id, { status: "rejected" });
    res.redirect("/farmerdeals")
});

app.post("/deletebuyerdeal/:id", isLoggedIn, isBuyer, async(req, res) => {
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

app.post("/signup", async (req, res) => {
    const { username, email, contact, location, password, role  } = req.body;

    const user = await userModel.create({
        username,
        email,
        contact,
        location,
        password,
        role
    });

    req.session.userId = user._id;
    req.session.role = user.role;

    if (user.role === "farmer") {
        res.redirect("/mylistings");
    } else {
        res.redirect("/marketplace");
    }
});

app.post("/login", async (req, res) => {
    const { email, password } = req.body;

    const user = await userModel.findOne({ email, password });

    if (!user) {
        return res.send("Invalid credentials");
    }

    req.session.userId = user._id;
    req.session.role = user.role;

    if (user.role === "farmer") {
        res.redirect("/mylistings");
    } else {
        res.redirect("/marketplace");
    }
});

app.get("/frontpage", (req, res) => {
    res.render("frontpage");
});

app.get("/logout", isLoggedIn, (req, res) => {
    req.session.destroy();
    res.redirect("/login");
});

app.get("/profile", isLoggedIn, async (req, res) => {


    if (!req.session.userId) {
        return res.redirect("/login");
    }

    let user = await userModel.findById(req.session.userId);

    res.render("profile", { user });
});

app.get("/buyerprofile", isLoggedIn, isBuyer, async (req, res) => {
    const farmerId = "demoFarmer";
    const buyerId = "demoBuyer";
    const deals = await dealModel.find({ buyerId }).populate("cropId");

    if (!req.session.userId) {
        return res.redirect("/login")
    }

    let user = await userModel.findById(req.session.userId);
    
    res.render("buyerProfile", { user, deals });
})



function isLoggedIn(req, res, next) {
    if (!req.session.userId) {
        return res.redirect("/login");
    }
    next();
};

function isFarmer(req, res, next) {
    if (req.session.role !== "farmer") {
        return res.send("Access denied");
    }
    next();
}

function isBuyer(req, res, next) {
    if (req.session.role !== "buyer") {
        return res.send("Access denied");
    }
    next();
}

app.get("/preview/:page", (req, res) => {
    console.log("Previewing:", req.params.page);

    res.render(req.params.page, {
        deals: [],
        crops: [],
        crop: {},
        user: {}
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});












