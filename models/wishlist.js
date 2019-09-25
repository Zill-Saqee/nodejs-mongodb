const mongoose =require("mongoose");

const wishSchema = new mongoose.Schema({
    wish : {
        type: String ,
        required:true,
        unique:true
    },
    wishedBy : {
        type:mongoose.Schema.Types.ObjectId,
        required:true,
        ref : "profiles"
    },
    status : {
        type:Boolean,
        default :false
    }
},{
    toObject : { virtuals:true },
    timestamps:true
})
wishSchema.statics.sendPublicData = async function (wishes){
        const wishesPublicData=await wishes.map((w) => {
        const wish = w.toObject();
        delete wish._id ;
        delete wish.__v;
        return wish
    });
    // console.log(wishesPublicData)
    return wishesPublicData ;
}
wishSchema.methods.sendPublicData = async function () {
    const wish = this ;
    const wishPublicData = wish.toObject();
    console.log(wish.wishedBy.name);
    delete wishPublicData.__v ;
    delete wishPublicData._id;
    delete wishPublicData.wishedBy._id;
    delete wishPublicData.wishedBy.__v;
    delete wishPublicData.wishedBy.password;
    delete wishPublicData.wishedBy.tokens;

    return wishPublicData;
}
const WishList = mongoose.model("WishList" , wishSchema);
module.exports = WishList;