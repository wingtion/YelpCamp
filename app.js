const express = require("express")
const app = express();
const path = require("path")
const mongoose = require("mongoose")
const Campground = require("./models/campground")
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const Joi = require("joi");
const Review = require('./models/review');
const session = require("express-session");
const flash = require("connect-flash");

mongoose.connect('mongodb://localhost:27017/yelp-camp')

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
    console.log("Database connected")
})

// Joi validation campgroundSchema (for server side validation)
const campgroundSchema = Joi.object({
    title: Joi.string().min(3).max(100).required(),
    price: Joi.number().min(0).required(),
    description: Joi.string().min(10).required(),
    location: Joi.string().min(3).required(),
    image: Joi.string().uri().required()  // Validates that the image URL is in the correct format
});

// Joi validation reviewSchema (for server side validation)
const reviewSchema = Joi.object({
    rating: Joi.number().min(1).max(5).required(),  // Rating must be between 1 and 5
    body: Joi.string().min(5).required()  // Review body should be at least 5 characters long
});

app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"))


// POST ve PATCH gibi isteklerde form verisinin req.body içinde düzgün okunmasını sağlar.
app.use(express.urlencoded({ extended: true }));

app.use(methodOverride("_method"));

app.use(express.static(path.join(__dirname)));

app.use(express.static(__dirname + "/node_modules/@fortawesome/fontawesome-free"));

app.use(express.static(path.join(__dirname, "public")));


// Define the session configuration object
const sessionConfig = {

    // Secret key used to sign the session ID cookie. It should be kept private and secure.
    secret: "thisshouldbeabettersecret",

    resave: false,

    saveUninitialized: true,

    // Configuration for the session cookie
    cookie: {
        // `httpOnly` makes the cookie inaccessible to JavaScript running in the browser,
        // which provides some protection against XSS (Cross-Site Scripting) attacks.
        httpOnly: true,

        // `expires` defines the exact expiration time of the cookie.
        // Here, it is set to one week from the current time
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,

        // `maxAge` specifies the maximum lifetime of the cookie in milliseconds.
        // After this time, the cookie will expire. 
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
}

// Use the session middleware in the Express application with the above configuration
app.use(session(sessionConfig));

app.use(flash());

app.use((req, res, next) => {
    res.locals.success = req.flash("success");  //for successfull operations
    res.locals.error = req.flash("error");     //for error or not succesfull operations
    next();
})



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

    // Validate the incoming data (server side validation)
    const { error } = campgroundSchema.validate(req.body);
    if (error) {
        return res.status(400).send(error.details[0].message); // Send validation error message to client
    }

    const campgroundTitle = req.body.title;
    const campgroundPrice = req.body.price;
    const campgroundDescription = req.body.description;
    const campgroundLocation = req.body.location;
    const campgroundImgURL = req.body.image;

    const newCampground = await new Campground({
        title: campgroundTitle, price: campgroundPrice, description: campgroundDescription,
        location: campgroundLocation, image: campgroundImgURL
    })

    await newCampground.save();

    req.flash("success", "Successfully created a new campground.")


    res.redirect("/campgrounds/" + newCampground._id)
})

//form to edit campground
app.get("/campgrounds/:id/edit", async (req, res) => {
    const campgroundId = req.params.id;

    const campground = await Campground.findById(campgroundId);

    res.render("campgrounds/edit", { campground })

})

//updating campgrounds on server
app.patch("/campgrounds/:id", async (req, res) => {

    // Validate the incoming data (server side validation)
    const { error } = campgroundSchema.validate(req.body);
    if (error) {
        return res.status(400).send(error.details[0].message); // Send validation error message to client
    }

    const campgroundTitle = req.body.title;
    const campgroundPrice = req.body.price;
    const campgroundDescription = req.body.description;
    const campgroundLocation = req.body.location;
    const campgroundImgURL = req.body.image;

    const campgroundId = req.params.id;

    await Campground.findByIdAndUpdate(campgroundId, {
        title: campgroundTitle,
        price: campgroundPrice,
        description: campgroundDescription,
        location: campgroundLocation,
        image: campgroundImgURL
    });

    req.flash("success", "Succesfully updated campground.")

    res.redirect("/campgrounds/" + campgroundId)
})

app.delete("/campgrounds/:id", async (req, res) => {
    const campgroundId = req.params.id;


    const deletedCampground = await Campground.findByIdAndDelete(campgroundId);

    req.flash("success", "Successfully deleted the campground.");

    res.redirect("/campgrounds");


})

//creating new review on server
app.post("/campgrounds/:id/reviews", async (req, res) => {
    const campground = await Campground.findById(req.params.id);

    // Validate the review data (server side validation)
    const { error } = reviewSchema.validate(req.body.review); // Validate the review data
    if (error) {
        return res.status(400).send(error.details[0].message); // Send validation error message to client
    }

    // If validation passes, create and save the review
    const review = new Review(req.body.review); // Formdan gelen veriyi al
    campground.reviews.push(review);
    await review.save();
    await campground.save();

    req.flash("success", "Succesfully created a new review.")

    res.redirect(`/campgrounds/${campground._id}`);
});


app.delete("/campgrounds/:id/reviews/:reviewId", async (req, res) => {
    const { id, reviewId } = req.params;

    await Campground.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
    await Review.findByIdAndDelete(reviewId);

    req.flash("success", "Successfully deleted the review.");

    res.redirect(`/campgrounds/${id}`);
});

//form to show detatils of the campground
app.get("/campgrounds/:id", async (req, res) => {

    const campgroundId = req.params.id;

    const campground = await Campground.findById(campgroundId).populate('reviews');

    //if the campground deleted it will be undefined so if we try to open it after deleted we get 
    //"Cannot find that campground" error message
    if (!campground) {
        req.flash("error", "Cannot find that campground");
        res.redirect("/campgrounds");
    }

    res.render("campgrounds/show", { campground })
})


app.listen("3000", function () {
    console.log("Serving on port 3000");
})