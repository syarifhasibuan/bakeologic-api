import { z } from "zod";

import { SeedProductSchema } from "../product/schema";

export type SeedProduct = z.infer<typeof SeedProductSchema>;

export const seedDataProducts: SeedProduct[] = [
  {
    slug: "butter-croissant",
    name: "Butter Croissant",
    price: 10,
    categorySlug: "pastries",
    featured: true,
    images: [
      {
        url: "https://media.istockphoto.com/id/1494437052/fr/photo/croissant-et-pain-au-chocolat-sur-planche-de-bois.jpg?s=612x612&w=0&k=20&c=n_WFRLWhoaodKtlPoNYuXyTjKZCgz8Y5vGYwyt2zltU=",
        altText: "Butter Croissant",
      },
    ],
  },
  {
    slug: "flan-nature",
    name: "Flan Nature",
    price: 10,
    categorySlug: "pastries",
    images: [
      {
        url: "https://media.istockphoto.com/id/1151266653/fr/photo/flan.jpg?s=612x612&w=0&k=20&c=z6-2yBkykk6GGHU5Ql_I8uxnfYcWnjXavzlX3M9oUso=",
        altText: "Flan Nature",
      },
    ],
  },

  {
    slug: "pain-au-chocolat",
    name: "Pain au Chocolat",
    price: 10,
    categorySlug: "pastries",
    featured: true,
    images: [
      {
        url: "https://media.istockphoto.com/id/672982342/fr/photo/three-pain-au-chocolat.jpg?s=612x612&w=0&k=20&c=39H5GMmoPsIn5BeooqFGovtexnAyC2ro1BBhGseOOO8=",
        altText: "Pain au Chocolat",
      },
    ],
  },
  {
    slug: "cafe-au-lait",
    name: "Café au Lait",
    price: 10,
    categorySlug: "beverages",
    images: [
      {
        url: "https://media.istockphoto.com/id/505168330/fr/photo/caf%C3%A9-tasse-de-caf%C3%A9-avec-les-grains-de-caf%C3%A9-et-de-b%C3%A2tons-de-cannelle.jpg?s=612x612&w=0&k=20&c=Tqy_hbEGlgzWJxHFn0H_fuvvvzHAwLgqHN350dxttT0=",
        altText: "Café au Lait",
      },
    ],
  },
  {
    slug: "french-baguette",
    name: "French Baguette",
    price: 10,
    categorySlug: "breads",
    featured: true,
    images: [
      {
        url: "https://media.istockphoto.com/id/166578145/fr/photo/baguettes-de-pain.jpg?s=612x612&w=0&k=20&c=F2_xC144R7CZ8pl-3BYmCOyzK21rSrnXlOCElCdf8j0=",
        altText: "Baguette",
      },
    ],
  },
  {
    slug: "sandwich-poulet-mayo",
    name: "Sandwich Poulet Mayo",
    price: 10,
    categorySlug: "sandwiches",
    images: [
      {
        url: "https://media.istockphoto.com/id/535466213/fr/photo/sandwich.jpg?s=612x612&w=0&k=20&c=6prAdceabsf4kCuRJBngJUKYRoRdpXKu4Z81KY6YfOk=",
        altText: "Chicken Sandwich",
      },
    ],
  },
];
