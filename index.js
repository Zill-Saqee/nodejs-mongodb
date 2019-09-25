const express=require("express");
const multer = require("multer");
require("./mongoose/db");
const Profiles=require("./models/profiles");
const auth = require("./middlewares/auth");
const wishListRoutes = require("./routes/wishList-routes");
const app = express();

app.use(express.json());    // it tells express that receiving data will be in json format
app.use(wishListRoutes);
app.use((req,res,next)=>{
    console.error("No error occurred just kidding");
    next();
})

app.get("/",(req,res)=>{
    console.log(req.query)
    if(req.query.name){
        res.status(200).send(`name '${req.query.name}' was sent to server as parameter in query strings`)
   }
   else {
       res.status(400).send("name was not provided.")
   }
})

app.post("/addProfile" , async (req,res)=>{
    try {
        var profile=await new Profiles(req.body); // It returns new record according to data provided even without db connection?
        const newRec=await profile.save();
        const token = await profile.generateAuthToken();
        res.send({newRec,token});
    } catch (error) {
        res.status(400).send("Error Occurred." + error);
    }
    // profile.save()
    // .then((data)=>{
    //     console.log(data)
    //     res.status(200).send("new record added in database." + profile)
    // })
    // .catch((e)=>{
    //     // console.log(e);
    //     res.status(400).send("Bad Request.Sent data was invalid." + e.message)
    // })
})

app.get("/profiles/:id", auth , async (req,res)=>{
    try {
        // const profile = await findById(req.params.id);
        const profile = req.profile;
        if(!profile || profile._id.toString() !== req.params.id){
            res.status(404).send("No profile found")
        } 
        res.send(profile)
    } 
    catch (error) {
        res.status(500).send("Internal Server Error")
    }
})

app.get("/profiles",async (req,res)=>{
    try {
        const profiles = await Profiles.find({});
        if(!profiles || profiles.length < 1){
            res.status(404).send("No Record Found.");
        }
        const publicProfilesData = await Profiles.sendPublicDataOnly(profiles);
        res.send(publicProfilesData)
    } catch (error) {
        res.status(500).send("Internal Server Error.");
    }
    // Profiles.find({})
    // .then((profiles)=>{
    //     if(profiles.length < 1){
    //         res.status(404).send("No record found");
    //     }
    //     res.send(profiles)
    // })
    // .catch((e)=>{
    //     res.status(500).send("Internal Server error occurred.");
    // })
})


app.patch("/profile/:id" , async (req,res)=>{
    const changedProfile = req.body ;
    const fieldsToUpdate = Object.keys(changedProfile);
    const fieldsInModal = ["name","age","graduate","email","password"];
    const isUpdateAllowed = fieldsToUpdate.every((field)=>{
        return fieldsInModal.includes(field);
    })
    console.log(isUpdateAllowed);
    if(!isUpdateAllowed){
        res.status(400).send({error:"invalid fields for updation."})
    }
    else {
        try {
            // const profile =await Profiles.findByIdAndUpdate(req.params.id,req.body,{
            //     new : true , runValidators:true
            // })
            console.log(req.params.id);
            console.log(typeof(req.params.id))
            const id = req.params.id;
            const profile = await Profiles.findOne({_id:id});
            console.log(profile)
            if(!profile){
                res.status(404).send("No record found to update.")
            }
            Object.assign(profile,changedProfile); 
            await profile.save();
            res.send(profile);
        }
        catch (error) {
            res.status(400).send(error)
        }
    }
})
app.delete("/profile/:id" , async (req,res)=>{
    try {
        const profile = await Profiles.findByIdAndDelete(req.params.id);
        if(!profile){
            res.status(404).send("Profile does not exist.")
        }
        res.send(profile)
    } catch (error) {
        res.status(500).send("Internal Server Error Occurred.")
    }
})

// delete your profile
app.delete("/profiles/deleteMyProfile", auth , async (req,res) => {
    try {
        await req.profile.remove();
        res.send(req.profile)
    } 
    catch (error) {
        res.status(500).send(error)
    }
})

app.get("/myProfile", auth , async (req,res) => {
    try {
        const profile = req.profile ;
        delete profile.avatar;
        // const publicProfileData = await profile.sendPublicDataOnly();
    //     await publicProfileData.populate("wishList").execPopulate();
    //    res.send(publicProfileData);
        const data = await profile.populate('wishList').execPopulate();
        res.send({data , wishList:data.wishList});
    } 
    catch (error) {
            res.status(500)
    }
})

//  Upload an Image
    const UploadImage = multer({
        limits :{
            fileSize : 2000000
        },
        fileFilter (req,file,cb) {
            if(!file.originalname.match(/\.(jpg|jpeg|png)$/)){
                return cb(new Error("please upload an image"))
            }
           cb(undefined,true);
        }
    })
    app.post("/profiles/myAvatar" , auth , UploadImage.single("avatar") , async (req,res) => {
        if(!req.file){
            console.log(req.file)
            res.status(400).send("Please select your profile image first");
        }
            req.profile.avatar = req.file.buffer ;
            const data = await req.profile.save() ;
            res.send(data);   
    },(error,req,res,next) => {
        res.status(500).send(error.message)
    })
// Retrieve Your Profile Image
    app.get("/myProfile/myImage", auth , async (req,res) => {
        try {
            const profile = req.profile ;
            if(!req.profile.avatar){
                res.status(404).send("Not found. Please upload your profile image.")
            }
            res.set("Content-type" , "image/png");
            res.send(profile.avatar);
        } 
        catch (error) {
            res.status(500).send("Internal Server Error")    
        }
    })

// Delete Your Profile Image 
app.delete("/myProfile/deleteMyImage" , auth , async (req,res) => {
    try {
        const profile = req.profile ;
        if(!profile.avatar){
            res.status(404).send(new Error("No profile Image found."))
        }
        profile.avatar = undefined ;
        await profile.save();
        res.send();
    } 
    catch (error) {
        res.status(500).send("Internal Server Error Occurred");
    }
})

app.post("/profiles/login" , async (req,res) => {
    try {
        console.log(req.body.email , req.body.password)
        const profile = await Profiles.findByCredentials(req.body.email , req.body.password);
        const token = await profile.generateAuthToken();
        const publicData = await profile.sendPublicDataOnly();
        res.send({publicData,token});
    } catch (error) {
        res.status(400).send("error occurred" + error);
    }
})

app.post("/profiles/logout" , auth , async (req,res) => {
    try {
        const { profile , token } = req;
        profile.tokens = profile.tokens.filter((t)=> t.token!==token )
        console.log(profile);

        await profile.save();
        res.send();
    } 
    catch (error) {
        res.status(400).send();
    }
})

app.get("*",(req,res)=>{
   res.status(500).send("<h2>Invalid URL</h2>")
})

const port=process.env.PORT || 5001;
app.listen(port , ()=>{
    console.log(`server is up on port ${port}`);
})