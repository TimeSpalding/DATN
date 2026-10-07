package com.imagesearch.backend_java.ecommerce.service;

import com.imagesearch.backend_java.ecommerce.entity.Category;
import com.imagesearch.backend_java.ecommerce.entity.Product;
import com.imagesearch.backend_java.ecommerce.entity.ProductImage;
import com.imagesearch.backend_java.ecommerce.entity.ProductVariant;
import com.imagesearch.backend_java.ecommerce.enums.ProductStatus;
import com.imagesearch.backend_java.ecommerce.repository.CategoryRepository;
import com.imagesearch.backend_java.ecommerce.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Component
@Order(10)
@RequiredArgsConstructor
@Slf4j
public class EcommerceDataSeeder implements CommandLineRunner {

    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;

    @Override
    @Transactional
    public void run(String... args) {
        log.info("Checking e-commerce initial catalog data...");
        seedCategories();
        seedProducts();
        log.info("E-commerce catalog data verification complete.");
    }

    private void seedCategories() {
        if (categoryRepository.count() > 0) {
            log.info("Categories already exist (count: {}). Skipping category seeding.", categoryRepository.count());
            return;
        }

        log.info("Seeding initial product categories...");
        List<Category> categories = List.of(
                Category.builder().code("upper").name("Áo & Tops").sortOrder(1).active(true).build(),
                Category.builder().code("lower").name("Quần & Pants").sortOrder(2).active(true).build(),
                Category.builder().code("dress").name("Váy đầm & Dresses").sortOrder(3).active(true).build(),
                Category.builder().code("outerwear").name("Áo khoác & Outerwear").sortOrder(4).active(true).build(),
                Category.builder().code("accessories").name("Phụ kiện thời trang").sortOrder(5).active(true).build()
        );

        categoryRepository.saveAll(categories);
        log.info("Successfully seeded {} categories.", categories.size());
    }

