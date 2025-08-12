const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Function to create a scenario
function createScenario(config) {
    const projectRoot = __dirname;
    const scenarioFolder = path.join(projectRoot, config.id);
    
    try {
        // 1. Create the scenario folder
        if (!fs.existsSync(scenarioFolder)) {
            fs.mkdirSync(scenarioFolder, { recursive: true });
            console.log(`✅ Created folder: ${scenarioFolder}`);
        } else {
            throw new Error(`Folder already exists: ${config.id}`);
        }
        
        // 2. Read the template file
        const templatePath = path.join(projectRoot, 'template.html');
        let templateContent = fs.readFileSync(templatePath, 'utf8');
        
        // 3. Create the SCENARIO_CONFIG string with proper formatting
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
        
        return { success: true, folder: config.id };
    } catch (error) {
        console.error('❌ Error creating scenario:', error);
        throw error;
    }
}

// API endpoint to create a scenario
app.post('/api/create-scenario', (req, res) => {
    try {
        const config = req.body;
        
        // Validate required fields
        if (!config.id || !config.name || !config.description || !config.characters) {
            return res.status(400).json({ 
                error: 'Missing required fields' 
            });
        }
        
        if (config.characters.length === 0) {
            return res.status(400).json({ 
                error: 'At least one character is required' 
            });
        }
        
        const result = createScenario(config);
        res.json({ 
            success: true, 
            message: `Scenario "${config.name}" created successfully!`,
            folder: result.folder 
        });
    } catch (error) {
        res.status(500).json({ 
            error: error.message 
        });
    }
});

// API endpoint to list existing scenarios
app.get('/api/scenarios', (req, res) => {
    try {
        const projectRoot = __dirname;
        const folders = fs.readdirSync(projectRoot, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory())
            .filter(dirent => !dirent.name.startsWith('.') && 
                             dirent.name !== 'node_modules' && 
                             dirent.name !== 'educator')
            .map(dirent => dirent.name);
        
        res.json({ scenarios: folders });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 QI Scenario Server running on http://localhost:${PORT}`);
    console.log(`📝 Educator interface: http://localhost:${PORT}/educator/`);
});