import fs from 'fs/promises';
import path from 'path';
import fetch from 'node-fetch';
import { AppDataSource } from "../database/typeorm-db.js";
import { Product } from "../app/models/Product.entity.js";
import { Category } from "../app/models/Category.entity.js";
import { dbConnection } from '../database/typeorm-db.js';
import R2FileStorage from '../app/services/R2FileStorage.js';

interface ProductJson {
    category: string;
    name: string;
    description: string;
    image_url: string;
}

async function migrateFromRootDirectory(rootDirectoryPath: string) {
    if (!AppDataSource.isInitialized) {
        console.error("Database connection not initialized. migrateFromRootDirectory should be called after dbConnection().then(...)");
        return;
    }

    const r2Storage = new R2FileStorage();
    console.log("R2FileStorage service instantiated.");

    const categoryCache: { [name: string]: Category } = {};

    let subDirectories: string[];
    try {
        console.log(`Reading root directory: ${rootDirectoryPath}`);
        const allEntries = await fs.readdir(rootDirectoryPath, { withFileTypes: true });
        subDirectories = allEntries
            .filter(dirent => dirent.isDirectory())
            .map(dirent => path.join(rootDirectoryPath, dirent.name));
        
        if (subDirectories.length === 0) {
            console.warn(`No subdirectories found in root directory: ${rootDirectoryPath}. Exiting migration.`);
            return;
        }
        console.log(`Found ${subDirectories.length} subdirectories to process: ${subDirectories.join(', ')}`);

    } catch (readRootError: any) {
        console.error(`Failed to read root directory ${rootDirectoryPath}:`, readRootError.message || readRootError);
        return; // Stop if we can't even read the root
    }


    for (const jsonFolderPath of subDirectories) { // Loop through each discovered subdirectory
        console.log(`\nProcessing subdirectory: ${jsonFolderPath}`);
        try {
            console.log(`Reading JSON files from: ${jsonFolderPath}`);
            const files = await fs.readdir(jsonFolderPath);
            const jsonFiles = files.filter(file => path.extname(file).toLowerCase() === '.json');
            console.log(`Found ${jsonFiles.length} JSON files in ${jsonFolderPath}.`);

            if (jsonFiles.length === 0) {
                console.warn(`No JSON files found in ${jsonFolderPath}. Skipping.`);
                continue;
            }

            for (const file of jsonFiles) {
                const filePath = path.join(jsonFolderPath, file);
                console.log(`Processing ${file} from ${jsonFolderPath}...`);

                try {
                    const fileContent = await fs.readFile(filePath, 'utf-8');
                    const productData: ProductJson = JSON.parse(fileContent);

                    let categoryEntity = categoryCache[productData.category];
                    if (!categoryEntity) {
                        categoryEntity = await AppDataSource.manager.findOneBy(Category, { name: productData.category });
                        if (!categoryEntity) {
                            console.log(`Creating new category: ${productData.category}`);
                            categoryEntity = new Category();
                            categoryEntity.name = productData.category;
                            await AppDataSource.manager.save(categoryEntity);
                        }
                        categoryCache[productData.category] = categoryEntity;
                    }

                    let r2PublicUrl: string | null = null;
                    let r2Key: string | null = null;

                    if (productData.image_url) {
                        try {
                            console.log(`Downloading image from source: ${productData.image_url}`);
                            const response = await fetch(productData.image_url);
                            if (!response.ok) {
                                throw new Error(`Failed to download image: ${response.status} ${response.statusText}`);
                            }
                            const imageBuffer = await response.buffer();

                            const fileExtension = path.extname(productData.image_url).split('?')[0] || '.jpg';
                            const safeProductName = productData.name.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
                            r2Key = `products/images/${safeProductName}-${Date.now()}${fileExtension}`;

                            console.log(`Uploading image to R2 with key: ${r2Key}`);
                            r2PublicUrl = await r2Storage.uploadFile(imageBuffer, r2Key);
                            console.log(`Image uploaded successfully. R2 Public URL: ${r2PublicUrl}`);

                        } catch (uploadError: any) {
                            console.error(`Failed to process image for ${productData.name} from ${productData.image_url}:`, uploadError.message);
                            r2PublicUrl = null;
                            r2Key = null;
                        }
                    } else {
                        console.warn(`No source image_url found in JSON for product: ${productData.name}`);
                    }

                    const product = new Product();
                    product.product_name = productData.name;
                    product.description = productData.description;
                    product.categories = [categoryEntity];
                    product.hidden = false;

                    if (r2PublicUrl && r2Key) {
                        product.image_url = r2PublicUrl;
                        product.image_key = r2Key;
                    }

                    await AppDataSource.manager.save(product);
                    console.log(`Saved product: ${product.product_name} (from ${file})`);

                } catch (parseOrDbError: any) {
                    console.error(`Error processing file ${file} from ${jsonFolderPath} or saving product:`, parseOrDbError.message);
                }
            }
            console.log(`Finished processing JSON files in ${jsonFolderPath}.`);

        } catch (readDirError: any) {
            console.error(`Migration script failed while processing subdirectory ${jsonFolderPath}:`, readDirError.message || readDirError);
            // Decide if you want to continue with other subdirectories or stop
            // For now, it will log the error and attempt to process the next subdirectory
        }
    }
    console.log("\nAll subdirectories in the root path processed. JSON migration finished.");
}

// --- Specify the single root directory path here ---
const ROOT_DIRECTORY_PATH: string = "C:/Users/Timvt/Downloads/product-json-data"; // Replace with your actual root folder

if (!ROOT_DIRECTORY_PATH) {
    console.error("Root directory path is not specified. Exiting.");
    process.exit(1);
}

dbConnection().then(() => {
    console.log("Database connection established via dbConnection().");
    migrateFromRootDirectory(ROOT_DIRECTORY_PATH).catch(err => {
        console.error("Migration script execution failed:", err);
    }).finally(async () => {
        if (AppDataSource.isInitialized) {
            console.log("Closing database connection...");
            await AppDataSource.destroy();
            console.log("Database connection closed.");
        }
        process.exit(0);
    });
}).catch(err => {
    console.error("Failed to establish database connection via dbConnection():", err);
    process.exit(1);
});