    private void seedProducts() {
        if (productRepository.count() > 0) {
            log.info("Products already exist (count: {}). Skipping product seeding.", productRepository.count());
            return;
        }

        log.info("Seeding initial enterprise fashion products...");

        Category upper = categoryRepository.findByCode("upper").orElse(null);
        Category lower = categoryRepository.findByCode("lower").orElse(null);
        Category dress = categoryRepository.findByCode("dress").orElse(null);
        Category outerwear = categoryRepository.findByCode("outerwear").orElse(null);

        if (upper == null || lower == null) {
            log.error("Core categories missing. Cannot seed products.");
            return;
        }

        List<Product> products = new ArrayList<>();

        // Product 1: Áo Polo Dệt Kim Retro
        Product p1 = Product.builder()
                .category(upper)
                .sku("LAT-POLO-001")
                .name("Áo Polo Dệt Kim Họa Tiết Retro Khóa Zip")
                .subCategory("polo")
                .gender("men")
                .basePrice(BigDecimal.valueOf(489000))
                .originalPrice(BigDecimal.valueOf(590000))
                .discountPercent(17)
                .badge("Bán chạy")
                .material("Cotton Dệt Kim Co Giãn 4 Chiều")
                .origin("Việt Nam (Tiêu chuẩn xuất khẩu EU)")
                .description("Áo polo dệt kim phong cách retro cổ điển với khóa zip kim loại mạ bạc cao cấp. Phom dáng Regular-fit tôn dáng, sợi dệt bông tự nhiên mang lại cảm giác mềm mại và thoáng khí tuyệt đối cho cả ngày năng động.")
                .rating(4.9)
                .reviewsCount(64)
                .featured(true)
                .status(ProductStatus.ACTIVE)
                .variants(new ArrayList<>())
                .productImages(new ArrayList<>())
                .build();
        addVariants(p1, "LAT-POLO-001", List.of(
                new VariantSpec("S", "Xanh Navy", "#1e293b", 12),
                new VariantSpec("M", "Xanh Navy", "#1e293b", 28),
                new VariantSpec("L", "Xanh Navy", "#1e293b", 35),
                new VariantSpec("XL", "Xanh Navy", "#1e293b", 18),
                new VariantSpec("M", "Đen Charcoal", "#111827", 20),
                new VariantSpec("L", "Đen Charcoal", "#111827", 25)
        ));
        addImages(p1, List.of(
                new ImageSpec("/samples/cloth-1.jpg", true, 1),
                new ImageSpec("/samples/cloth-polo-black.jpg", false, 2),
                new ImageSpec("https://images.unsplash.com/photo-1625910513413-7e28ce19e5c7?auto=format&fit=crop&w=800&q=80", false, 3)
        ));
        products.add(p1);

        // Product 2: Áo Thun Cổ Tròn Graphic Owl Heavyweight
        Product p2 = Product.builder()
                .category(upper)
                .sku("LAT-TEE-002")
                .name("Áo Thun Cổ Tròn Graphic Owl Heavyweight 280gsm")
                .subCategory("t-shirt")
                .gender("unisex")
                .basePrice(BigDecimal.valueOf(350000))
                .originalPrice(BigDecimal.valueOf(420000))
                .discountPercent(16)
                .badge("Mới về")
                .material("100% Cotton Compact 280gsm")
                .origin("Việt Nam")
                .description("Áo phông unisex định lượng nặng 280gsm chống nhăn, giữ phom hoàn hảo sau nhiều lần giặt. Họa tiết in lụa thủ công cao cấp sắc nét, độ bền màu chuẩn công nghiệp.")
                .rating(4.8)
                .reviewsCount(42)
                .featured(true)
                .status(ProductStatus.ACTIVE)
                .variants(new ArrayList<>())
                .productImages(new ArrayList<>())
                .build();
        addVariants(p2, "LAT-TEE-002", List.of(
                new VariantSpec("S", "Trắng Ngà", "#f8fafc", 20),
                new VariantSpec("M", "Trắng Ngà", "#f8fafc", 35),
                new VariantSpec("L", "Trắng Ngà", "#f8fafc", 30),
                new VariantSpec("XL", "Trắng Ngà", "#f8fafc", 15),
                new VariantSpec("M", "Đen Jet Black", "#0f172a", 25),
                new VariantSpec("L", "Đen Jet Black", "#0f172a", 22)
        ));
        addImages(p2, List.of(
                new ImageSpec("/samples/cloth-2.webp", true, 1),
                new ImageSpec("/samples/cloth-white-tee.webp", false, 2),
                new ImageSpec("https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80", false, 3)
        ));
        products.add(p2);

        // Product 3: Váy Đầm Dài Linen Thắt Eo
        Product p3 = Product.builder()
                .category(dress != null ? dress : upper)
                .sku("LAT-DRS-003")
                .name("Váy Đầm Dài Linen Thắt Eo Nữ Tính Cao Cấp")
                .subCategory("dress")
                .gender("women")
                .basePrice(BigDecimal.valueOf(890000))
                .originalPrice(BigDecimal.valueOf(1050000))
                .discountPercent(15)
                .badge("Bán chạy")
                .material("100% Linen Pháp Tự Nhiên")
                .origin("Việt Nam")
                .description("Thiết kế đầm maxi chất liệu linen dệt mộc thoáng mát, thân váy xòe nhẹ thanh lịch cùng chi tiết đai vải thắt eo tôn dáng. Lựa chọn tuyệt vời cho các buổi dạo phố, du lịch biển hoặc sự kiện mùa hè.")
                .rating(5.0)
                .reviewsCount(58)
                .featured(true)
                .status(ProductStatus.ACTIVE)
                .variants(new ArrayList<>())
                .productImages(new ArrayList<>())
                .build();
        addVariants(p3, "LAT-DRS-003", List.of(
                new VariantSpec("S", "Beige Mộc", "#e7e5e4", 15),
                new VariantSpec("M", "Beige Mộc", "#e7e5e4", 25),
                new VariantSpec("L", "Beige Mộc", "#e7e5e4", 18),
                new VariantSpec("M", "Trắng Tinh Khôi", "#ffffff", 20)
        ));
        addImages(p3, List.of(
                new ImageSpec("https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=800&q=80", true, 1),
                new ImageSpec("https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=800&q=80", false, 2)
        ));
        products.add(p3);

        // Product 4: Quần Tây Nam Trousers Xếp Ly Form Suông
        Product p4 = Product.builder()
                .category(lower)
                .sku("LAT-TRS-004")
                .name("Quần Tây Xếp Ly Form Suông Sartorial Trousers")
                .subCategory("pants")
                .gender("men")
                .basePrice(BigDecimal.valueOf(590000))
                .originalPrice(BigDecimal.valueOf(690000))
                .discountPercent(14)
                .badge("Xu hướng")
                .material("Vải Tuyết Mưa Cao Cấp Chống Nhăn")
                .origin("Việt Nam")
                .description("Quần âu xếp ly đôi mang phong cách sartorial cổ điển Ý, ống suông rủ tự nhiên che khuyết điểm, cạp cao tôn dáng. Phù hợp phối cùng sơ mi, polo hoặc blazer lịch lãm.")
                .rating(4.7)
                .reviewsCount(36)
                .featured(false)
                .status(ProductStatus.ACTIVE)
                .variants(new ArrayList<>())
                .productImages(new ArrayList<>())
                .build();
        addVariants(p4, "LAT-TRS-004", List.of(
                new VariantSpec("S", "Xám Khói Charcoal", "#374151", 16),
                new VariantSpec("M", "Xám Khói Charcoal", "#374151", 24),
                new VariantSpec("L", "Xám Khói Charcoal", "#374151", 30),
                new VariantSpec("XL", "Xám Khói Charcoal", "#374151", 14),
                new VariantSpec("M", "Đen Midnight", "#111827", 22)
        ));
        addImages(p4, List.of(
                new ImageSpec("https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=800&q=80", true, 1),
                new ImageSpec("https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=800&q=80", false, 2)
        ));
        products.add(p4);

        // Product 5: Áo Khoác Blazer Nam Form Rộng Oversized
        Product p5 = Product.builder()
                .category(outerwear != null ? outerwear : upper)
                .sku("LAT-BLZ-005")
                .name("Áo Khoác Blazer Nam Form Rộng May Đo Oversized")
                .subCategory("blazer")
                .gender("men")
                .basePrice(BigDecimal.valueOf(1190000))
                .originalPrice(BigDecimal.valueOf(1390000))
                .discountPercent(14)
                .badge("Cao cấp")
                .material("Dạ Wool Pha Cashmere Mềm Mịn")
                .origin("Việt Nam (Gia công thủ công)")
                .description("Áo blazer 2 cúc phom rộng phong cách hiện đại tối giản. Lớp lót lụa habutai êm ái, đệm vai nhẹ tự nhiên tạo phom đứng dáng vững chãi.")
                .rating(4.9)
                .reviewsCount(51)
                .featured(true)
                .status(ProductStatus.ACTIVE)
                .variants(new ArrayList<>())
                .productImages(new ArrayList<>())
                .build();
        addVariants(p5, "LAT-BLZ-005", List.of(
                new VariantSpec("S", "Nâu Espresso", "#451a03", 10),
                new VariantSpec("M", "Nâu Espresso", "#451a03", 20),
                new VariantSpec("L", "Nâu Espresso", "#451a03", 18),
                new VariantSpec("XL", "Nâu Espresso", "#451a03", 8),
                new VariantSpec("M", "Đen Obsidian", "#09090b", 15)
        ));
        addImages(p5, List.of(
                new ImageSpec("https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=800&q=80", true, 1),
                new ImageSpec("https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80", false, 2)
        ));
        products.add(p5);

        // Product 6: Áo Sơ Mi Oxford Cotton Regular Fit
        Product p6 = Product.builder()
                .category(upper)
                .sku("LAT-SHT-006")
                .name("Áo Sơ Mi Dài Tay Oxford Cotton Dệt Nổi")
                .subCategory("shirt")
                .gender("men")
                .basePrice(BigDecimal.valueOf(450000))
                .originalPrice(BigDecimal.valueOf(520000))
                .discountPercent(13)
                .badge("Mới về")
                .material("100% Oxford Cotton 2 Lớp")
                .origin("Việt Nam")
                .description("Sơ mi vải Oxford với bề mặt dệt rổ đặc trưng, mềm mại, bền chắc và ít nhăn. Cổ button-down giữ dáng ve áo hoàn hảo cả ngày làm việc.")
                .rating(4.8)
                .reviewsCount(29)
                .featured(false)
                .status(ProductStatus.ACTIVE)
                .variants(new ArrayList<>())
                .productImages(new ArrayList<>())
                .build();
        addVariants(p6, "LAT-SHT-006", List.of(
                new VariantSpec("S", "Xanh Pastel Blue", "#93c5fd", 15),
                new VariantSpec("M", "Xanh Pastel Blue", "#93c5fd", 28),
                new VariantSpec("L", "Xanh Pastel Blue", "#93c5fd", 25),
                new VariantSpec("XL", "Xanh Pastel Blue", "#93c5fd", 12),
                new VariantSpec("M", "Trắng Pure White", "#ffffff", 30)
        ));
        addImages(p6, List.of(
                new ImageSpec("https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=800&q=80", true, 1),
                new ImageSpec("https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=800&q=80", false, 2)
        ));
        products.add(p6);

        // Product 7: Quần Jeans Ống Suông Vintage Denim 13oz
        Product p7 = Product.builder()
                .category(lower)
                .sku("LAT-JNS-007")
                .name("Quần Jeans Ống Suông Vintage Straight Denim 13oz")
                .subCategory("jeans")
                .gender("unisex")
                .basePrice(BigDecimal.valueOf(650000))
                .originalPrice(BigDecimal.valueOf(750000))
                .discountPercent(13)
                .badge("Bán chạy")
                .material("100% Cotton Denim 13oz Không Co Giãn")
                .origin("Việt Nam")
                .description("Chất liệu denim dày dặn chuẩn form classic, hiệu ứng wash màu xanh nhạt vintage tự nhiên. Độ bền vượt trội, mang đến phong cách thời trang đường phố bụi bặm.")
                .rating(4.9)
                .reviewsCount(73)
                .featured(true)
                .status(ProductStatus.ACTIVE)
                .variants(new ArrayList<>())
                .productImages(new ArrayList<>())
                .build();
        addVariants(p7, "LAT-JNS-007", List.of(
                new VariantSpec("S", "Xanh Wash Nhạt", "#60a5fa", 18),
                new VariantSpec("M", "Xanh Wash Nhạt", "#60a5fa", 32),
                new VariantSpec("L", "Xanh Wash Nhạt", "#60a5fa", 28),
                new VariantSpec("XL", "Xanh Wash Nhạt", "#60a5fa", 14),
                new VariantSpec("M", "Xanh Indigo Đậm", "#1e3a8a", 20)
        ));
        addImages(p7, List.of(
                new ImageSpec("https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=800&q=80", true, 1),
                new ImageSpec("https://images.unsplash.com/photo-1542272604-780c96856592?auto=format&fit=crop&w=800&q=80", false, 2)
        ));
        products.add(p7);

        // Product 8: Quần Short Kaki Đi Dạo Thoải Mái
        Product p8 = Product.builder()
                .category(lower)
                .sku("LAT-SHT-008")
                .name("Quần Short Kaki Cotton Dáng Regular Co Giãn Nhẹ")
                .subCategory("shorts")
                .gender("men")
                .basePrice(BigDecimal.valueOf(320000))
                .originalPrice(BigDecimal.valueOf(380000))
                .discountPercent(16)
                .badge("Mới về")
                .material("98% Cotton Twill + 2% Spandex")
                .origin("Việt Nam")
                .description("Quần đùi kaki dài trên gối thoáng mát, chất vải chéo twill dày dặn nhưng co giãn linh hoạt khi vận động. Cạp quần phối chun sườn êm ái.")
                .rating(4.7)
                .reviewsCount(22)
                .featured(false)
                .status(ProductStatus.ACTIVE)
                .variants(new ArrayList<>())
                .productImages(new ArrayList<>())
                .build();
        addVariants(p8, "LAT-SHT-008", List.of(
                new VariantSpec("S", "Beige Sand", "#d6d3d1", 14),
                new VariantSpec("M", "Beige Sand", "#d6d3d1", 26),
                new VariantSpec("L", "Beige Sand", "#d6d3d1", 24),
                new VariantSpec("XL", "Beige Sand", "#d6d3d1", 10),
                new VariantSpec("M", "Xanh Rêu Army", "#3f6212", 18)
        ));
        addImages(p8, List.of(
                new ImageSpec("https://images.unsplash.com/photo-1591195853828-11db59a44f6b?auto=format&fit=crop&w=800&q=80", true, 1),
                new ImageSpec("https://images.unsplash.com/photo-1562157873-818bc0726f68?auto=format&fit=crop&w=800&q=80", false, 2)
        ));
        products.add(p8);

        productRepository.saveAll(products);
        log.info("Successfully seeded {} products with variants and gallery images.", products.size());
    }

    private void addVariants(Product product, String baseSku, List<VariantSpec> specs) {
        int idx = 1;
        for (VariantSpec spec : specs) {
            ProductVariant variant = ProductVariant.builder()
                    .product(product)
                    .sku(baseSku + "-" + spec.size + "-" + idx++)
                    .size(spec.size)
                    .color(spec.color)
                    .colorHex(spec.colorHex)
                    .stockQuantity(spec.stock)
                    .active(true)
                    .build();
            product.getVariants().add(variant);
        }
    }

    private void addImages(Product product, List<ImageSpec> images) {
        for (ImageSpec spec : images) {
            ProductImage pi = ProductImage.builder()
                    .product(product)
                    .imageUrl(spec.url)
                    .isPrimary(spec.isPrimary)
                    .sortOrder(spec.order)
                    .build();
            product.getProductImages().add(pi);
        }
    }

    private record VariantSpec(String size, String color, String colorHex, int stock) {}
    private record ImageSpec(String url, boolean isPrimary, int order) {}
}
