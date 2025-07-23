import mongoose from 'mongoose'
import { DB_NAME } from '../constants.js';
import dotenv from "dotenv"

const connDB = async()=>{

    try
    {
        console.log(process.env.MONGODB_URI)
        const conn = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        console.log("conn successful",conn.connection.host);
        
        
    } catch (error) 
    {
        console.log("connection unsucessfull  ", error);
        process.exit(1);
        
        
    }
}

export default connDB;
