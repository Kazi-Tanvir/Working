import { Router } from "express";
import { createProduct, deleteProduct, getProduct, getProducts, updateProduct } from "../controllers/product.controller";
import { shouldBeAdmin } from "../middleware/authMiddleware";

const router:Router = Router();

router.get("/test", (req, res) => {
    res.json({ message: "Welcome to the Product Services API!" });
});

router.post("/", shouldBeAdmin, createProduct);
router.get("/", getProducts);
router.get("/:id", getProduct);
router.put("/:id", shouldBeAdmin, updateProduct);
router.delete("/:id", shouldBeAdmin, deleteProduct);

export default router;