var express = require("express");
var router = express.Router();
var Campground = require("../models/campground");
var middleware = require("../middleware/index.js");
var geocoder = require("geocoder");

//Index - show all campgrounds
router.get("/", function(req, res){
    //Get all campgrounds from DB
    Campground.find({}, function(err, allCampgrounds){
       if(err){
           console.log(err);
       } else{
           console.log(allCampgrounds);
           res.render("campgrounds/index", {campgrounds:allCampgrounds, page:"campgrounds"});
       }
    });
});

// create new campground
router.post("/", middleware.isLoggedIn, function(req, res){
    var name = req.body.name;
    var price = req.body.price;
    var image = req.body.image;
    var desc = req.body.description;
    var author = {
        id: req.user._id,
        username: req.user.username
    }
    geocoder.geocode(req.body.location, function(err, data){
        var lat = data.results[0].geometry.location.lat;
        var lng = data.results[0].geometry.location.lng;
        var location = data.results[0].formatted_address;
        var newCampground = {name:name, price:price, image:image, description:desc, author:author, location:location, lat:lat, lng:lng};
        Campground.create(newCampground, function(err, newlyCreated){
            if(err){
                console.log(err);
            } else {
                console.log(newlyCreated);
                res.redirect("/campgrounds");
            }
        });
    });
    
    // var newCampground= {name:name, price:price, image:image, description:desc, author:author};
    // //create a new campground and save to DB
    // Campground.create(newCampground, function(err, newlyCreated){
    //     if(err){
    //         console.log(err);
    //     } else{
    //         console.log(newlyCreated);
    //         res.redirect("/campgrounds");
    //     }
    // });
});

// new - show form to create new campground
router.get("/new", middleware.isLoggedIn, function(req, res){
    res.render("campgrounds/new");
});

//SHOW - show more info about one campground
router.get("/:id", function(req, res){
    Campground.findById(req.params.id).populate("comments").exec(function(err, foundCampground){
        if(err || !foundCampground){
            req.flash("error", "Campground not found");
            res.redirect("back");
        } else {
            //render show template with that campground
            res.render("campgrounds/show", {campground: foundCampground});
        }
    });
});

// EDIT CAMPGROUND ROUTE
router.get("/:id/edit", middleware.checkCampgroundOwnership, function(req, res){
    Campground.findById(req.params.id, function(err, foundCampground){
        res.render("campgrounds/edit", {campground:foundCampground});
    });
});


// UPDATE CAMPGROUND ROUTE
router.put("/:id", middleware.checkCampgroundOwnership, function(req, res){
    //find and update the correct campground
    geocoder.geocode(req.body.campground.location, function(err,data){
        req.body.campground.lat = data.results[0].geometry.location.lat;
        req.body.campground.lng = data.results[0].geometry.location.lng;
        req.body.campground.location = data.results[0].formatted_address;
        Campground.findByIdAndUpdate(req.params.id, req.body.campground, function(err, updatedCampground){
            if(err){
                req.flash("error", err.message);
                res.redirect("back");
            } else {
                req.flash("success", "Successfully updated the campground!");
                res.redirect("/campgrounds/"+req.params.id);
            }
        });
    });
    // console.log(req.body.campground.location);
    // Campground.findByIdAndUpdate(req.params.id, req.body.campground, function(err, updatedCampground){
    //     if(err){
    //         res.redirect("/campgrounds");
    //     } else {
    //         res.redirect("/campgrounds/" + req.params.id);
    //     }
    // });
});

//Destroy campground route
router.delete("/:id", middleware.checkCampgroundOwnership, function(req, res){
    Campground.findByIdAndRemove(req.params.id, function(err){
        if(err){
            res.redirect("/campgrounds");
        } else {
            res.redirect("/campgrounds");
        }
    });
});


module.exports = router;