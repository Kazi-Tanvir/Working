import { Request, Response } from "express";
import { Prisma, prisma } from "@repo/product-db";

export const createCategory = async (req: Request, res: Response) => {
  const data: Prisma.CategoryCreateInput = req.body;
  const category = await prisma.category.create({ data });
  res.status(201).json(category);
};
export const updateCategory = (req: Request, res: Response) => {
  const { id } = req.params;
  const data: Prisma.CategoryUpdateInput = req.body;

  const category = prisma.category.update({
    where: { id: Number(id) },
    data,
  });
  res.status(200).json(category);
};
export const deleteCategory = (req: Request, res: Response) => {
  const { id } = req.params;

  const category = prisma.category.delete({
    where: { id: Number(id) },
  });
  res.status(200).json(category);
};
export const getCategories = (req: Request, res: Response) => {
  const categories = prisma.category.findMany();
  res.status(200).json(categories);
};
