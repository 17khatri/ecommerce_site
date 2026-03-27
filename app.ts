import express from "express"
import userRoutes from "./src/modules/user/user.route.js"
import categoryRoutes from "./src/modules/categories/category.route.js"
import brandRoutes from "./src/modules/brands/brands.route.js"
import productRoutes from "./src/modules/products/products.route.js"
import productImageRoutes from "./src/modules/product_images/productImage.route.js"
import cartRoutes from "./src/modules/carts/carts.route.js"
import orderRoutes from "./src/modules/orders/order.route.js"

const app = express()

app.use(express.json())

app.use("/uploads", express.static("uploads"))

app.use("/api/users", userRoutes)
app.use("/api/categories", categoryRoutes)
app.use("/api/brands", brandRoutes)
app.use("/api/products", productRoutes)
app.use("/api/product-images", productImageRoutes)
app.use("/api/carts", cartRoutes)
app.use("/api/orders", orderRoutes)

export default app