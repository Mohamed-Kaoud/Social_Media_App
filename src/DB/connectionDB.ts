import mongoose from "mongoose";
import { DB_URI } from "../config/config.service";

const checkConnectionDB = async () => {
    await mongoose.connect(DB_URI)
    .then(() => {
        console.log(`DB connected successfully ✅`);
    })
    .catch((err) => {
        console.log(`Fail to connect DB ❌`, err);
    })
}

export default checkConnectionDB