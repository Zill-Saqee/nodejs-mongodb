const mongoose=require("mongoose");
const validator=require("validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const WishList = require("./wishlist");

const profileSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    age:{
        type:Number,
        required:true,
        validate:(value)=>{
            if(value<0){
                throw new Error ("negative number can not be provided as your age")
            }
        }
    },
    graduate:{
        type:Boolean,
        required:true,
        default:false
    },
    email:{
        type:String,
        lowercase:true,
        required:true,
        unique : true,
        validate:(value)=>{
            if(!validator.isEmail(value)){
                console.log("email is invalid.")
                throw new Error("email provided is invalid")
            }
        }
    },
    password:{
        type:String,
        required:true,
        trim:true,
        minlength:7,
        validate : (value) => {

        }
    },
    tokens:[{
        token:{
            type:String ,
            required:true
        }
    }],
    avatar : {
        type:Buffer
    }
} , {
        toObject:{ virtuals : true },
        timestamps:true
    }
)

profileSchema.virtual('wishList' , {
    ref :'WishList',
    localField:'_id',
    foreignField:'wishedBy'
})

profileSchema.pre("remove", async function (next){
    const profile = this ;
    await WishList.deleteMany({
        wishedBy : profile._id
    });
    next();
})

profileSchema.pre("save" , async function (next){
    let profile = this;
    // console.log(profile.password , " updated password");
    if(profile.isModified("password")){
        profile.password = await bcrypt.hash(profile.password , 8);
    }
    // console.log(profile.password , " hashed password");
   next();
})

profileSchema.statics.findByCredentials = async (email,password) => {
    const profile = await Profiles.findOne({ email });
    if(!profile){
        throw new Error("Unable to login");;
    }
    const isMatch = await bcrypt.compare(password,profile.password);
    console.log(isMatch)
    if(!isMatch){
        throw new Error("Unable to login")
    }
    return profile;
}

profileSchema.methods.generateAuthToken = async function () {
    const profile = this;
    const token = jwt.sign({_id:profile._id.toString()},"thisIsMySecretKey");
    profile.tokens = profile.tokens.concat({token});
    await profile.save();
    return token;
}


profileSchema.statics.sendPublicDataOnly = async function  (records) {
   const profiles = records ;
   const publicProfilesData = profiles.map((d)=>{
        const p = d.toObject();
         delete p.password;
         delete p.tokens ;
         delete p.__v;
         delete p._id;
         delete p.avatar;
         return p;
   })

   return publicProfilesData;

    // const profile = this ;
    // const publicProfileData = profile.toObject();

    // delete publicProfileData.tokens;
    // delete publicProfileData.password;

    // return publicProfileData ;
}

profileSchema.methods.sendPublicDataOnly = async function  () {
    const profile = this ;
    const publicProfileData = profile.toObject();

    delete publicProfileData.tokens;
    delete publicProfileData.password;

    return publicProfileData ;
}


const Profiles=mongoose.model("profiles",profileSchema)

module.exports=Profiles;