const express = require("express")
const app = express();
const path = require("path")
const mongoose = require("mongoose")
const Campground = require("./models/campground")
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");

mongoose.connect('mongodb://localhost:27017/yelp-camp')

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
    console.log("Database connected")
})

app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"))

// POST ve PATCH gibi isteklerde form verisinin req.body içinde düzgün okunmasını sağlar.
app.use(express.urlencoded({ extended: true }));

app.use(methodOverride("_method"));

app.get("/", (req, res) => {
    res.render("home");
})

//showing all campgrounds
app.get("/campgrounds", async (req, res) => {

    const campgrounds = await Campground.find({})

    res.render("campgrounds/index", { campgrounds });
})

//form to create new campground
app.get("/campgrounds/new", (req, res) => {
    res.render("campgrounds/new");
})

//creating new campground on server
app.post("/campgrounds", async (req, res) => {
    const campgroundTitle = req.body.title;
    const campgroundPrice = req.body.price;
    const campgroundDescription = req.body.description;
    const campgroundLocation = req.body.location;

    const newCampground = await new Campground({
        title: campgroundTitle, price: campgroundPrice, description: campgroundDescription,
        location: campgroundLocation
    })

    await newCampground.save();

    res.redirect("/campgrounds")
})

//form to edit campground
app.get("/campgrounds/:id/edit", async (req, res) => {
    const campgroundId = req.params.id;

    const campground = await Campground.findById(campgroundId);

    res.render("campgrounds/edit", { campground })

})

//updating campgrounds on server
app.patch("/campgrounds/:id", async (req, res) => {
    const campgroundTitle = req.body.title;
    const campgroundPrice = req.body.price;
    const campgroundDescription = req.body.description;
    const campgroundLocation = req.body.location;

    const campgroundId = req.params.id;

    await Campground.findByIdAndUpdate(campgroundId, {
        title: campgroundTitle,
        price: campgroundPrice,
        description: campgroundDescription,
        location: campgroundLocation
    });

    res.redirect("/campgrounds")
})

app.delete("/campgrounds/:id", async (req, res) => {
    const campgroundId = req.params.id;


    const deletedCampground = await Campground.findByIdAndDelete(campgroundId);

    res.redirect("/campgrounds");


})

//form to show detatils of the campground
app.get("/campgrounds/:id", async (req, res) => {

    const campgroundId = req.params.id;

    const campground = await Campground.findById(campgroundId);

    res.render("campgrounds/show", { campground })
})


app.listen("3000", function () {
    console.log("Serving on port 3000");
})