const express = require("express");
const WishList = require("../models/wishlist");
const auth = require("../middlewares/auth");
const routes = express.Router();

// create a wish route
routes.post("/addWish" , auth ,async (req,res) => {
    try {
        const wish = WishList({
            ...req.body,
            wishedBy : req.profile._id
        });
       await wish.save();
       res.status(201).send(wish); 
    } 
    catch (error) {
        res.status(400).send(error) ;   
    }
})
// get all your wishes
routes.get("/wishlist" , auth , async (req,res) => {
    try 
    {
        // const wishlist =await WishList.find({
        //     wishedBy:req.profile._id
        // })

        const { status,limit,skip,sortField,order } = req.query ;
        // console.log(typeof(status))

        const match = {};
        if(status){
            match.status = status === "true";
        }
        const sort = {}
        if(sortField){
            sort[sortField] = (order==="desc") ? -1 : 1; 
        }

        const wishlist = await req.profile.populate({
                path :'wishList',
                match,
                options:{
                    limit : parseInt(limit),
                    skip:   parseInt(skip),
                    sort
                }
        })
        .execPopulate();
        // console.log(wishlist);
        if(!wishlist){
            res.status(404).send("No wish found.")
        }
        // const wishesPublicData =await WishList.sendPublicData(wishlist);
        // res.send(wishesPublicData)
        res.send(wishlist.wishList)
    } 
    catch (error) {
        res.status(500).send(error);
    }
})

// get a wish by id
routes.get("/wishlist/:id" , auth , async (req,res) => {
    const _id = req.params.id;
    try {
        const wish = await WishList.findOne({
            _id , 
            wishedBy : req.profile._id
        })
        if(!wish){
            res.status(404).send("No Wish Found.")
        }
        const data = await wish.populate('wishedBy').execPopulate();
        // console.log(data);
        const wishPublicData = await wish.sendPublicData(wish);
        res.send(wishPublicData);
    } 
    catch (error) {
        res.status(500).send(error);
    }
})

// delete your wish by id
routes.delete("/wishlist/:id" , auth , async (req,res) => {
    const _id = req.params.id ;
    try {
        const wish = await WishList.findOneAndDelete({
            _id ,
            wishedBy : req.profile._id
        });
        if(!wish){
            res.status(404).send("No wish found to delete.")
        }
        res.send(wish);
    } 
    catch (error) {
        res.status(500).send(error);
    }
})

module.exports = routes ;