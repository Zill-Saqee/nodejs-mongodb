const mongoose=require("mongoose");

mongoose.connect("mongodb://127.0.0.1:27017/mydb-mongoose",{
    useNewUrlParser:true,
    useCreateIndex:true,
    useFindAndModify:false
},()=>console.log("database connected"))
