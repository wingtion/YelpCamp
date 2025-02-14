const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Review = require('./review'); // Import the Review model  

const CampgroundSchema = new Schema({
    title: String,
    image: String,
    price: Number,
    description: String,
    location: String,
    reviews: [
        {
            type: Schema.Types.ObjectId,
            ref: "Review"
        }
    ]
});

// Middleware to delete all associated reviews when a campground is deleted
//!!if we dont use this and we delete a campground the reviews of it still remains at database
CampgroundSchema.pre('findOneAndDelete', async function (next) {
    const campground = await this.model.findOne(this.getFilter());
    if (campground) {
        await Review.deleteMany({ _id: { $in: campground.reviews } });
    }
    next();
});

module.exports = mongoose.model("Campground", CampgroundSchema);