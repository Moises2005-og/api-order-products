import express from 'express';
import publicRoutes from "./routes/public/index.js";
import privateRoutes from "./routes/private/index.js";
import auth from "./middleware/auth.js";

const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json());

app.use("/", publicRoutes);
app.use("/", auth, privateRoutes)

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
})