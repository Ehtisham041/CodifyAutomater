import express from "express"
import cors from"cors"
import mongoose from "mongoose"

const app =express()


app.use(express.json())
app.use(express.urlencoded({extended :true}))
app.use(express.static("public"));

export  {app}