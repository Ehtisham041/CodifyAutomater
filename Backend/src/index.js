import connDB from "./DB/conn.js"
import {app}from "./app.js"
import dotenv from 'dotenv';
dotenv.config();

connDB().
then(
()=>{
    app.listen(process.env.PORT || 8000 ,()=>{
    console.log(`server is running on port ${process.env.PORT || 8000}`)
}
    )
})
.catch((err) => {
  console.error('MongoDB connection error:', err);
});