const mongoose = require('mongoose');
const cities = require('./cities');
const { places, descriptors } = require('./seedHelpers');
const Campground = require('../models/campground');

mongoose.connect('mongodb://localhost:27017/yelp-camp')

const db = mongoose.connection;

db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
    console.log("Database connected");
});


const seedDb = async () => {
    await Campground.deleteMany({});

    for (let i = 0; i < 50; i++) {
        const random1000 = Math.floor(Math.random() * cities.length)
        const randomNmbrForPlaces = Math.floor(Math.random() * places.length)
        const randomNmbrForDescriptors = Math.floor(Math.random() * descriptors.length)
        const camp = new Campground({
            location: cities[random1000].city + " " + cities[random1000].state,
            title: descriptors[randomNmbrForDescriptors] + " " + places[randomNmbrForPlaces]

        })
        console.log(camp)
        await camp.save();
    }
}


seedDb();