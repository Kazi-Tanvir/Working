import { Router } from "express";
import { createCategory, deleteCategory, getCategories, updateCategory } from "../controllers/category.controller";
import { shouldBeAdmin } from "../middleware/authMiddleware";

const router:Router = Router();

router.get("/test", (req, res) => {
    res.json({ message: "Welcome to the Category Services API!" });
});

router.post("/",shouldBeAdmin, createCategory);
router.get("/", getCategories);
router.put("/:id", shouldBeAdmin, updateCategory);
router.delete("/:id", shouldBeAdmin, deleteCategory);

export default router;