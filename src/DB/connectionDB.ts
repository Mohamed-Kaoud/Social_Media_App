import mongoose from "mongoose";
import { DB_URI, DB_URI_ONLINE } from "../config/config.service";

const checkConnectionDB = async () => {
    await mongoose.connect(DB_URI_ONLINE)
    .then(() => {
        console.log(`DB connected successfully ✅`);
    })
    .catch((err) => {
        console.log(`Fail to connect DB ❌`, err);
    })
}

export default checkConnectionDB