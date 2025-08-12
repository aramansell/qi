# QI Training Scenario Creator

## Overview
This is an educator interface for creating Quality Improvement (QI) training scenarios. Educators can create interactive scenarios where students interview different healthcare staff members to investigate quality issues.

## Features
- 🎓 **Easy-to-use form interface** for creating scenarios
- 👥 **Dynamic character creation** with customizable roles, attitudes, and knowledge
- 📁 **Automatic folder generation** for each scenario
- 🎯 **Template-based system** for consistent scenario structure

## Setup Instructions

### 1. Install Dependencies
First, install the required Node.js packages:

```bash
cd /Users/Aram/Documents/Github/qi
npm install
```

### 2. Start the Server
Run the server to enable scenario creation:

```bash
npm start
# or
node server.js
```

The server will run on `http://localhost:3001`

### 3. Access the Educator Interface
Open your browser and navigate to:
```
http://localhost:3001/educator/
```

## How to Use

### Creating a New Scenario

1. **Open the Educator Interface** at `http://localhost:3001/educator/`

2. **Fill in Scenario Details:**
   - **Scenario Name**: A descriptive title for your QI scenario
   - **Description**: Brief explanation of the quality issue to investigate

3. **Add Characters:**
   - Click the "➕ Add Character" button to add a new character
   - For each character, provide:
     - **Occupation/Role**: Their job title (e.g., Physician, Lab Tech, Nurse Manager)
     - **Attitude/Personality**: How they behave and respond to questions
     - **Knowledge/Information**: What they know about the quality issue

4. **Create the Scenario:**
   - Click "🚀 Create Scenario" to generate the scenario
   - The system will:
     - Create a new folder with a sanitized name
     - Copy and configure the template file
     - Set up all character configurations

5. **Access Your Scenario:**
   - Navigate to `http://localhost:3001/[scenario_folder_name]/`
   - Students can now use this scenario for training

## File Structure

```
qi/
├── educator/           # Educator interface
│   └── index.html     # Scenario creation form
├── template.html      # Base template for scenarios
├── style.css          # Shared styles
├── server.js          # Express server for handling creation
├── create_scenario.js # CLI tool for scenario creation
└── [scenario_folders] # Generated scenario folders
```

## Example Scenario Configuration

When you create a scenario, it generates a configuration like this:

```javascript
const SCENARIO_CONFIG = {
    id: 'lab_timing_delays',
    name: 'Lab Timing Delays Investigation',
    description: 'Investigate why morning labs are not being drawn...',
    characters: [
        {
            id: 'unique-id-1',
            occupation: 'Physician',
            attitude: 'Frustrated but helpful...',
            knowledge: 'Lab results should be back by 7:30 AM...'
        },
        // More characters...
    ]
};
```

## Tips for Creating Effective Scenarios

1. **Diverse Perspectives**: Include characters from different departments and levels
2. **Realistic Attitudes**: Make characters behave authentically (some helpful, some resistant)
3. **Distributed Knowledge**: No single character should have all the answers
4. **Complex Problems**: Create scenarios that require talking to multiple people
5. **Clear Learning Objectives**: Design scenarios around specific QI concepts

## Troubleshooting

### Server Not Running
If you see "Server not running" error:
1. Make sure you've installed dependencies: `npm install`
2. Start the server: `npm start`
3. Check that port 3001 is not in use

### Scenario Not Creating
- Ensure all required fields are filled
- Check that the scenario name doesn't already exist
- Look at the browser console for detailed error messages

## Manual Scenario Creation

If the server isn't available, you can manually create scenarios:

1. Create a new folder in the project root
2. Copy `template.html` to the new folder as `index.html`
3. Edit the `SCENARIO_CONFIG` constant with your scenario details
4. Update the CSS path to `../style.css`

## Development

To run in development mode with auto-restart:
```bash
npm run dev
```

To create a scenario via command line:
```bash
node create_scenario.js '{"id":"test","name":"Test Scenario","description":"Test","characters":[...]}'
```

## Support

For issues or questions, check the browser console for detailed error messages and ensure the server is running properly.