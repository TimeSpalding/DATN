import { CATALOG_PRODUCTS } from "./catalogData";

export const getMockSearchResponse = ({
  page = 0,
  size = 20,
  searchType = "SEMANTIC",
}) => {
  const startIndex = page * size;
  const pageProducts = CATALOG_PRODUCTS.slice(startIndex, startIndex + size);

  return {
    success: true,
    data: {
      searchId: 1001,
      searchType,
      processingTimeMs: 142,
      results: pageProducts.map((prod, index) => {
        const rankPosition = startIndex + index + 1;
        const score = Math.max(0.68, 0.98 - rankPosition * 0.018);

        return {
          imageId: prod.id,
          isMock: true,
          canBookmark: true,
          rankPosition,
          score,
          originalFilename: `${prod.sku}.jpg`,
          name: prod.name,
          category: prod.category,
          price: prod.price,
          rawPrice: prod.rawPrice,
          badge: prod.badge,
          material: prod.material,
          imageUrl: prod.image,
          thumbnailUrl: prod.image,
          mimeType: "image/jpeg",
          width: 800,
          height: 1000,
        };
      }),
      pageNumber: page,
      pageSize: size,
      totalElements: CATALOG_PRODUCTS.length,
      totalPages: Math.ceil(CATALOG_PRODUCTS.length / size),
    },
    error: null,
    timestamp: new Date().toISOString(),
  };
};
