import { prisma } from "../lib/prisma";
import { seedDataProducts } from "../modules/products/data";

async function seedProducts() {
  for (const seedDataProduct of seedDataProducts) {
    const { category, ...product } = seedDataProduct;

    const categorySlug = category.toLowerCase().replaceAll(" ", "-");

    const productData = {
      ...product,
      Category: {
        connectOrCreate: {
          where: { slug: categorySlug },
          create: {
            slug: categorySlug,
            name: category,
          },
        },
      },
    };

    const newProduct = await prisma.product.upsert({
      where: { slug: productData.slug },
      update: productData,
      create: productData,
    });

    console.info(`Seeded product: 🥐 ${newProduct.name}`);
  }
}

seedProducts();
