import "./config/env.js"
import app from "../app.js"

app.listen(3001, () => {
    console.log("server is running on http://localhost:3001")
})