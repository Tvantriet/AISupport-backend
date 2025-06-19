//script to take datasource get all products with category laptop, take the name and check if it contains APPLE or MAC if so add a macOS category and then also give that product that category by creating an entity of the linking table, if it doesnt contain apple or mac then make it windowsOS if contains chromebook give it chromeOS
import { AppDataSource } from '../database/typeorm-db.js'; // Assuming script is in express/src/scripts/
import { Product } from '../app/models/Product.entity.js';
import { Category } from '../app/models/Category.entity.js';
import { In } from 'typeorm';

// --- Configuration ---
const LAPTOP_CATEGORY_NAME_MARKER = 'LAPTOPS'; // Will be used for case-insensitive search
const MACOS_CATEGORY_NAME = 'macOS';
const WINDOWSOS_CATEGORY_NAME = 'WindowsOS';
const CHROMEOS_CATEGORY_NAME = 'ChromeOS';

async function getOrCreateCategory(name: string): Promise<Category> {
    const categoryRepository = AppDataSource.getRepository(Category);
    let category = await categoryRepository.findOne({ where: { name } });

    if (!category) {
        console.log(`Category "${name}" not found, creating it...`);
        category = categoryRepository.create({ name });
        await categoryRepository.save(category);
        console.log(`Category "${name}" created with ID: ${category.id}`);
    } else {
        console.log(`Category "${name}" found with ID: ${category.id}`);
    }
    return category;
}

async function addOSCategoriesToLaptops() {
    if (!AppDataSource.isInitialized) {
        console.log('Initializing data source...');
        await AppDataSource.initialize();
        console.log('Data source initialized.');
    }

    const productRepository = AppDataSource.getRepository(Product);

    // 1. Find or create the target OS categories
    const macOSCategory = await getOrCreateCategory(MACOS_CATEGORY_NAME);
    const windowsOSCategory = await getOrCreateCategory(WINDOWSOS_CATEGORY_NAME);
    const chromeOSCategory = await getOrCreateCategory(CHROMEOS_CATEGORY_NAME);

    // 2. Fetch all products with their categories
    // We need to find products that are in *any* category whose name contains 'Laptop'
    // This is a bit more complex with TypeORM relations directly in find.
    // A simpler approach is to fetch all products with categories, then filter.
    // For a more optimized DB query, you might use QueryBuilder.

    console.log('Fetching all products with their categories...');
    const allProducts = await productRepository.find({
        relations: ['categories'], // Crucial to load existing categories
    });

    console.log(`Found ${allProducts.length} products in total. Filtering for laptops...`);

    const laptopProducts: Product[] = [];
    for (const product of allProducts) {
        if (product.categories.some(cat => cat.name.toUpperCase().includes(LAPTOP_CATEGORY_NAME_MARKER))) {
            laptopProducts.push(product);
        }
    }

    console.log(`Found ${laptopProducts.length} products categorized as laptops.`);
    if (laptopProducts.length === 0) {
        console.log("No products found in a 'Laptop' category. Exiting.");
        if (AppDataSource.isInitialized) {
            await AppDataSource.destroy();
        }
        return;
    }

    let productsUpdatedCount = 0;

    for (const product of laptopProducts) {
        const productNameUpper = product.product_name.toUpperCase();
        let targetOSCategory: Category | null = null;
        let changed = false;

        if (productNameUpper.includes('APPLE') || productNameUpper.includes('MAC')) {
            targetOSCategory = macOSCategory;
        } else if (productNameUpper.includes('CHROMEBOOK')) {
            targetOSCategory = chromeOSCategory;
        } else {
            // Default to WindowsOS if not Apple/Mac or Chromebook
            targetOSCategory = windowsOSCategory;
        }

        if (targetOSCategory) {
            // Check if the product already has this OS category
            const hasOSCategory = product.categories.some(cat => cat.id === targetOSCategory!.id);

            if (!hasOSCategory) {
                console.log(`Product "${product.product_name}" (ID: ${product.id}) needs OS category: "${targetOSCategory.name}". Adding...`);
                product.categories.push(targetOSCategory);
                // productRepository.save(product) will update the join table.
                // We can save all at once for efficiency, but saving one by one is safer for debugging.
                await productRepository.save(product);
                changed = true;
                productsUpdatedCount++;
                console.log(`Added "${targetOSCategory.name}" to "${product.product_name}".`);
            } else {
                console.log(`Product "${product.product_name}" (ID: ${product.id}) already has OS category: "${targetOSCategory.name}". Skipping.`);
            }
        }
    }

    if (productsUpdatedCount > 0) {
        console.log(`Successfully updated ${productsUpdatedCount} products with OS categories.`);
    } else {
        console.log("No products required an OS category update.");
    }

    if (AppDataSource.isInitialized) {
        console.log('Destroying data source...');
        await AppDataSource.destroy();
        console.log('Data source destroyed.');
    }
}

addOSCategoriesToLaptops().catch(error => {
    console.error("Error processing laptop OS categories:", error);
    if (AppDataSource && AppDataSource.isInitialized) {
        AppDataSource.destroy().then(() => console.log("Data source destroyed after error."))
                               .catch(destroyError => console.error("Error destroying data source after error:", destroyError));
    }
    process.exit(1);
});