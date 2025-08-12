#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Function to create a scenario from configuration
function createScenario(config) {
    const projectRoot = '/Users/Aram/Documents/Github/qi';
    const scenarioFolder = path.join(projectRoot, config.id);
    
    try {
        // 1. Create the scenario folder
        if (!fs.existsSync(scenarioFolder)) {
            fs.mkdirSync(scenarioFolder, { recursive: true });
            console.log(`✅ Created folder: ${scenarioFolder}`);
        } else {
            console.log(`⚠️ Folder already exists: ${scenarioFolder}`);
            return false;
        }
        
        // 2. Read the template file
        const templatePath = path.join(projectRoot, 'template.html');
        let templateContent = fs.readFileSync(templatePath, 'utf8');
        
        // 3. Create the SCENARIO_CONFIG string
        const scenarioConfigString = `const SCENARIO_CONFIG = ${JSON.stringify(config, null, 12)
            .split('\n')
            .map((line, index) => index === 0 ? line : '        ' + line)
            .join('\n')};`;
        
        // 4. Replace the SCENARIO_CONFIG in the template
        const configRegex = /const SCENARIO_CONFIG = \{[\s\S]*?\};/;
        templateContent = templateContent.replace(configRegex, scenarioConfigString);
        
        // 5. Update the relative path to style.css (go up one directory)
        templateContent = templateContent.replace(
            '<link rel="stylesheet" href="style.css">',
            '<link rel="stylesheet" href="../style.css">'
        );
        
        // 6. Write the modified template to the new folder as index.html
        const newFilePath = path.join(scenarioFolder, 'index.html');
        fs.writeFileSync(newFilePath, templateContent);
        console.log(`✅ Created scenario file: ${newFilePath}`);
        
        return true;
    } catch (error) {
        console.error('❌ Error creating scenario:', error);
        return false;
    }
}

// Check if running from command line with JSON argument
if (require.main === module) {
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        console.log('Usage: node create_scenario.js \'{"id":"scenario_name","name":"Scenario Name","description":"...","characters":[...]}\'');
        process.exit(1);
    }
    
    try {
        const config = JSON.parse(args[0]);
        const success = createScenario(config);
        process.exit(success ? 0 : 1);
    } catch (error) {
        console.error('Invalid JSON configuration:', error.message);
        process.exit(1);
    }
}

module.exports = { createScenario };