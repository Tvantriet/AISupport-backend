// CommonJS version of the conversion script
const fs = require('fs');
const readline = require('readline');
const path = require('path');

console.log("Starting conversion (CommonJS version)...");

// File paths
const inputPath = 'C:\\Users\\Timvt\\Downloads\\batch_output.jsonl';
const outputPath = 'C:\\Users\\Timvt\\Downloads\\formatted_tickets.json';

async function convertJsonlToStructuredJson() {
  console.log(`Reading from ${inputPath}...`);
  
  // Check if input file exists
  if (!fs.existsSync(inputPath)) {
    throw new Error(`Input file not found: ${inputPath}`);
  }
  
  // Initialize category buckets
  const categoryMap = {
    "Laptop": [],
    "WindowsOS": [],
    "macOS": []
  };
  
  // Initialize product-specific map
  const productMap = {};
  
  // Read the JSONL file
  let fileStream;
  try {
    fileStream = fs.createReadStream(inputPath);
  } catch (err) {
    throw new Error(`Failed to open input file: ${err.message}`);
  }
  
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  for await (const line of rl) {
    try {
      const data = JSON.parse(line);
      const customId = data.custom_id;
      
      // Skip if invalid response
      if (!data.response || data.response.status_code !== 200 || 
          !data.response.body || !data.response.body.choices || 
          !data.response.body.choices[0] || !data.response.body.choices[0].message || 
          !data.response.body.choices[0].message.content) {
        console.log(`Skipping invalid entry: ${customId}`);
        continue;
      }
      
      try {
        // Parse the content (it's a string containing JSON)
        const content = JSON.parse(data.response.body.choices[0].message.content);
        
        if (!Array.isArray(content.tickets)) {
          console.log(`No tickets array found in entry: ${customId}`);
          continue;
        }
        
        // Format each ticket as "User: ... \n Assistant: ..."
        const formattedTickets = content.tickets.map((ticket) => 
          `User: ${ticket.userMessage} \n Assistant: ${ticket.assistantMessage}`
        );
        
        // Assign to correct category
        if (customId.includes("laptops, these should be applicable to all laptops regardless of OS")) {
          categoryMap.Laptop.push(...formattedTickets);
        } else if (customId.includes("windows laptops")) {
          categoryMap.WindowsOS.push(...formattedTickets);
        } else if (customId.includes("macbooks")) {
          categoryMap.macOS.push(...formattedTickets);
        } else if (customId.includes("support tickets for the laptop:")) {
          // Extract product name from format: "Generate 100 support tickets for the laptop: \"Product Name\"
          const productMatch = customId.match(/for the laptop:\s*"?([^"]+)"?/i);
          if (productMatch && productMatch[1]) {
            const productName = productMatch[1].trim().replace(/\\$/, ''); // Remove trailing backslash if present
            if (!productMap[productName]) {
              productMap[productName] = [];
            }
            productMap[productName].push(...formattedTickets);
            console.log(`Added ${formattedTickets.length} tickets for product: ${productName}`);
          } else {
            console.log(`Could not extract product name from: ${customId}`);
          }
        } else {
          // This might be a product-specific batch in another format
          // Try generic extraction by removing common prefixes
          let productName = customId
            .replace(/Generate\s+\d+\s+support\s+tickets\s+for\s+/i, '')
            .replace(/Support\s+tickets\s+for\s+/i, '')
            .trim();
            
          if (productName.startsWith('"') && productName.includes('"')) {
            productName = productName.split('"')[1].trim();
          }
          
          console.log(`Extracted product name: "${productName}" from custom_id: "${customId}"`);
          
          if (!productMap[productName]) {
            productMap[productName] = [];
          }
          productMap[productName].push(...formattedTickets);
        }
      } catch (parseErr) {
        console.error(`Error parsing content from ${customId}: ${parseErr.message}`);
      }
    } catch (lineErr) {
      console.error(`Error processing line: ${lineErr.message}`);
    }
  }
  
  // Create the final structure
  const result = [];
  
  // Add main categories
  for (const category in categoryMap) {
    const queries = categoryMap[category];
    if (queries.length > 0) {
      result.push({
        custom_id: category,
        queries
      });
    }
  }
  
  // Add product-specific categories
  for (const product in productMap) {
    const queries = productMap[product];
    if (queries.length > 0) {
      result.push({
        custom_id: product,
        queries
      });
    }
  }
  
  // Write to output file
  console.log(`Writing ${result.length} categories to ${outputPath}...`);
  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
  
  // Summary
  console.log("\nConversion Summary:");
  console.log(`- Laptop: ${categoryMap.Laptop.length} tickets`);
  console.log(`- WindowsOS: ${categoryMap.WindowsOS.length} tickets`);
  console.log(`- macOS: ${categoryMap.macOS.length} tickets`);
  console.log(`- Products: ${Object.keys(productMap).length} products with tickets`);
  console.log(`Total categories: ${result.length}`);
  console.log(`Output written to: ${outputPath}`);
}

// Run the conversion
convertJsonlToStructuredJson().catch(err => {
  console.error("Conversion failed:", err);
  process.exit(1);
}); 